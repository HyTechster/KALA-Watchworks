import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RevealDirective } from '../directives/reveal.directive';
import { SplitTextDirective } from '../directives/split-text.directive';

/** Eyebrow pill, split-text title and intro paragraph for a section. */
@Component({
  selector: 'app-section-heading',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SplitTextDirective, RevealDirective],
  host: {
    '[class.is-center]': "align() === 'center'",
    '[class.is-split]': "align() === 'split'",
  },
  template: `
    <div class="heading-main">
      <span class="k-eyebrow" appReveal [revealY]="16">{{ eyebrow() }}</span>
      <h2 class="t-display heading-title" [id]="headingId()" appSplitText>{{ title() }}</h2>
    </div>
    @if (intro()) {
      <p class="t-lead heading-intro" appReveal [revealDelay]="0.15">{{ intro() }}</p>
    }
  `,
  styles: `
    :host {
      display: grid;
      gap: 1.75rem;
      margin-bottom: clamp(3rem, 7vw, 6rem);
    }

    .heading-main {
      display: grid;
      gap: 1.5rem;
      justify-items: start;
    }

    .heading-title {
      max-width: 14ch;
    }

    :host(.is-center) {
      justify-items: center;
      text-align: center;

      .heading-main {
        justify-items: center;
      }

      .heading-title {
        max-width: 16ch;
      }
    }

    @media (min-width: 1024px) {
      :host(.is-split) {
        grid-template-columns: 1.4fr 1fr;
        align-items: end;
        gap: 4rem;

        .heading-intro {
          justify-self: end;
          padding-bottom: 0.5rem;
        }
      }
    }
  `,
})
export class SectionHeadingComponent {
  readonly eyebrow = input.required<string>();
  readonly title = input.required<string>();
  readonly intro = input('');
  readonly headingId = input.required<string>();
  readonly align = input<'start' | 'center' | 'split'>('split');
}
