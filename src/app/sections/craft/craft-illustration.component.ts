import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CRAFT_LABELS, CraftIllustration } from '../../data/craft';
import { spokedGearPath } from '../../shared/utils/svg-gear';

/**
 * One craft stage: a studio render from art/kala-watch.blend (scene "KALA_Craft") between a
 * faint technical backdrop and a gold annotation overlay. Layers carry `data-depth` so the
 * parent can move them at different parallax speeds; `.drawing .draw` strokes draw in.
 * All overlays share the render's 600 × 500 frame (renders are 1200 × 1000).
 */
@Component({
  selector: 'app-craft-illustration',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  template: `
    <div class="stage">
      <!-- Backdrop -->
      <svg class="layer faint" data-depth="0.25" viewBox="0 0 600 500">
        @switch (kind()) {
          @case ('machining') {
            @for (x of gridX; track x) {
              <line [attr.x1]="x" y1="0" [attr.x2]="x" y2="500" />
            }
            @for (y of gridY; track y) {
              <line x1="0" [attr.y1]="y" x2="600" [attr.y2]="y" />
            }
          }
          @case ('regulation') {
            @for (y of gridY; track y) {
              <line x1="0" [attr.y1]="y" x2="600" [attr.y2]="y" />
            }
          }
          @case ('assembly') {
            <line x1="300" y1="0" x2="300" y2="500" stroke-dasharray="4 8" />
          }
          @default {
            <path [attr.d]="bigGear" />
          }
        }
      </svg>

      @if (kind() === 'design') {
        <!-- The drawing itself: it draws in as the panel arrives -->
        <svg class="layer drawing" data-depth="0.6" viewBox="0 0 600 500">
          <circle class="draw" cx="300" cy="250" r="140" />
          <circle class="draw" cx="300" cy="250" r="118" />
          <circle class="draw thin" cx="300" cy="250" r="96" />
          <path class="draw" d="M236 118 L250 62 L290 62 L286 112 M364 118 L350 62 L310 62 L314 112" />
          <path class="draw" d="M236 382 L250 438 L290 438 L286 388 M364 382 L350 438 L310 438 L314 388" />
          <rect class="draw" x="440" y="236" width="26" height="28" rx="4" />
          <path class="draw dim" d="M160 250 H440 M160 244 V256 M440 244 V256" />
          <path class="draw dim" d="M520 62 V438 M514 62 H526 M514 438 H526" />
          <path class="draw thin" d="M300 90 V410 M140 250 H460" stroke-dasharray="6 6" />
          <text x="300" y="240" class="label">{{ labels.diameter }}</text>
          <text x="532" y="254" class="label left">{{ labels.lugToLug }}</text>
          <text x="300" y="492" class="label">{{ labels.scale }}</text>
          <text x="40" y="40" class="label left">{{ labels.drawingNo }}</text>
        </svg>
      }

      <!-- Studio render -->
      <div class="layer shot" [class.is-vignetted]="kind() !== 'design'" [attr.data-depth]="kind() === 'design' ? 1.1 : 0.6">
        <img
          [src]="src()"
          [attr.srcset]="srcset()"
          sizes="(min-width: 1024px) 34rem, 92vw"
          width="1200"
          height="1000"
          alt=""
          loading="lazy"
          decoding="async"
          draggable="false"
        />
        @if (kind() === 'finishing') {
          <span class="sweep-mask" [style.mask-image]="maskUrl()" [style.-webkit-mask-image]="maskUrl()">
            <span class="sweep"></span>
          </span>
        }
      </div>

      <!-- Annotations -->
      @switch (kind()) {
        @case ('machining') {
          <svg class="layer drawing notes" data-depth="1.1" viewBox="0 0 600 500">
            <path class="draw dim" d="M428 240 L372 150 H230" />
            <circle class="dot" cx="428" cy="240" r="3" />
            <text x="230" y="140" class="label left">{{ labels.toolpath }}</text>
            <text x="230" y="172" class="label left muted">{{ labels.rpm }}</text>
          </svg>
        }
        @case ('finishing') {
          <svg class="layer drawing notes" data-depth="1.1" viewBox="0 0 600 500">
            <path class="draw dim" d="M400 306 L456 388 H580" />
            <circle class="dot" cx="400" cy="306" r="3" />
            <text x="456" y="408" class="label left">{{ labels.anglage }}</text>
            <path class="draw dim" d="M132 222 L92 124 H20" />
            <circle class="dot" cx="132" cy="222" r="3" />
            <text x="20" y="114" class="label left">{{ labels.cotes }}</text>
            <path class="draw dim" d="M170 440 V476 H20" />
            <circle class="dot" cx="170" cy="440" r="3" />
            <text x="20" y="466" class="label left">{{ labels.perlage }}</text>
          </svg>
        }
        @case ('assembly') {
          <svg class="layer drawing notes" data-depth="1.1" viewBox="0 0 600 500">
            <path class="draw dim" d="M262 170 L204 96 H24" />
            <circle class="dot" cx="262" cy="170" r="3" />
            <text x="24" y="86" class="label left">{{ labels.escapeWheel }}</text>
            <text x="24" y="116" class="label left muted">{{ labels.pivot }}</text>
          </svg>
        }
        @case ('regulation') {
          <svg class="layer drawing notes readout" data-depth="1.1" viewBox="0 0 600 500">
            <text x="350" y="44" class="big">{{ labels.rate }}</text>
            <text x="350" y="72" class="label left">{{ labels.amplitude }} · {{ labels.beatError }}</text>
            <text x="350" y="94" class="label left muted small">{{ labels.positions }}</text>
            <path class="trace" d="M350 110 L600 106" />
            <path class="trace alt" d="M350 122 L600 126" />
          </svg>
        }
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
    }

    .stage {
      position: relative;
      aspect-ratio: 6 / 5;
      width: 100%;
    }

    .layer {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      overflow: visible;
    }

    .faint {
      fill: none;
      stroke: rgba(255, 255, 255, 0.07);
      stroke-width: 1;
    }

    .shot {
      isolation: isolate;
    }

    /* Movement close-ups fill the frame; fade their edges into the page. */
    .shot.is-vignetted {
      -webkit-mask-image: radial-gradient(ellipse 50% 50% at 50% 50%, #000 62%, transparent 100%);
      mask-image: radial-gradient(ellipse 50% 50% at 50% 50%, #000 62%, transparent 100%);
    }

    .shot img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: contain;
      user-select: none;
    }

    /* A light sweep that only touches the metal (masked by the render's own alpha). */
    .sweep-mask {
      position: absolute;
      inset: 0;
      overflow: hidden;
      -webkit-mask-size: 100% 100%;
      mask-size: 100% 100%;
      mix-blend-mode: overlay;
      pointer-events: none;
    }

    .sweep {
      position: absolute;
      top: -10%;
      left: 0;
      width: 38%;
      height: 120%;
      background: linear-gradient(100deg, transparent, rgba(255, 246, 223, 0.85) 50%, transparent);
      transform: translateX(-100%) skewX(-12deg);
    }

    .draw {
      fill: none;
      stroke: rgba(242, 239, 233, 0.55);
      stroke-width: 1.2;
    }

    .draw.thin {
      stroke: rgba(242, 239, 233, 0.22);
    }

    .draw.dim {
      stroke: rgba(201, 169, 110, 0.8);
    }

    .dot {
      fill: var(--gold);
    }

    .label {
      font-family: var(--font-mono);
      font-size: 13px;
      letter-spacing: 0.12em;
      fill: var(--gold);
      text-anchor: middle;
      paint-order: stroke;
      stroke: rgba(10, 10, 11, 0.85);
      stroke-width: 4px;
      stroke-linejoin: round;
    }

    .label.left {
      text-anchor: start;
    }

    .label.muted {
      fill: var(--text-muted);
    }

    .label.small {
      font-size: 11px;
      letter-spacing: 0.08em;
    }

    .big {
      font-family: var(--font-mono);
      font-size: 40px;
      fill: var(--text);
      paint-order: stroke;
      stroke: rgba(10, 10, 11, 0.85);
      stroke-width: 5px;
    }

    /* Annotations scale with the frame; keep them legible on phones. */
    @media (max-width: 640px) {
      .label {
        font-size: 16px;
      }

      .label.small {
        font-size: 13px;
      }

      .big {
        font-size: 46px;
      }
    }

    .trace {
      fill: none;
      stroke: var(--gold);
      stroke-width: 2;
      stroke-dasharray: 2 5;
    }

    .trace.alt {
      stroke: var(--steel);
    }
  `,
})
export class CraftIllustrationComponent {
  readonly kind = input.required<CraftIllustration>();

  protected readonly labels = CRAFT_LABELS;
  protected readonly src = computed(() => `craft/${this.kind()}.webp`);
  /** The sweep only needs the render's silhouette, so the small file is enough. */
  protected readonly maskUrl = computed(() => `url(craft/${this.kind()}-600.webp)`);
  protected readonly srcset = computed(() => `craft/${this.kind()}-600.webp 600w, craft/${this.kind()}.webp 1200w`);

  protected readonly bigGear = spokedGearPath(48, 220, 206, 6, 440, 250);
  protected readonly gridX = Array.from({ length: 13 }, (_, i) => i * 50);
  protected readonly gridY = Array.from({ length: 11 }, (_, i) => i * 50);
}
