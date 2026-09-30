import { DestroyRef, effect, inject, Injectable, Injector, signal } from '@angular/core';
import Lenis from 'lenis';
import { registerGsap, ScrollTrigger } from '../gsap';
import { MotionService } from './motion.service';

export interface ScrollToOptions {
  offset?: number;
  duration?: number;
  immediate?: boolean;
  onComplete?: () => void;
}

/**
 * Owns smooth scrolling. Lenis drives the page and is synced with ScrollTrigger through
 * the GSAP ticker. With reduced motion on, native scrolling is used instead.
 */
@Injectable({ providedIn: 'root' })
export class ScrollService {
  private readonly motion = inject(MotionService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);

  private lenis: Lenis | null = null;
  private tickerFn: ((time: number) => void) | null = null;
  private directionTrigger: ScrollTrigger | null = null;
  private refreshTimer: ReturnType<typeof setTimeout> | undefined;
  private initialized = false;
  private lockCount = 0;
  private nativeVelocity = 0;

  private readonly directionState = signal<1 | -1>(1);
  private readonly pastHeroState = signal(false);

  /** 1 when scrolling down, -1 when scrolling up. Changes rarely, safe to bind in templates. */
  readonly direction = this.directionState.asReadonly();
  /** True once the user has scrolled past the first 120px. */
  readonly scrolled = this.pastHeroState.asReadonly();

  constructor() {
    this.destroyRef.onDestroy(() => this.teardown());
  }

  /** Starts smooth scrolling. Call once from the root component after first render. */
  init(): void {
    if (!this.motion.isBrowser || this.initialized) return;
    this.initialized = true;
    registerGsap();

    effect(
      () => {
        const reduced = this.motion.reduced();
        if (reduced) {
          this.destroyLenis();
        } else {
          this.createLenis();
        }
        this.requestRefresh();
      },
      { injector: this.injector },
    );

    this.directionTrigger = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        const dir = self.direction === -1 ? -1 : 1;
        if (dir !== this.directionState()) this.directionState.set(dir);
        const past = self.scroll() > 120;
        if (past !== this.pastHeroState()) this.pastHeroState.set(past);
        if (!this.lenis) this.nativeVelocity = self.getVelocity();
      },
    });
  }

  /** Current scroll velocity in px/frame (Lenis) or a normalised native estimate. */
  get velocity(): number {
    return this.lenis ? this.lenis.velocity : this.nativeVelocity / 60;
  }

  scrollTo(target: string | HTMLElement | number, options: ScrollToOptions = {}): void {
    if (!this.motion.isBrowser) return;
    const { offset = 0, duration = 1.6, immediate = false, onComplete } = options;

    if (this.lenis) {
      this.lenis.scrollTo(target, {
        offset,
        duration,
        immediate,
        force: true,
        easing: (t: number) => 1 - Math.pow(1 - t, 4),
        onComplete: () => onComplete?.(),
      });
      return;
    }

    const el = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target;
    const top =
      typeof el === 'number' ? el : el ? el.getBoundingClientRect().top + window.scrollY + offset : 0;
    window.scrollTo({ top, behavior: 'auto' });
    onComplete?.();
  }

  /** Locks page scrolling (menus, modals, preloader). Calls are reference counted. */
  lock(): void {
    this.lockCount++;
    this.lenis?.stop();
    if (this.motion.isBrowser && !this.lenis) document.documentElement.style.overflow = 'hidden';
  }

  unlock(): void {
    this.lockCount = Math.max(0, this.lockCount - 1);
    if (this.lockCount > 0) return;
    this.lenis?.start();
    if (this.motion.isBrowser) document.documentElement.style.overflow = '';
  }

  /**
   * Debounced ScrollTrigger refresh. Deferred sections call this after they render so
   * pinned sections further down recalculate their start and end positions.
   */
  requestRefresh(): void {
    if (!this.motion.isBrowser) return;
    clearTimeout(this.refreshTimer);
    this.refreshTimer = setTimeout(() => {
      ScrollTrigger.sort();
      ScrollTrigger.refresh();
    }, 120);
  }

  private createLenis(): void {
    if (this.lenis) return;
    const gsap = registerGsap();
    this.lenis = new Lenis({
      autoRaf: false,
      lerp: 0.09,
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.4,
      anchors: { offset: -8 },
    });
    this.lenis.on('scroll', ScrollTrigger.update);
    this.tickerFn = (time: number) => this.lenis?.raf(time * 1000);
    gsap.ticker.add(this.tickerFn);
    gsap.ticker.lagSmoothing(0);
    if (this.lockCount > 0) this.lenis.stop();
  }

  private destroyLenis(): void {
    if (!this.lenis) return;
    const gsap = registerGsap();
    if (this.tickerFn) gsap.ticker.remove(this.tickerFn);
    this.tickerFn = null;
    this.lenis.destroy();
    this.lenis = null;
  }

  private teardown(): void {
    clearTimeout(this.refreshTimer);
    this.directionTrigger?.kill();
    this.destroyLenis();
  }
}
