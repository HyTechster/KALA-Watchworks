import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { ClockService } from '../../core/services/clock.service';
import { renderUrl, RenderView } from '../../data/collection';
import { CaseId, ModelId } from '../../data/configurator-options';
import { CASE_TONES } from './svg-watch-face.component';

let uid = 0;

/**
 * A studio render of a collection watch (see art/kala-watch.blend). Front renders are shot
 * without hands; live vector hands are laid over the dial so every card tells the visitor's
 * local time. The overlay uses the render's own scale: the orthographic camera frames
 * 3.3 model units across the 800 px image, so one unit is 200 / 3.3 SVG units.
 */
@Component({
  selector: 'app-watch-render',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'k-watch-render' },
  template: `
    <img
      [src]="src()"
      [alt]="alt()"
      width="800"
      height="800"
      [attr.loading]="eager() ? 'eager' : 'lazy'"
      [attr.fetchpriority]="eager() ? 'high' : null"
      decoding="async"
      draggable="false"
    />
    @if (view() === 'front') {
      <svg class="hands" viewBox="-100 -100 200 200" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient [attr.id]="ids.left" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" [attr.stop-color]="tone()[0]" />
            <stop offset="1" [attr.stop-color]="tone()[1]" />
          </linearGradient>
          <linearGradient [attr.id]="ids.right" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" [attr.stop-color]="tone()[2]" />
            <stop offset="1" [attr.stop-color]="tone()[1]" />
          </linearGradient>
          <filter [attr.id]="ids.shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0.9" dy="1.4" stdDeviation="0.8" flood-color="#000" flood-opacity="0.55" />
          </filter>
        </defs>

        <g [attr.filter]="'url(#' + ids.shadow + ')'">
          @if (variant() === 'chronograph') {
            <!-- Running seconds at 9 o'clock, chronograph minutes at rest at 3 o'clock -->
            <g transform="translate(-21.8 0)">
              <g class="hand hand--second" [style.transform]="'rotate(' + angles().seconds + 'deg)'">
                <path d="M-0.45 1.8 L0.45 1.8 L0.3 -8.5 L-0.3 -8.5 Z" fill="#e6d3a3" />
              </g>
              <circle r="0.9" fill="#e6d3a3" />
            </g>
            <g transform="translate(21.8 0) rotate(120.3)">
              <path d="M-0.45 1.8 L0.45 1.8 L0.3 -8.5 L-0.3 -8.5 Z" fill="#e6d3a3" />
              <circle r="0.9" fill="#e6d3a3" />
            </g>
          }

          <!-- Dauphine hands: two facets catch the light differently, like the polished originals -->
          <g class="hand hand--hour" [style.transform]="'rotate(' + angles().hours + 'deg)'">
            <path d="M0 6 L-2.6 0 L0 -26.7 Z" [attr.fill]="'url(#' + ids.left + ')'" />
            <path d="M0 6 L2.6 0 L0 -26.7 Z" [attr.fill]="'url(#' + ids.right + ')'" />
          </g>
          <g class="hand hand--minute" [style.transform]="'rotate(' + angles().minutes + 'deg)'">
            <path d="M0 7.3 L-2 0 L0 -42.4 Z" [attr.fill]="'url(#' + ids.left + ')'" />
            <path d="M0 7.3 L2 0 L0 -42.4 Z" [attr.fill]="'url(#' + ids.right + ')'" />
          </g>
          <g class="hand hand--second" [style.transform]="'rotate(' + angles().seconds + 'deg)'">
            <line x1="0" y1="9.7" x2="0" y2="-42.4" stroke="#c9a96e" stroke-width="0.6" />
            <circle cx="0" cy="6.4" r="1.9" fill="#c9a96e" />
            <rect x="-0.6" y="-38" width="1.2" height="4.6" rx="0.3" fill="#dfe9dc" />
          </g>
          <circle r="1.7" fill="#c9a96e" />
          <circle r="0.6" fill="#8c6e3c" />
        </g>
      </svg>
    }
  `,
  styles: `
    :host {
      position: relative;
      display: block;
      aspect-ratio: 1;
      width: 100%;
    }

    img,
    .hands {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
    }

    img {
      object-fit: contain;
      user-select: none;
    }

    .hand {
      transform-box: view-box;
      transform-origin: 0 0;
    }

    .hand--hour,
    .hand--minute {
      transition: transform 0.6s var(--ease-out-3);
    }

    .hand--second {
      transition: transform 0.16s cubic-bezier(0.2, 0.9, 0.3, 1);
    }

    @media (prefers-reduced-motion: reduce) {
      .hand--hour,
      .hand--minute,
      .hand--second {
        transition: none;
      }
    }
  `,
})
export class WatchRenderComponent {
  readonly watchId = input.required<string>();
  readonly view = input<RenderView>('front');
  readonly variant = input<ModelId>('dress');
  readonly caseMaterial = input<CaseId>('steel');
  readonly alt = input('');
  /** Load immediately (for an image that is on screen as soon as its container opens). */
  readonly eager = input(false);

  private readonly clock = inject(ClockService);

  protected readonly ids = { left: `kr-l-${++uid}`, right: `kr-r-${uid}`, shadow: `kr-s-${uid}` };
  protected readonly src = computed(() => renderUrl(this.watchId(), this.view()));
  protected readonly angles = this.clock.continuousAngles;
  protected readonly tone = computed(() => CASE_TONES[this.caseMaterial()]);
}
