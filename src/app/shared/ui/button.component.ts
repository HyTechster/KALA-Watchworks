import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LucideArrowDown, LucideArrowUpRight } from '@lucide/angular';

export type ButtonVariant = 'primary' | 'ghost';
export type ButtonIcon = 'arrow' | 'down' | 'none';

/** Pill button with a nested circular icon island (button-in-button). */
@Component({
  selector: 'a[appButton], button[appButton]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideArrowUpRight, LucideArrowDown],
  host: {
    class: 'k-btn group',
    '[class.k-btn--primary]': "variant() === 'primary'",
    '[class.k-btn--ghost]': "variant() === 'ghost'",
    '[class.k-btn--sm]': "size() === 'sm'",
    '[class.k-btn--down]': "icon() === 'down'",
    'data-cursor': 'interactive',
  },
  template: `
    <span class="k-btn__label"><ng-content /></span>
    @if (icon() !== 'none') {
      <span class="k-btn__icon" aria-hidden="true">
        @if (icon() === 'down') {
          <svg lucideArrowDown [size]="16" [strokeWidth]="1.25"></svg>
        } @else {
          <svg lucideArrowUpRight [size]="16" [strokeWidth]="1.25"></svg>
        }
      </span>
    }
  `,
  styles: `
    :host {
      position: relative;
      display: inline-flex;
      align-items: center;
      gap: 0.9rem;
      min-height: 3.25rem;
      padding: 0.375rem 0.375rem 0.375rem 1.5rem;
      border-radius: 999px;
      font-family: var(--font-body);
      font-size: 0.9375rem;
      font-weight: 500;
      letter-spacing: -0.005em;
      white-space: nowrap;
      cursor: pointer;
      border: 1px solid transparent;
      isolation: isolate;
      overflow: hidden;
      transition:
        transform 0.5s var(--ease-mech),
        background-color 0.5s var(--ease-mech),
        border-color 0.5s var(--ease-mech),
        color 0.5s var(--ease-mech);
      -webkit-tap-highlight-color: transparent;
    }

    :host(.k-btn--sm) {
      min-height: 2.5rem;
      padding: 0.25rem 0.25rem 0.25rem 1.1rem;
      font-size: 0.8125rem;
      gap: 0.6rem;
    }

    :host(:active) {
      transform: scale(0.98);
    }

    :host(.k-btn--primary) {
      color: #120e07;
      background: var(--gradient-gold);
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.45),
        0 18px 40px -18px rgba(201, 169, 110, 0.65);
    }

    // Soft light reflection that travels across the pill on hover.
    :host(.k-btn--primary)::before {
      content: '';
      position: absolute;
      inset: 0;
      z-index: -1;
      background: linear-gradient(105deg, transparent 30%, rgba(255, 255, 255, 0.55) 50%, transparent 70%);
      transform: translateX(-120%);
      transition: transform 0.9s var(--ease-mech);
    }

    :host(.k-btn--primary:hover)::before {
      transform: translateX(120%);
    }

    :host(.k-btn--ghost) {
      color: var(--text);
      background: rgba(255, 255, 255, 0.03);
      border-color: var(--line-strong);
    }

    :host(.k-btn--ghost:hover) {
      border-color: rgba(201, 169, 110, 0.55);
      background: rgba(201, 169, 110, 0.06);
    }

    .k-btn__icon {
      display: grid;
      place-items: center;
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 50%;
      flex: none;
      transition: transform 0.6s var(--ease-mech);
    }

    :host(.k-btn--sm) .k-btn__icon {
      width: 2rem;
      height: 2rem;
    }

    :host(.k-btn--primary) .k-btn__icon {
      background: rgba(10, 10, 11, 0.9);
      color: var(--gold-light);
    }

    :host(.k-btn--ghost) .k-btn__icon {
      background: rgba(255, 255, 255, 0.07);
      color: var(--gold);
    }

    :host(:hover) .k-btn__icon {
      transform: translate(3px, -1px) scale(1.06);
    }

    :host(.k-btn--down:hover) .k-btn__icon {
      transform: translateY(2px) scale(1.06);
    }

    :host([disabled]),
    :host([aria-disabled='true']) {
      opacity: 0.55;
      pointer-events: none;
    }

    // Comfortable 44px touch targets on touch screens.
    @media (pointer: coarse) {
      :host(.k-btn--sm) {
        min-height: 2.75rem;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      :host,
      :host::before,
      .k-btn__icon {
        transition: none !important;
      }
    }
  `,
})
export class ButtonComponent {
  readonly variant = input<ButtonVariant>('primary');
  readonly icon = input<ButtonIcon>('arrow');
  readonly size = input<'md' | 'sm'>('md');
}
