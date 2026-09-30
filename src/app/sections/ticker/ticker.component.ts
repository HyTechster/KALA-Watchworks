import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ClockService } from '../../core/services/clock.service';
import { TICKER } from '../../data/site';
import { MarqueeComponent } from '../../shared/ui/marquee.component';

export interface Countdown {
  readonly days: number;
  readonly hours: number;
  readonly minutes: number;
}

/** Time left until the next release, rolling the anchor forward in fixed cycles. */
export function countdownTo(now: Date, anchorIso: string, cycleDays: number): Countdown {
  const cycle = cycleDays * 86_400_000;
  let target = new Date(anchorIso).getTime();
  const current = now.getTime();
  if (target <= current) {
    target += Math.ceil((current - target + 1) / cycle) * cycle;
  }
  const diff = Math.max(0, target - current);
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
  };
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Release ticker: an infinite band that speeds up and skews with scroll velocity. */
@Component({
  selector: 'app-ticker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MarqueeComponent],
  template: `
    <section class="ticker" [attr.aria-label]="label()">
      <app-marquee [speed]="70" [reactToScroll]="true">
        <ng-template>
          <span class="item"><strong>{{ copy.series }}</strong></span>
          <span class="sep" aria-hidden="true">◆</span>
          <span class="item">{{ copy.limited }}</span>
          <span class="sep" aria-hidden="true">◆</span>
          <span class="item">
            {{ copy.releaseLabel }}
            <span class="num">{{ countdown().days }}</span> {{ copy.daysUnit }} ·
            <span class="num">{{ hh() }}</span> {{ copy.hoursUnit }} ·
            <span class="num">{{ mm() }}</span> {{ copy.minutesUnit }}
          </span>
          <span class="sep" aria-hidden="true">◆</span>
          <span class="item">
            {{ copy.reservedLabel }}: <span class="num">{{ copy.reserved }}</span> / {{ copy.total }}
          </span>
          <span class="sep" aria-hidden="true">◆</span>
        </ng-template>
      </app-marquee>
    </section>
  `,
  styles: `
    :host {
      display: block;
      position: relative;
      z-index: 2;
    }

    .ticker {
      padding-block: 1.1rem;
      border-block: 1px solid var(--line);
      background: linear-gradient(90deg, rgba(201, 169, 110, 0.06), rgba(46, 111, 106, 0.06));
    }

    .item {
      display: inline-flex;
      align-items: baseline;
      gap: 0.4rem;
      padding-inline: 1.75rem;
      white-space: nowrap;
      font-family: var(--font-display);
      font-size: clamp(1.1rem, 2.2vw, 1.75rem);
      font-weight: 500;
      letter-spacing: -0.01em;
      color: var(--text);

      strong {
        font-weight: 700;
        color: var(--gold-light);
      }
    }

    .num {
      font-family: var(--font-mono);
      font-variant-numeric: tabular-nums;
      color: var(--gold);
    }

    .sep {
      color: var(--gold-deep);
      font-size: 0.6rem;
    }
  `,
})
export class TickerComponent {
  protected readonly copy = TICKER;
  private readonly clock = inject(ClockService);

  protected readonly countdown = computed(() =>
    countdownTo(this.clock.now(), TICKER.releaseAnchor, TICKER.cycleDays),
  );
  protected readonly hh = computed(() => pad(this.countdown().hours));
  protected readonly mm = computed(() => pad(this.countdown().minutes));
  protected readonly label = computed(
    () =>
      `${TICKER.series}. ${TICKER.limited}. ${TICKER.releaseLabel} ${this.countdown().days} ${TICKER.daysUnit}, ` +
      `${this.countdown().hours} ${TICKER.hoursUnit}. ${TICKER.reservedLabel} ${TICKER.reserved} of ${TICKER.total}.`,
  );
}
