import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

interface OdometerChar {
  readonly key: string;
  readonly digit: number | null;
  readonly char: string;
}

/** Animated rolling number. Each digit is a vertical strip that slides to its value. */
@Component({
  selector: 'app-odometer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="sr-only" aria-live="polite">{{ formatted() }}</span>
    <span class="odometer" aria-hidden="true">
      @for (c of chars(); track c.key) {
        @if (c.digit !== null) {
          <span class="digit">
            <span class="strip" [style.transform]="'translateY(' + -c.digit * 10 + '%)'">
              @for (n of digits; track n) {
                <span>{{ n }}</span>
              }
            </span>
          </span>
        } @else {
          <span class="sep">{{ c.char }}</span>
        }
      }
    </span>
  `,
  styles: `
    :host {
      display: inline-block;
      font-family: var(--font-mono);
      font-variant-numeric: tabular-nums;
      line-height: 1;
    }

    .odometer {
      display: inline-flex;
      overflow: hidden;
    }

    .digit {
      display: inline-block;
      height: 1em;
      overflow: hidden;
      position: relative;
      width: 0.62em;
    }

    .strip {
      display: flex;
      flex-direction: column;
      transition: transform 1.1s var(--ease-mech);
    }

    .strip span {
      height: 1em;
      display: block;
      text-align: center;
    }

    .sep {
      display: inline-block;
      height: 1em;
    }

    @for $i from 1 through 8 {
      .digit:nth-last-child(#{$i}) .strip {
        transition-delay: #{$i * 40}ms;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .strip {
        transition: none;
      }
    }
  `,
})
export class OdometerComponent {
  readonly value = input.required<number>();
  readonly prefix = input('');

  protected readonly digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

  protected readonly formatted = computed(() => `${this.prefix()}${Math.round(this.value()).toLocaleString('en-US')}`);

  /** Keyed from the right so existing digit strips persist and roll instead of re-rendering. */
  protected readonly chars = computed<OdometerChar[]>(() => {
    const text = this.formatted();
    const length = text.length;
    return Array.from(text).map((char, i) => {
      const fromRight = length - i;
      const digit = /\d/.test(char) ? Number(char) : null;
      return { key: `${digit === null ? 's' : 'd'}${fromRight}`, digit, char };
    });
  });
}
