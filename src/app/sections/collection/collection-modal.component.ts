import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { LucideChevronLeft, LucideChevronRight, LucideX } from '@lucide/angular';
import { ConfiguratorStore } from '../../core/services/configurator.store';
import { MotionService } from '../../core/services/motion.service';
import { COLLECTION_COPY, CollectionWatch, RENDER_VIEWS } from '../../data/collection';
import { CASE_OPTIONS, MODEL_OPTIONS } from '../../data/configurator-options';
import { ButtonComponent } from '../../shared/ui/button.component';
import { WatchRenderComponent } from '../../shared/ui/watch-render.component';

interface SwiperHost extends HTMLElement {
  initialize(): void;
  swiper?: { slidePrev(): void; slideNext(): void; destroy(): void; activeIndex: number; on(event: string, cb: () => void): void };
}

/** Watch detail modal: Swiper gallery, specifications and a hand-off to the configurator. */
@Component({
  selector: 'app-collection-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [ButtonComponent, WatchRenderComponent, LucideX, LucideChevronLeft, LucideChevronRight],
  templateUrl: './collection-modal.component.html',
  styleUrl: './collection-modal.component.scss',
})
export class CollectionModalComponent {
  protected readonly watch = inject<CollectionWatch>(DIALOG_DATA);
  protected readonly copy = COLLECTION_COPY;
  private readonly ref = inject<DialogRef<'configure' | undefined>>(DialogRef);
  private readonly store = inject(ConfiguratorStore);
  private readonly motion = inject(MotionService);
  private readonly swiperEl = viewChild.required<ElementRef<SwiperHost>>('swiper');

  protected readonly slide = signal(0);
  protected readonly categoryName = MODEL_OPTIONS.find((m) => m.id === this.watch.category)?.name ?? '';
  protected readonly materialName = CASE_OPTIONS.find((c) => c.id === this.watch.caseMaterial)?.name ?? '';
  protected readonly priceLabel = `$${this.watch.price.toLocaleString('en-US')}`;
  protected readonly views = RENDER_VIEWS;

  protected readonly specs = [
    { label: COLLECTION_COPY.specCase, value: this.watch.caseSize },
    { label: COLLECTION_COPY.specThickness, value: this.watch.thickness },
    { label: COLLECTION_COPY.specWater, value: this.watch.waterResistance },
    { label: COLLECTION_COPY.specMovement, value: this.watch.movement },
    { label: COLLECTION_COPY.specReserve, value: this.watch.powerReserve },
    { label: COLLECTION_COPY.specMaterial, value: this.materialName },
  ];

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      import('swiper/element/bundle').then(({ register }) => {
        register();
        const el = this.swiperEl().nativeElement;
        Object.assign(el, {
          slidesPerView: 1,
          speed: this.motion.reduced() ? 0 : 800,
          spaceBetween: 24,
          grabCursor: true,
          keyboard: { enabled: true, onlyInViewport: true },
          a11y: { enabled: true },
        });
        el.initialize();
        el.swiper?.on('slideChange', () => this.slide.set(el.swiper?.activeIndex ?? 0));
      });
    });

    destroyRef.onDestroy(() => this.swiperEl().nativeElement.swiper?.destroy());
  }

  protected prev(): void {
    this.swiperEl().nativeElement.swiper?.slidePrev();
  }

  protected next(): void {
    this.swiperEl().nativeElement.swiper?.slideNext();
  }

  protected close(): void {
    this.ref.close();
  }

  protected configure(): void {
    this.store.preselect(this.watch);
    this.ref.close('configure');
  }
}
