import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { registerGsap, ScrollTrigger } from '../../core/gsap';
import { ClockService } from '../../core/services/clock.service';
import { MotionService } from '../../core/services/motion.service';
import { PreloadService } from '../../core/services/preload.service';
import { HeroScene } from '../../three/scenes/hero-scene';
import { isWebGLAvailable } from '../../three/utils/webgl';
import { SvgWatchFaceComponent } from '../../shared/ui/svg-watch-face.component';

/**
 * Full-viewport WebGL stage for the hero watch. Loaded with @defer so Three.js stays out
 * of the initial bundle. Falls back to the vector watch when WebGL is unavailable.
 */
@Component({
  selector: 'app-hero-canvas',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SvgWatchFaceComponent],
  template: `
    @if (fallback()) {
      <div class="fallback"><app-svg-watch-face dial="teal" caseMaterial="steel" [withLugs]="true" /></div>
    } @else {
      <canvas #canvas class="canvas" [class.is-ready]="ready()" aria-hidden="true"></canvas>
    }
  `,
  styles: `
    :host {
      position: absolute;
      inset: 0;
      display: block;
    }

    .canvas {
      width: 100%;
      height: 100%;
      opacity: 0;
      transition: opacity 1.4s var(--ease-mech);
    }

    .canvas.is-ready {
      opacity: 1;
    }

    .fallback {
      position: absolute;
      top: 50%;
      right: 8%;
      width: min(34vw, 30rem);
      transform: translateY(-50%);
    }

    @media (max-width: 900px) {
      .fallback {
        right: 50%;
        top: 34%;
        width: min(70vw, 22rem);
        transform: translate(50%, -50%);
      }
    }
  `,
})
export class HeroCanvasComponent {
  /** Section used as the ScrollTrigger for the 180° turn. */
  readonly trigger = input.required<HTMLElement>();

  private readonly clock = inject(ClockService);
  private readonly motion = inject(MotionService);
  private readonly preload = inject(PreloadService);
  private readonly injector = inject(Injector);
  private readonly canvas = viewChild<ElementRef<HTMLCanvasElement>>('canvas');

  protected readonly fallback = signal(false);
  protected readonly ready = signal(false);

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const canvas = this.canvas()?.nativeElement;
      if (!canvas || !isWebGLAvailable()) {
        this.fallback.set(true);
        this.preload.complete('scene');
        return;
      }

      let destroyed = false;
      let teardown: (() => void) | null = null;
      destroyRef.onDestroy(() => {
        destroyed = true;
        teardown?.();
      });

      const fail = () => {
        this.fallback.set(true);
        this.preload.complete('scene');
      };

      HeroScene.create(canvas, {
        framing: 'hero',
        parallax: true,
        reducedMotion: this.motion.reduced(),
        model: { variant: 'dress', caseMaterial: 'steel', dial: 'teal', strap: 'leather' },
      })
        .then((scene) => {
          if (destroyed) {
            scene.dispose();
            return;
          }
          teardown = this.attach(scene);
        })
        .catch(fail);
    });
  }

  /** Wires the ready scene to the clock, visibility, pointer and scroll. Returns its cleanup. */
  private attach(scene: HeroScene): () => void {
    scene.onFirstFrame(() => {
      this.ready.set(true);
      this.preload.complete('scene');
    });

    const effects = [
      effect(() => scene.setTime(this.clock.continuousAngles()), { injector: this.injector }),
      effect(() => scene.setReducedMotion(this.motion.reduced()), { injector: this.injector }),
    ];

    // Portrait screens: fit the watch into the free space between the nav and the copy.
    const section = this.trigger();
    const sticky = section.querySelector<HTMLElement>('.sticky');
    const content = section.querySelector<HTMLElement>('.content');
    const measureBand = () => {
      const first = content?.firstElementChild as HTMLElement | null;
      if (!content || !first) return;
      const navBottom = document.querySelector('.nav-wrap .pill')?.getBoundingClientRect().bottom ?? 72;
      scene.setPortraitBand(Math.max(72, navBottom) + 12, content.offsetTop + first.offsetTop - 16);
    };
    const bandObserver = new ResizeObserver(measureBand);
    if (sticky) bandObserver.observe(sticky);
    if (content) bandObserver.observe(content);
    measureBand();
    document.fonts.ready.then(measureBand);

    // Pause rendering when the hero is off-screen or the tab is hidden.
    let onScreen = true;
    const sync = () => scene.setActive(onScreen && document.visibilityState === 'visible');
    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      sync();
    });
    io.observe(this.trigger());
    document.addEventListener('visibilitychange', sync);
    sync();

    // Pointer parallax (fine pointers only).
    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      scene.setPointer((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('pointermove', onPointer, { passive: true });

    // Scroll-scrubbed turn to the exhibition caseback.
    const gsap = registerGsap();
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: this.trigger(),
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        onUpdate: (self) => {
          if (!this.motion.reduced()) scene.setTurn(Math.min(1, self.progress / 0.85));
        },
      });
    });

    return () => {
      effects.forEach((e) => e.destroy());
      bandObserver.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', sync);
      window.removeEventListener('pointermove', onPointer);
      ctx.revert();
      scene.dispose();
    };
  }
}
