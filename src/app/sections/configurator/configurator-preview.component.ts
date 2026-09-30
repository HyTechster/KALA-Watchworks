import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  Injector,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { ClockService } from '../../core/services/clock.service';
import { ConfiguratorStore } from '../../core/services/configurator.store';
import { MotionService } from '../../core/services/motion.service';
import { ScrollService } from '../../core/services/scroll.service';
import { CONFIGURATOR_COPY } from '../../data/configurator-options';
import { HeroScene } from '../../three/scenes/hero-scene';
import { isWebGLAvailable } from '../../three/utils/webgl';
import { SvgWatchFaceComponent } from '../../shared/ui/svg-watch-face.component';

/**
 * Live 3D preview of the configured watch. It reuses the hero scene and watch model and
 * reacts to every ConfiguratorStore signal: case, dial, strap, engraving and winding.
 */
@Component({
  selector: 'app-configurator-preview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SvgWatchFaceComponent],
  template: `
    <div class="preview" data-cursor="drag" [attr.data-cursor-label]="copy.dragHint">
      @if (fallback()) {
        <div class="fallback">
          <app-svg-watch-face
            [variant]="store.model()"
            [dial]="store.dial()"
            [caseMaterial]="store.caseMaterial()"
            [withLugs]="true"
          />
        </div>
      } @else {
        <canvas
          #canvas
          class="canvas"
          aria-hidden="true"
          (pointerdown)="onPointerDown($event)"
        ></canvas>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
      position: absolute;
      inset: 0;
    }

    .preview {
      position: absolute;
      inset: 0;
    }

    .canvas {
      width: 100%;
      height: 100%;
      touch-action: pan-y;
      cursor: grab;
    }

    .fallback {
      position: absolute;
      inset: 14%;
    }
  `,
})
export class ConfiguratorPreviewComponent {
  protected readonly store = inject(ConfiguratorStore);
  protected readonly copy = CONFIGURATOR_COPY;
  private readonly clock = inject(ClockService);
  private readonly motion = inject(MotionService);
  private readonly scroll = inject(ScrollService);
  private readonly injector = inject(Injector);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly canvas = viewChild<ElementRef<HTMLCanvasElement>>('canvas');

  protected readonly fallback = signal(false);
  private scene: HeroScene | null = null;
  private yaw = 0;

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      this.scroll.requestRefresh();
      const canvas = this.canvas()?.nativeElement;
      if (!canvas || !isWebGLAvailable()) {
        this.fallback.set(true);
        return;
      }

      let destroyed = false;
      let teardown: (() => void) | null = null;
      destroyRef.onDestroy(() => {
        destroyed = true;
        teardown?.();
      });

      const initialWinds = untracked(() => this.store.windCount());
      HeroScene.create(canvas, {
        framing: 'center',
        parallax: false,
        reducedMotion: this.motion.reduced(),
        maxPixelRatio: 1.75,
        model: {
          variant: this.store.model(),
          caseMaterial: this.store.caseMaterial(),
          dial: this.store.dial(),
          strap: this.store.strap(),
          engraving: this.store.engraving(),
          serial: this.store.serial(),
        },
      })
        .then((scene) => {
          if (destroyed) {
            scene.dispose();
            return;
          }
          teardown = this.attach(scene, initialWinds);
        })
        .catch(() => this.fallback.set(true));
    });
  }

  /** Binds every store signal to the 3D watch. Returns the cleanup. */
  private attach(scene: HeroScene, initialWinds: number): () => void {
    this.scene = scene;
    const watch = scene.watch;
    const opts = { injector: this.injector };

    const effects = [
      effect(() => scene.setTime(this.clock.continuousAngles()), opts),
      effect(() => watch.setVariant(this.store.model()), opts),
      effect(() => watch.setCase(this.store.caseMaterial(), this.motion.reduced()), opts),
      effect(() => watch.setDial(this.store.dial(), this.motion.reduced()), opts),
      effect(() => watch.setStrap(this.store.strap()), opts),
      effect(() => watch.setEngraving(this.store.engraving()), opts),
      effect(() => scene.setTurn(this.store.showCaseback() ? 1 : 0), opts),
      effect(() => scene.setReducedMotion(this.motion.reduced()), opts),
      effect(() => {
        if (this.store.windCount() > initialWinds) untracked(() => watch.wind());
      }, opts),
    ];

    let onScreen = false;
    const sync = () => scene.setActive(onScreen && document.visibilityState === 'visible');
    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      sync();
    });
    io.observe(this.host.nativeElement);
    document.addEventListener('visibilitychange', sync);

    return () => {
      effects.forEach((e) => e.destroy());
      io.disconnect();
      document.removeEventListener('visibilitychange', sync);
      scene.dispose();
      this.scene = null;
    };
  }

  /** Drag horizontally to turn the watch. */
  protected onPointerDown(event: PointerEvent): void {
    const scene = this.scene;
    if (!scene || event.button !== 0) return;
    const target = event.currentTarget as HTMLElement;
    const startX = event.clientX;
    const startYaw = this.yaw;
    target.setPointerCapture(event.pointerId);

    const move = (e: PointerEvent) => {
      this.yaw = startYaw + (e.clientX - startX) * 0.012;
      scene.setYaw(this.yaw);
    };
    const up = () => {
      target.removeEventListener('pointermove', move);
      target.removeEventListener('pointerup', up);
      target.removeEventListener('pointercancel', up);
    };
    target.addEventListener('pointermove', move);
    target.addEventListener('pointerup', up);
    target.addEventListener('pointercancel', up);
  }
}
