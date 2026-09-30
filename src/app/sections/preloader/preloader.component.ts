import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import { registerGsap } from '../../core/gsap';
import { ClockService, HandAngles } from '../../core/services/clock.service';
import { MotionService } from '../../core/services/motion.service';
import { PreloadService } from '../../core/services/preload.service';
import { ScrollService } from '../../core/services/scroll.service';
import { PRELOADER } from '../../data/site';
import { SvgWatchFaceComponent } from '../../shared/ui/svg-watch-face.component';

const RING_RADIUS = 96;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;
const MIN_DURATION_MS = 2200;
const SAFETY_TIMEOUT_MS = 8000;

/**
 * "Winding" preloader. The hands sweep and stop at 12:00 while a crown-winding ring fills
 * with real loading progress (fonts and the hero scene). At 100% the dial zooms toward the
 * camera and dissolves into the hero. Skipped instantly for reduced motion.
 */
@Component({
  selector: 'app-preloader',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SvgWatchFaceComponent],
  templateUrl: './preloader.component.html',
  styleUrl: './preloader.component.scss',
})
export class PreloaderComponent {
  protected readonly copy = PRELOADER;
  protected readonly ringRadius = RING_RADIUS;
  protected readonly ringLength = RING_LENGTH;

  private readonly preload = inject(PreloadService);
  private readonly motion = inject(MotionService);
  private readonly scroll = inject(ScrollService);
  private readonly clock = inject(ClockService);
  private readonly injector = inject(Injector);

  private readonly root = viewChild<ElementRef<HTMLElement>>('root');
  private readonly dial = viewChild<ElementRef<HTMLElement>>('dial');

  protected readonly visible = signal(true);
  protected readonly shown = signal(0);
  protected readonly angles = signal<HandAngles>({ hours: 300, minutes: 60, seconds: 0 });
  protected readonly percent = computed(() => Math.round(this.shown() * 100));
  protected readonly dashOffset = computed(() => RING_LENGTH * (1 - this.shown()));

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      if (this.motion.reduced()) {
        this.preload.completeAll();
        this.preload.markDone();
        this.visible.set(false);
        return;
      }

      const gsap = registerGsap();
      const started = performance.now();
      this.scroll.lock();

      // Hands sweep from the real time and settle exactly on 12:00.
      const now = this.clock.continuousAngles();
      const hands = { ...now };
      const turns = (deg: number, extra: number) => Math.ceil(deg / 360) * 360 + extra * 360;
      gsap.to(hands, {
        hours: turns(now.hours, 1),
        minutes: turns(now.minutes, 3),
        seconds: turns(now.seconds, 6),
        duration: 2,
        ease: 'power3.inOut',
        onUpdate: () => this.angles.set({ ...hands }),
      });

      // Smoothly follow real progress.
      const display = { value: 0 };
      const follow = effect(
        () => {
          const target = this.preload.progress();
          gsap.to(display, {
            value: target,
            duration: 0.6,
            ease: 'power2.out',
            overwrite: true,
            onUpdate: () => this.shown.set(display.value),
          });
        },
        { injector: this.injector },
      );

      this.preload.report('fonts', 0.4);
      document.fonts.ready.then(() => this.preload.complete('fonts'));
      const safety = setTimeout(() => this.preload.completeAll(), SAFETY_TIMEOUT_MS);

      let exiting = false;
      const exit = () => {
        if (exiting) return;
        exiting = true;
        const root = this.root()?.nativeElement;
        const dial = this.dial()?.nativeElement;
        // Never block the page while the overlay dissolves.
        if (root) root.style.pointerEvents = 'none';
        const tl = gsap.timeline({
          onComplete: () => {
            this.visible.set(false);
            follow.destroy();
          },
        });
        tl.to(display, { value: 1, duration: 0.3, onUpdate: () => this.shown.set(display.value) })
          .to(dial ?? {}, { scale: 7, autoAlpha: 0, duration: 1.1, ease: 'expo.in' }, '+=0.15')
          .to(root?.querySelector('.meta') ?? {}, { autoAlpha: 0, y: 12, duration: 0.4 }, '<')
          .add(() => {
            this.preload.markDone();
            this.scroll.unlock();
          }, '-=0.35')
          .to(root ?? {}, { autoAlpha: 0, duration: 0.6, ease: 'power2.out' }, '-=0.35');
      };

      const watcher = effect(
        () => {
          if (!this.preload.loaded()) return;
          const wait = Math.max(0, MIN_DURATION_MS - (performance.now() - started));
          setTimeout(exit, wait);
          watcher.destroy();
        },
        { injector: this.injector },
      );

      destroyRef.onDestroy(() => {
        clearTimeout(safety);
        gsap.killTweensOf([hands, display]);
      });
    });
  }
}
