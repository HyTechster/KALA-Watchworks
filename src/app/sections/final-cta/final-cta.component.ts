import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  viewChild,
} from '@angular/core';
import { MotionService } from '../../core/services/motion.service';
import { ScrollService } from '../../core/services/scroll.service';
import { FINAL_CTA } from '../../data/site';
import { MagneticDirective } from '../../shared/directives/magnetic.directive';
import { RevealDirective } from '../../shared/directives/reveal.directive';
import { ButtonComponent } from '../../shared/ui/button.component';
import { GoldDustComponent } from './gold-dust.component';

/** Closing call to action. A highlight inside the gold headline follows the pointer. */
@Component({
  selector: 'app-final-cta',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [GoldDustComponent, ButtonComponent, MagneticDirective, RevealDirective],
  template: `
    <section class="final" #section aria-labelledby="final-title">
      <app-gold-dust />
      <div class="k-container inner">
        <span class="k-eyebrow" appReveal [revealY]="16">{{ copy.eyebrow }}</span>
        <h2 id="final-title" class="headline" #headline appReveal [revealY]="60">{{ copy.headline }}</h2>
        <p class="t-lead body" appReveal [revealDelay]="0.1">{{ copy.body }}</p>
        <div class="cta" appReveal [revealDelay]="0.2">
          <a appButton [appMagnetic]="0.45" href="#configurator" (click)="reserve($event)">{{ copy.cta }}</a>
          <span class="note t-label">{{ copy.note }}</span>
        </div>
      </div>
    </section>
  `,
  styles: `
    :host {
      display: block;
    }

    .final {
      position: relative;
      overflow: hidden;
      padding-block: clamp(8rem, 18vw, 14rem);
      background:
        radial-gradient(60% 50% at 50% 60%, rgba(201, 169, 110, 0.1), transparent 70%),
        linear-gradient(180deg, var(--bg), #0d0c0a 60%, var(--bg));
    }

    .inner {
      position: relative;
      z-index: 1;
      display: grid;
      justify-items: center;
      gap: 2rem;
      text-align: center;
    }

    .headline {
      font-size: clamp(3.5rem, 13vw, 13rem);
      line-height: 0.9;
      letter-spacing: -0.055em;
      padding-bottom: 0.08em;
      --mx: 50%;
      --my: 50%;
      background:
        radial-gradient(circle at var(--mx) var(--my), rgba(255, 250, 235, 0.95), rgba(255, 250, 235, 0) 22%),
        var(--gradient-gold);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }

    .body {
      max-width: 44ch;
      text-align: center;
    }

    .cta {
      display: grid;
      justify-items: center;
      gap: 1rem;
    }

    .note {
      color: var(--text-muted);
    }
  `,
})
export class FinalCtaComponent {
  protected readonly copy = FINAL_CTA;
  private readonly scroll = inject(ScrollService);
  private readonly motion = inject(MotionService);
  private readonly section = viewChild.required<ElementRef<HTMLElement>>('section');
  private readonly headline = viewChild.required<ElementRef<HTMLElement>>('headline');

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const el = this.section().nativeElement;
      const headline = this.headline().nativeElement;
      let frame = 0;
      const onMove = (e: PointerEvent) => {
        if (this.motion.reduced()) return;
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          // Position the highlight in the headline's own box so it sits under the pointer.
          const rect = headline.getBoundingClientRect();
          headline.style.setProperty('--mx', `${(((e.clientX - rect.left) / rect.width) * 100).toFixed(1)}%`);
          headline.style.setProperty('--my', `${(((e.clientY - rect.top) / rect.height) * 100).toFixed(1)}%`);
        });
      };
      el.addEventListener('pointermove', onMove);
      destroyRef.onDestroy(() => {
        cancelAnimationFrame(frame);
        el.removeEventListener('pointermove', onMove);
      });
    });
  }

  protected reserve(event: Event): void {
    event.preventDefault();
    this.scroll.scrollTo('#configurator', { offset: -8 });
  }
}
