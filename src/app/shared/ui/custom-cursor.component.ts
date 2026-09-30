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
import { CursorService, CursorVariant } from '../../core/services/cursor.service';
import { tickLines } from '../utils/svg-gear';

const INTERACTIVE_SELECTOR =
  'a, button, [role="button"], [role="radio"], [role="tab"], label, select, summary, .mat-mdc-chip, .mat-button-toggle, [data-cursor]';

/**
 * A small ring that trails the pointer. Over interactive elements it grows and shows a
 * rotating tick-mark bezel. Hidden entirely on touch devices.
 */
@Component({
  selector: 'app-custom-cursor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'aria-hidden': 'true',
    '[class.is-enabled]': 'cursor.enabled()',
    '[attr.data-variant]': 'cursor.variant()',
  },
  template: `
    <div class="ring" #ring>
      <svg class="bezel" viewBox="-30 -30 60 60">
        @for (t of ticks; track $index) {
          <line [attr.x1]="t.x1" [attr.y1]="t.y1" [attr.x2]="t.x2" [attr.y2]="t.y2" [attr.stroke-width]="t.major ? 1.2 : 0.6" />
        }
      </svg>
      <span class="label">{{ cursor.label() }}</span>
    </div>
    <div class="dot" #dot></div>
  `,
  styles: `
    :host {
      display: none;
    }

    :host(.is-enabled) {
      display: block;
      position: fixed;
      inset: 0 auto auto 0;
      z-index: var(--z-cursor);
      pointer-events: none;
    }

    .ring,
    .dot {
      position: fixed;
      left: 0;
      top: 0;
      border-radius: 50%;
      opacity: 0;
    }

    .ring {
      width: 40px;
      height: 40px;
      margin: -20px 0 0 -20px;
      border: 1px solid rgba(242, 239, 233, 0.45);
      display: grid;
      place-items: center;
      transition:
        width 0.5s var(--ease-mech),
        height 0.5s var(--ease-mech),
        margin 0.5s var(--ease-mech),
        border-color 0.5s var(--ease-mech),
        background-color 0.5s var(--ease-mech);
    }

    .dot {
      width: 4px;
      height: 4px;
      margin: -2px 0 0 -2px;
      background: var(--gold);
    }

    .bezel {
      position: absolute;
      inset: -1px;
      width: calc(100% + 2px);
      height: calc(100% + 2px);
      stroke: var(--gold);
      opacity: 0;
      transform: scale(0.8);
      transition:
        opacity 0.4s var(--ease-mech),
        transform 0.5s var(--ease-mech);
    }

    .label {
      font-family: var(--font-mono);
      font-size: 0.5625rem;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: var(--gold-light);
      opacity: 0;
      transition: opacity 0.3s var(--ease-mech);
    }

    :host([data-variant='interactive']) .ring,
    :host([data-variant='drag']) .ring {
      width: 64px;
      height: 64px;
      margin: -32px 0 0 -32px;
      border-color: rgba(201, 169, 110, 0.25);
      background: rgba(201, 169, 110, 0.06);
    }

    :host([data-variant='interactive']) .bezel,
    :host([data-variant='drag']) .bezel {
      opacity: 1;
      transform: scale(1);
      animation: bezel 12s steps(60) infinite;
    }

    :host([data-variant='drag']) .label {
      opacity: 1;
    }

    :host([data-variant='text']) .ring {
      width: 4px;
      height: 28px;
      margin: -14px 0 0 -2px;
      border-radius: 2px;
      border-color: transparent;
      background: rgba(201, 169, 110, 0.6);
    }

    :host([data-variant='hidden']) .ring,
    :host([data-variant='hidden']) .dot {
      opacity: 0 !important;
    }

    @keyframes bezel {
      to {
        rotate: 360deg;
      }
    }
  `,
})
export class CustomCursorComponent {
  protected readonly cursor = inject(CursorService);
  private readonly injector = inject(Injector);
  private readonly ring = viewChild.required<ElementRef<HTMLElement>>('ring');
  private readonly dot = viewChild.required<ElementRef<HTMLElement>>('dot');

  protected readonly ticks = tickLines(60, 26, 29.5);

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const gsap = registerGsap();
      const ring = this.ring().nativeElement;
      const dot = this.dot().nativeElement;
      const root = document.documentElement;
      let listening = false;

      const ringX = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3.out' });
      const ringY = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3.out' });
      const dotX = gsap.quickTo(dot, 'x', { duration: 0.08, ease: 'power3.out' });
      const dotY = gsap.quickTo(dot, 'y', { duration: 0.08, ease: 'power3.out' });

      const onMove = (e: PointerEvent) => {
        if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
        ringX(e.clientX);
        ringY(e.clientY);
        dotX(e.clientX);
        dotY(e.clientY);
        if (ring.style.opacity !== '1') {
          gsap.to([ring, dot], { opacity: 1, duration: 0.4 });
        }
      };

      const onOver = (e: PointerEvent) => {
        const target = e.target as HTMLElement | null;
        if (!target?.closest) return;
        const explicit = target.closest<HTMLElement>('[data-cursor]');
        const variantAttr = explicit?.dataset['cursor'] as CursorVariant | undefined;
        if (variantAttr && variantAttr !== 'default') {
          this.cursor.set(variantAttr, explicit?.dataset['cursorLabel'] ?? '');
          return;
        }
        if (target.closest('input[type="text"], input[type="email"], textarea')) {
          this.cursor.set('text');
          return;
        }
        this.cursor.set(target.closest(INTERACTIVE_SELECTOR) ? 'interactive' : 'default');
      };

      const onLeaveWindow = () => gsap.to([ring, dot], { opacity: 0, duration: 0.3 });

      const start = () => {
        if (listening) return;
        listening = true;
        root.classList.add('has-custom-cursor');
        window.addEventListener('pointermove', onMove, { passive: true });
        document.addEventListener('pointerover', onOver, { passive: true });
        document.addEventListener('pointerleave', onLeaveWindow);
      };

      const stop = () => {
        if (!listening) return;
        listening = false;
        root.classList.remove('has-custom-cursor');
        window.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerover', onOver);
        document.removeEventListener('pointerleave', onLeaveWindow);
      };

      effect(() => (this.cursor.enabled() ? start() : stop()), { injector: this.injector });

      destroyRef.onDestroy(() => {
        stop();
        gsap.killTweensOf([ring, dot]);
      });
    });
  }
}
