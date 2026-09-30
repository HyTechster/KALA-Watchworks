import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PRECISION_COPY, PRECISION_STATS } from '../../data/precision';
import { CountUpDirective, formatCount } from '../../shared/directives/count-up.directive';
import { RevealDirective } from '../../shared/directives/reveal.directive';
import { GuideLinesComponent } from '../../shared/ui/guide-lines.component';
import { SectionHeadingComponent } from '../../shared/ui/section-heading.component';
import { PrecisionChartsComponent } from './precision-charts.component';

@Component({
  selector: 'app-precision',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SectionHeadingComponent, PrecisionChartsComponent, CountUpDirective, RevealDirective, GuideLinesComponent],
  template: `
    <section id="precision" class="k-section precision" aria-labelledby="precision-title" tabindex="-1">
      <app-guide-lines layout="cross" [label]="copy.guideLabel" />
      <div class="k-container inner">
        <app-section-heading
          headingId="precision-title"
          [eyebrow]="copy.eyebrow"
          [title]="copy.title"
          [intro]="copy.intro"
        />

        <dl class="stats" appReveal="children">
          @for (stat of stats; track stat.id) {
            <div class="stat">
              <dt class="t-label stat-label">{{ stat.label }}</dt>
              <dd
                class="stat-value"
                [appCountUp]="stat.value"
                [decimals]="stat.decimals"
                [prefix]="stat.prefix"
                [suffix]="stat.suffix"
              >{{ format(stat.value, stat.decimals, stat.prefix, stat.suffix) }}</dd>
            </div>
          }
        </dl>

        @defer (on viewport; prefetch on idle) {
          <app-precision-charts />
        } @placeholder {
          <div class="placeholder" aria-hidden="true">
            <div class="k-skeleton big"></div>
            <div class="k-skeleton small"></div>
          </div>
        }
      </div>
    </section>
  `,
  styles: `
    :host {
      display: block;
    }

    .precision {
      outline: none;
      overflow: hidden;
    }

    .inner {
      position: relative;
      z-index: 1;
    }

    .stats {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1px;
      margin: 0 0 1rem;
      border: 1px solid var(--line);
      border-radius: var(--radius-shell);
      background: var(--line);
      overflow: hidden;
    }

    .stat {
      display: flex;
      flex-direction: column-reverse;
      gap: 0.5rem;
      padding: clamp(1.25rem, 3vw, 2.25rem);
      background: var(--bg);
    }

    .stat-value {
      margin: 0;
      font-family: var(--font-display);
      font-size: clamp(1.75rem, 3.6vw, 3.5rem);
      font-weight: 600;
      white-space: nowrap;
      letter-spacing: -0.04em;
      line-height: 1;
      font-variant-numeric: tabular-nums;
      background: var(--gradient-gold);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }

    .stat-label {
      color: var(--text-muted);
    }

    .placeholder {
      display: grid;
      gap: 1rem;
    }

    .big {
      height: 26rem;
      border-radius: var(--radius-shell);
    }

    .small {
      height: 22rem;
      border-radius: var(--radius-shell);
    }

    @media (min-width: 1024px) {
      .stats {
        grid-template-columns: repeat(4, 1fr);
      }

      .placeholder {
        grid-template-columns: 2fr 1fr;
      }
    }
  `,
})
export class PrecisionComponent {
  protected readonly copy = PRECISION_COPY;
  protected readonly stats = PRECISION_STATS;
  protected readonly format = formatCount;
}
