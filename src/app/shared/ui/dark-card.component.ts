import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Double-bezel surface: an outer machined tray (shell) holding an inner plate (core).
 * Hover draws a thin gold border sweep and a soft light reflection.
 */
@Component({
  selector: 'app-dark-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'k-shell k-sweep',
    '[class.is-flat]': 'flat()',
  },
  template: `
    <div class="k-core card-core" [class.has-pad]="padded()">
      <span class="reflection" aria-hidden="true"></span>
      <ng-content />
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    .card-core.has-pad {
      padding: clamp(1.5rem, 2.6vw, 2.25rem);
    }

    .reflection {
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background: radial-gradient(
        120% 80% at var(--glare-x, 20%) var(--glare-y, 0%),
        rgba(255, 255, 255, 0.06),
        transparent 55%
      );
      opacity: 0.6;
      pointer-events: none;
      transition: opacity 0.8s var(--ease-mech);
    }

    :host(:hover) .reflection {
      opacity: 1;
    }
  `,
})
export class DarkCardComponent {
  readonly padded = input(true);
  readonly flat = input(false);
}
