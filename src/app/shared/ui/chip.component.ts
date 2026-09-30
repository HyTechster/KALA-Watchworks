import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Monospaced technical spec chip. */
@Component({
  selector: 'app-chip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'k-chip',
    '[class.is-live]': 'live()',
  },
  template: `
    <span class="dot" aria-hidden="true"></span>
    <ng-content />
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.55rem 0.9rem;
      border-radius: 999px;
      border: 1px solid var(--line);
      background: rgba(10, 10, 11, 0.55);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      font-family: var(--font-mono);
      font-size: 0.6875rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--text-muted);
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }

    .dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: var(--steel);
      opacity: 0.6;
    }

    :host(.is-live) .dot {
      background: var(--gold);
      opacity: 1;
      box-shadow: 0 0 10px rgba(201, 169, 110, 0.9);
      animation: pulse 1s steps(2, jump-none) infinite;
    }

    @keyframes pulse {
      50% {
        opacity: 0.35;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      :host(.is-live) .dot {
        animation: none;
      }
    }
  `,
})
export class ChipComponent {
  readonly live = input(false);
}
