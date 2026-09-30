import { Dialog } from '@angular/cdk/dialog';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  Injector,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { MatChipListboxChange, MatChipOption, MatChipsModule } from '@angular/material/chips';
import { LucideArrowUpRight } from '@lucide/angular';
import { Flip, registerGsap } from '../../core/gsap';
import { MotionService } from '../../core/services/motion.service';
import { ScrollService } from '../../core/services/scroll.service';
import {
  COLLECTION,
  COLLECTION_COPY,
  COLLECTION_FILTERS,
  CollectionFilter,
  CollectionWatch,
} from '../../data/collection';
import { MODEL_OPTIONS } from '../../data/configurator-options';
import { Tilt3dDirective } from '../../shared/directives/tilt-3d.directive';
import { WatchRenderComponent } from '../../shared/ui/watch-render.component';

export function matchesFilter(watch: CollectionWatch, filter: CollectionFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'limited') return watch.limited;
  return watch.category === filter;
}

/** Filterable, FLIP-animated grid of 3D-tilt watch cards. Opens a detail modal on click. */
@Component({
  selector: 'app-collection-grid',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatChipsModule, WatchRenderComponent, Tilt3dDirective, LucideArrowUpRight],
  templateUrl: './collection-grid.component.html',
  styleUrl: './collection-grid.component.scss',
})
export class CollectionGridComponent {
  protected readonly copy = COLLECTION_COPY;
  protected readonly filters = COLLECTION_FILTERS;
  protected readonly watches = COLLECTION;

  private readonly dialog = inject(Dialog);
  private readonly scroll = inject(ScrollService);
  private readonly motion = inject(MotionService);
  private readonly injector = inject(Injector);
  private readonly grid = viewChild.required<ElementRef<HTMLElement>>('grid');
  private readonly chipOptions = viewChildren(MatChipOption);

  protected readonly filter = signal<CollectionFilter>('all');
  protected readonly visibleIds = computed(
    () => this.watches.filter((w) => matchesFilter(w, this.filter())).map((w) => w.id),
  );
  protected readonly featureId = computed(() => this.visibleIds()[0] ?? null);
  protected readonly count = computed(() => this.visibleIds().length);

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      registerGsap();
      this.scroll.requestRefresh();
    });
    destroyRef.onDestroy(() => {
      const cards = this.grid().nativeElement.querySelectorAll('.card');
      registerGsap().killTweensOf(cards);
    });
  }

  protected categoryName(watch: CollectionWatch): string {
    return MODEL_OPTIONS.find((m) => m.id === watch.category)?.name ?? watch.category;
  }

  protected formatPrice(value: number): string {
    return `$${value.toLocaleString('en-US')}`;
  }

  protected onFilter(event: MatChipListboxChange): void {
    const next = event.value as CollectionFilter | null | undefined;
    if (!next) {
      // Clicking the selected chip deselects it; keep a filter active.
      queueMicrotask(() => this.chipOptions().find((c) => c.value === this.filter())?.select());
      return;
    }
    if (next === this.filter()) return;

    const gsap = registerGsap();
    const cards = Array.from(this.grid().nativeElement.querySelectorAll<HTMLElement>('.card'));
    if (this.motion.reduced()) {
      this.filter.set(next);
      return;
    }

    const state = Flip.getState(cards);
    this.filter.set(next);
    afterNextRender(
      () => {
        Flip.from(state, {
          duration: 0.9,
          ease: 'power3.inOut',
          scale: true,
          absolute: true,
          nested: true,
          stagger: 0.03,
          onEnter: (els) => gsap.fromTo(els, { autoAlpha: 0, scale: 0.92 }, { autoAlpha: 1, scale: 1, duration: 0.7, delay: 0.2 }),
          onLeave: (els) => gsap.to(els, { autoAlpha: 0, scale: 0.92, duration: 0.45 }),
          onComplete: () => this.scroll.requestRefresh(),
        });
      },
      { injector: this.injector },
    );
  }

  protected async open(watch: CollectionWatch): Promise<void> {
    const { CollectionModalComponent } = await import('./collection-modal.component');
    const root = document.documentElement;
    root.classList.add('modal-open');
    this.scroll.lock();

    const ref = this.dialog.open<'configure' | undefined, CollectionWatch>(CollectionModalComponent, {
      data: watch,
      backdropClass: 'k-dialog-backdrop',
      panelClass: 'k-dialog-panel',
      ariaLabelledBy: 'modal-title',
      autoFocus: 'first-tabbable',
      restoreFocus: true,
    });

    ref.closed.subscribe((result) => {
      root.classList.remove('modal-open');
      this.scroll.unlock();
      if (result === 'configure') {
        this.scroll.scrollTo('#configurator', { offset: -8 });
      }
    });
  }
}
