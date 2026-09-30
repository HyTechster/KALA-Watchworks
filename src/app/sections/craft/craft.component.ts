import { BreakpointObserver } from '@angular/cdk/layout';
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
  untracked,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { registerGsap } from '../../core/gsap';
import { MotionService } from '../../core/services/motion.service';
import { ScrollService } from '../../core/services/scroll.service';
import { CRAFT_COPY, CRAFT_PANELS } from '../../data/craft';
import { GuideLinesComponent } from '../../shared/ui/guide-lines.component';
import { SectionHeadingComponent } from '../../shared/ui/section-heading.component';
import { CraftIllustrationComponent } from './craft-illustration.component';

/**
 * The Craft: pins and scrolls horizontally through five stages on desktop, with layered
 * parallax illustrations and a progress rail. Becomes a vertical timeline on smaller
 * screens and for reduced motion.
 */
@Component({
  selector: 'app-craft',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SectionHeadingComponent, CraftIllustrationComponent, GuideLinesComponent],
  templateUrl: './craft.component.html',
  styleUrl: './craft.component.scss',
})
export class CraftComponent {
  protected readonly copy = CRAFT_COPY;
  protected readonly panels = CRAFT_PANELS;

  private readonly motion = inject(MotionService);
  private readonly scroll = inject(ScrollService);
  private readonly injector = inject(Injector);

  private readonly isDesktop = toSignal(
    inject(BreakpointObserver)
      .observe('(min-width: 1024px)')
      .pipe(map((state) => state.matches)),
    { initialValue: false },
  );

  /** Horizontal pinned mode only on desktop with motion allowed. */
  protected readonly horizontal = computed(() => this.isDesktop() && !this.motion.reduced());
  protected readonly activeIndex = signal(0);

  private readonly section = viewChild.required<ElementRef<HTMLElement>>('section');
  private readonly pin = viewChild.required<ElementRef<HTMLElement>>('pin');
  private readonly track = viewChild.required<ElementRef<HTMLElement>>('track');
  private readonly railFill = viewChild<ElementRef<HTMLElement>>('railFill');

  private ctx: gsap.Context | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.ctx?.revert());

    effect(() => {
      const horizontal = this.horizontal();
      untracked(() =>
        afterNextRender(() => this.setup(horizontal), { injector: this.injector }),
      );
    });
  }

  private setup(horizontal: boolean): void {
    this.ctx?.revert();
    this.ctx = null;
    this.activeIndex.set(0);
    if (this.motion.reduced()) {
      this.scroll.requestRefresh();
      return;
    }

    const gsap = registerGsap();
    const section = this.section().nativeElement;
    const track = this.track().nativeElement;
    const panels = Array.from(track.querySelectorAll<HTMLElement>('.panel'));

    this.ctx = gsap.context(() => {
      if (horizontal) {
        const distance = () => track.scrollWidth - window.innerWidth;
        const tween = gsap.to(track, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: {
            trigger: this.pin().nativeElement,
            pin: true,
            scrub: 1,
            start: 'top top',
            end: () => `+=${distance()}`,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              const fill = this.railFill()?.nativeElement;
              if (fill) fill.style.transform = `scaleX(${self.progress.toFixed(4)})`;
              const index = Math.min(panels.length - 1, Math.round(self.progress * (panels.length - 1)));
              if (index !== this.activeIndex()) this.activeIndex.set(index);
            },
          },
        });

        panels.forEach((panel) => {
          panel.querySelectorAll<SVGGElement>('[data-depth]').forEach((layer) => {
            const depth = Number(layer.dataset['depth'] ?? 0.5);
            gsap.fromTo(
              layer,
              { x: depth * 50 },
              {
                x: -depth * 50,
                ease: 'none',
                scrollTrigger: {
                  trigger: panel,
                  containerAnimation: tween,
                  start: 'left right',
                  end: 'right left',
                  scrub: true,
                },
              },
            );
          });
          gsap.from(panel.querySelectorAll('.copy > *'), {
            y: 40,
            autoAlpha: 0,
            stagger: 0.07,
            duration: 1,
            ease: 'expo.out',
            scrollTrigger: { trigger: panel, containerAnimation: tween, start: 'left 65%' },
          });
          this.panelEffects(panel, { containerAnimation: tween, start: 'left 70%', end: 'center 45%' });
        });
      } else {
        panels.forEach((panel, i) => {
          panel.querySelectorAll<SVGGElement>('[data-depth]').forEach((layer) => {
            const depth = Number(layer.dataset['depth'] ?? 0.5);
            gsap.fromTo(
              layer,
              { y: depth * 50 },
              {
                y: -depth * 50,
                ease: 'none',
                scrollTrigger: { trigger: panel, start: 'top bottom', end: 'bottom top', scrub: true },
              },
            );
          });
          gsap.from(panel.querySelectorAll('.copy > *'), {
            y: 36,
            autoAlpha: 0,
            stagger: 0.07,
            duration: 1,
            ease: 'expo.out',
            scrollTrigger: { trigger: panel, start: 'top 80%', once: true },
          });
          gsap.timeline({
            scrollTrigger: {
              trigger: panel,
              start: 'top 55%',
              end: 'bottom 55%',
              onToggle: (self) => self.isActive && this.activeIndex.set(i),
            },
          });
          this.panelEffects(panel, { start: 'top 75%', end: 'center 50%' });
        });
      }
    }, section);

    this.scroll.requestRefresh();
  }

  /** Design drawing draws itself; the finishing panel gets a light sweep. */
  private panelEffects(
    panel: HTMLElement,
    trigger: { containerAnimation?: gsap.core.Animation; start: string; end: string },
  ): void {
    const gsap = registerGsap();
    const draws = panel.querySelectorAll('.drawing .draw');
    if (draws.length) {
      gsap.from(draws, {
        drawSVG: '0%',
        ease: 'none',
        stagger: 0.05,
        scrollTrigger: { trigger: panel, scrub: 1, ...trigger },
      });
    }
    const sweep = panel.querySelector('.sweep');
    if (sweep) {
      gsap.fromTo(
        sweep,
        { x: 0 },
        { x: 820, ease: 'none', scrollTrigger: { trigger: panel, scrub: 1, ...trigger, end: 'right left' } },
      );
    }
  }
}
