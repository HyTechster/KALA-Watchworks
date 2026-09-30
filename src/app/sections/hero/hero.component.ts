import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  Injector,
  viewChild,
} from '@angular/core';
import { registerGsap } from '../../core/gsap';
import { ClockService } from '../../core/services/clock.service';
import { MotionService } from '../../core/services/motion.service';
import { ScrollService } from '../../core/services/scroll.service';
import { HERO } from '../../data/site';
import { MagneticDirective } from '../../shared/directives/magnetic.directive';
import { SplitTextDirective } from '../../shared/directives/split-text.directive';
import { ButtonComponent } from '../../shared/ui/button.component';
import { ChipComponent } from '../../shared/ui/chip.component';
import { SvgWatchFaceComponent } from '../../shared/ui/svg-watch-face.component';
import { HeroCanvasComponent } from './hero-canvas.component';
import { PreloadService } from '../../core/services/preload.service';

@Component({
  selector: 'app-hero',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HeroCanvasComponent,
    SvgWatchFaceComponent,
    ButtonComponent,
    ChipComponent,
    MagneticDirective,
    SplitTextDirective,
  ],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss',
})
export class HeroComponent {
  protected readonly copy = HERO;
  protected readonly clock = inject(ClockService);
  protected readonly motion = inject(MotionService);
  private readonly scroll = inject(ScrollService);
  private readonly preload = inject(PreloadService);
  private readonly injector = inject(Injector);

  protected readonly section = viewChild.required<ElementRef<HTMLElement>>('section');
  private readonly content = viewChild.required<ElementRef<HTMLElement>>('content');
  private readonly caption = viewChild.required<ElementRef<HTMLElement>>('caption');

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      if (this.motion.reduced()) return;
      const gsap = registerGsap();
      const section = this.section().nativeElement;
      const content = this.content().nativeElement;

      const ctx = gsap.context(() => {
        // Entrance for the supporting copy once the preloader has dissolved.
        const intro = gsap.timeline({ paused: true });
        intro
          .from('[data-hero-fade]', { y: 28, autoAlpha: 0, duration: 1.1, ease: 'expo.out', stagger: 0.08 }, 0.45)
          .from('[data-hero-chip]', { y: 16, autoAlpha: 0, duration: 0.9, ease: 'expo.out', stagger: 0.06 }, 0.7);
        effect(
          () => {
            if (this.preload.done()) intro.play();
          },
          { injector: this.injector },
        );

        // Copy drifts up and fades as the watch turns.
        gsap.to(section.querySelector('.scroll-cue'), {
          autoAlpha: 0,
          ease: 'none',
          scrollTrigger: { trigger: section, start: 'top top', end: '20% top', scrub: true },
        });
        gsap.to(content, {
          yPercent: -18,
          autoAlpha: 0,
          ease: 'none',
          scrollTrigger: { trigger: section, start: 'top top', end: '45% top', scrub: true },
        });
        gsap.fromTo(
          this.caption().nativeElement,
          { autoAlpha: 0, y: 20 },
          {
            autoAlpha: 1,
            y: 0,
            ease: 'none',
            scrollTrigger: { trigger: section, start: '45% top', end: '75% top', scrub: true },
          },
        );
      }, section);

      destroyRef.onDestroy(() => ctx.revert());
    });
  }

  protected go(event: Event, id: string): void {
    event.preventDefault();
    this.scroll.scrollTo(`#${id}`);
  }
}
