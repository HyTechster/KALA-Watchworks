import { A11yModule } from '@angular/cdk/a11y';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { ClockService } from '../../core/services/clock.service';
import { ScrollService } from '../../core/services/scroll.service';
import { BRAND, NAV } from '../../data/site';
import { MagneticDirective } from '../../shared/directives/magnetic.directive';
import { ButtonComponent } from '../../shared/ui/button.component';

interface Indicator {
  readonly x: number;
  readonly width: number;
  readonly visible: boolean;
}

/**
 * Floating glass pill navigation. Hides on scroll down, returns on scroll up, tracks the
 * active section with a sliding indicator and opens a focus-trapped overlay on mobile.
 */
@Component({
  selector: 'app-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [A11yModule, ButtonComponent, MagneticDirective],
  templateUrl: './nav.component.html',
  styleUrl: './nav.component.scss',
  host: {
    '(document:keydown.escape)': 'closeMenu()',
  },
})
export class NavComponent {
  protected readonly nav = NAV;
  protected readonly brand = BRAND;
  protected readonly clock = inject(ClockService);
  private readonly scroll = inject(ScrollService);

  private readonly linkEls = viewChildren<ElementRef<HTMLAnchorElement>>('link');
  private readonly list = viewChild<ElementRef<HTMLElement>>('list');
  private readonly burger = viewChild<ElementRef<HTMLButtonElement>>('burger');

  protected readonly menuOpen = signal(false);
  protected readonly active = signal<string | null>(null);
  private readonly measureTick = signal(0);

  /** Seconds are visual only, so screen readers are not interrupted every second. */
  protected readonly seconds = computed(() => String(this.clock.now().getSeconds()).padStart(2, '0'));

  protected readonly hidden = computed(
    () => this.scroll.direction() === 1 && this.scroll.scrolled() && !this.menuOpen(),
  );

  protected readonly indicator = computed<Indicator>(() => {
    this.measureTick();
    const id = this.active();
    const links = this.linkEls();
    const list = this.list()?.nativeElement;
    const index = this.nav.links.findIndex((l) => l.id === id);
    const el = index >= 0 ? links[index]?.nativeElement : undefined;
    if (!el || !list) return { x: 0, width: 0, visible: false };
    return { x: el.offsetLeft, width: el.offsetWidth, visible: true };
  });

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const ids = ['top', ...this.nav.links.map((l) => l.id)];
      const visibleRatios = new Map<string, number>();
      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) visibleRatios.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
          let best: string | null = null;
          let bestRatio = 0;
          for (const id of ids) {
            const ratio = visibleRatios.get(id) ?? 0;
            if (ratio > bestRatio) {
              best = id;
              bestRatio = ratio;
            }
          }
          this.active.set(best === 'top' ? null : best);
        },
        { rootMargin: '-35% 0px -55% 0px', threshold: [0, 0.01, 0.1, 0.5, 1] },
      );
      ids.forEach((id) => {
        const el = document.getElementById(id);
        if (el) io.observe(el);
      });

      const remeasure = () => this.measureTick.update((n) => n + 1);
      const ro = new ResizeObserver(remeasure);
      const listEl = this.list()?.nativeElement;
      if (listEl) ro.observe(listEl);
      document.fonts.ready.then(remeasure);

      destroyRef.onDestroy(() => {
        io.disconnect();
        ro.disconnect();
      });
    });
  }

  protected toggleMenu(): void {
    if (this.menuOpen()) {
      this.closeMenu();
    } else {
      this.menuOpen.set(true);
      this.scroll.lock();
    }
  }

  protected closeMenu(): void {
    if (!this.menuOpen()) return;
    this.menuOpen.set(false);
    this.scroll.unlock();
    this.burger()?.nativeElement.focus();
  }

  protected go(event: Event, id: string): void {
    event.preventDefault();
    const wasOpen = this.menuOpen();
    if (wasOpen) this.closeMenu();
    const target = id === 'top' ? 0 : `#${id}`;
    this.scroll.scrollTo(target, { offset: id === 'top' ? 0 : -8 });
    const el = id === 'top' ? document.getElementById('main') : document.getElementById(id);
    el?.focus({ preventScroll: true });
  }
}
