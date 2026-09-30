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
  model,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { MatSliderModule } from '@angular/material/slider';
import { LucideMinus, LucidePlus, LucideRotateCcw } from '@lucide/angular';
import { registerGsap, ScrollTrigger } from '../../core/gsap';
import { MotionService } from '../../core/services/motion.service';
import { ScrollService } from '../../core/services/scroll.service';
import { MOVEMENT_COPY, MOVEMENT_PARTS, PartId } from '../../data/parts';
import { HotspotScreen, MovementScene } from '../../three/scenes/movement-scene';
import { isWebGLAvailable } from '../../three/utils/webgl';
import { SvgWatchViewComponent } from '../../shared/ui/svg-watch-view.component';

/** Deferred WebGL stage for the movement: orbit, explode slider and projected hotspots. */
@Component({
  selector: 'app-movement-stage',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatSliderModule, LucidePlus, LucideMinus, LucideRotateCcw, SvgWatchViewComponent],
  templateUrl: './movement-stage.component.html',
  styleUrl: './movement-stage.component.scss',
})
export class MovementStageComponent {
  readonly selected = model<PartId | null>(null);
  readonly explode = model(0);

  protected readonly copy = MOVEMENT_COPY;
  protected readonly parts = MOVEMENT_PARTS;
  protected readonly fallback = signal(false);
  protected readonly explodePercent = computed(() => Math.round(this.explode() * 100));

  private readonly motion = inject(MotionService);
  private readonly scroll = inject(ScrollService);
  private readonly injector = inject(Injector);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly canvas = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly hotspotEls = viewChildren<ElementRef<HTMLButtonElement>>('hotspot');

  private scene: MovementScene | null = null;
  private userTouchedSlider = false;
  private scrollLink: ScrollTrigger | null = null;

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      this.scroll.requestRefresh();
      const canvas = this.canvas()?.nativeElement;
      if (!canvas || !isWebGLAvailable()) {
        this.fallback.set(true);
        return;
      }

      const byId = new Map<PartId, HTMLButtonElement>();
      this.hotspotEls().forEach((ref, i) => byId.set(this.parts[i].id, ref.nativeElement));

      const onFrame = (spots: readonly HotspotScreen[]) => {
        for (const spot of spots) {
          const el = byId.get(spot.id);
          if (!el) continue;
          el.style.transform = `translate3d(${spot.x.toFixed(1)}px, ${spot.y.toFixed(1)}px, 0)`;
          el.style.opacity = spot.visible ? '1' : '0';
          el.style.pointerEvents = spot.visible ? 'auto' : 'none';
        }
      };

      try {
        this.scene = new MovementScene(canvas, { reducedMotion: this.motion.reduced(), onFrame });
      } catch {
        this.fallback.set(true);
        return;
      }
      const scene = this.scene;

      effect(() => scene.select(this.selected()), { injector: this.injector });
      effect(() => scene.setExplode(this.explode()), { injector: this.injector });

      let onScreen = false;
      let ready = false;
      const sync = () => ready && scene.setActive(onScreen && document.visibilityState === 'visible');
      scene.warmUp().then(() => {
        ready = true;
        sync();
      });
      const io = new IntersectionObserver(([entry]) => {
        onScreen = entry.isIntersecting;
        sync();
      });
      io.observe(this.host.nativeElement);
      document.addEventListener('visibilitychange', sync);

      // Scroll-linked explode on first view, until the user takes the slider.
      if (!this.motion.reduced()) {
        registerGsap();
        this.scrollLink = ScrollTrigger.create({
          trigger: this.host.nativeElement,
          start: 'top 85%',
          end: 'center 45%',
          scrub: true,
          onUpdate: (self) => {
            if (this.userTouchedSlider) return;
            const value = Math.round(self.progress * 55) / 100;
            if (value !== this.explode()) this.explode.set(value);
          },
        });
      } else {
        this.explode.set(0.45);
      }

      destroyRef.onDestroy(() => {
        io.disconnect();
        document.removeEventListener('visibilitychange', sync);
        this.scrollLink?.kill();
        scene.dispose();
        this.scene = null;
      });
    });
  }

  protected toggle(id: PartId): void {
    this.selected.set(this.selected() === id ? null : id);
  }

  protected onSlider(value: number): void {
    this.userTouchedSlider = true;
    this.scrollLink?.kill();
    this.scrollLink = null;
    this.explode.set(value);
  }

  protected zoom(step: number): void {
    this.scene?.zoom(step);
  }

  protected reset(): void {
    this.selected.set(null);
    this.scene?.resetView();
  }

  protected formatValue(value: number): string {
    return `${Math.round(value * 100)}%`;
  }
}
