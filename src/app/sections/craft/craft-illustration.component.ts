import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CRAFT_LABELS, CraftIllustration } from '../../data/craft';
import { escapeWheelPath, gearPath, spokedGearPath } from '../../shared/utils/svg-gear';

/**
 * Layered SVG technical illustrations for each craft stage. Layers carry `data-depth`
 * so the parent can move them at different parallax speeds.
 */
@Component({
  selector: 'app-craft-illustration',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  template: `
    <svg viewBox="0 0 600 500" class="art">

      @switch (kind()) {
        @case ('design') {
          <g data-depth="0.25" class="faint">
            <path [attr.d]="bigGear" />
          </g>
          <g data-depth="0.6" class="drawing">
            <circle class="draw" cx="300" cy="250" r="140" />
            <circle class="draw" cx="300" cy="250" r="118" />
            <circle class="draw thin" cx="300" cy="250" r="96" />
            <path class="draw" d="M236 118 L250 62 L290 62 L286 112 M364 118 L350 62 L310 62 L314 112" />
            <path class="draw" d="M236 382 L250 438 L290 438 L286 388 M364 382 L350 438 L310 438 L314 388" />
            <rect class="draw" x="440" y="236" width="26" height="28" rx="4" />
            <path class="draw dim" d="M160 250 H440 M160 244 V256 M440 244 V256" />
            <path class="draw dim" d="M520 62 V438 M514 62 H526 M514 438 H526" />
            <path class="draw dim" d="M160 470 H440 M160 464 V476 M440 464 V476" />
            <path class="draw thin" d="M300 90 V410 M140 250 H460" stroke-dasharray="6 6" />
            <text x="300" y="240" class="label">{{ labels.diameter }}</text>
            <text x="532" y="254" class="label left">{{ labels.lugToLug }}</text>
            <text x="300" y="492" class="label">{{ labels.scale }}</text>
          </g>
          <g data-depth="1.1" class="tool">
            <g transform="translate(470 360) rotate(-35)">
              <rect x="-6" y="-120" width="12" height="150" rx="2" />
              <path d="M-6 30 L0 52 L6 30 Z" class="gold" />
            </g>
            <text x="40" y="40" class="label left">{{ labels.drawingNo }}</text>
          </g>
        }
        @case ('machining') {
          <g data-depth="0.2" class="faint">
            @for (x of gridX; track x) {
              <line [attr.x1]="x" y1="0" [attr.x2]="x" y2="500" />
            }
            @for (y of gridY; track y) {
              <line x1="0" [attr.y1]="y" x2="600" [attr.y2]="y" />
            }
          </g>
          <g data-depth="0.6" class="drawing">
            <circle class="draw" cx="200" cy="250" r="110" />
            <circle class="draw thin" cx="200" cy="250" r="70" />
            @for (a of [0, 120, 240]; track a) {
              <rect class="draw" x="188" y="130" width="24" height="46" [attr.transform]="'rotate(' + a + ' 200 250)'" />
            }
            <rect class="draw" x="200" y="226" width="300" height="48" />
            <path class="draw gold-stroke" d="M430 300 L470 274 L500 330 Z" />
            <text x="440" y="360" class="label left">{{ labels.toolpath }}</text>
            <text x="200" y="400" class="label">{{ labels.rpm }}</text>
          </g>
          <g data-depth="1.2" class="parts">
            <path [attr.d]="gearSmall" transform="translate(470 120)" />
            <path [attr.d]="gearTiny" transform="translate(540 200)" />
            <path [attr.d]="gearMid" transform="translate(90 420)" />
            <path class="spark" d="M470 276 l30 -24 M470 276 l38 -6 M470 276 l26 -34" />
          </g>
        }
        @case ('finishing') {
          <defs>
            <linearGradient id="craft-sweep" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stop-color="#fff" stop-opacity="0" />
              <stop offset="0.5" stop-color="#fff6df" stop-opacity="0.85" />
              <stop offset="1" stop-color="#fff" stop-opacity="0" />
            </linearGradient>
            <pattern id="craft-cotes" width="26" height="26" patternUnits="userSpaceOnUse" patternTransform="rotate(28)">
              <rect width="13" height="26" fill="rgba(255,255,255,0.07)" />
              <rect x="13" width="13" height="26" fill="rgba(255,255,255,0.02)" />
            </pattern>
            <clipPath id="craft-bridge-clip">
              <path d="M90 170 Q220 90 420 130 Q520 150 520 250 Q510 350 380 360 Q240 370 150 320 Q60 270 90 170 Z" />
            </clipPath>
          </defs>
          <g data-depth="0.25" class="faint">
            <path [attr.d]="bigGear" />
          </g>
          <g data-depth="0.6">
            <path class="bridge" d="M90 170 Q220 90 420 130 Q520 150 520 250 Q510 350 380 360 Q240 370 150 320 Q60 270 90 170 Z" />
            <g clip-path="url(#craft-bridge-clip)">
              <rect x="0" y="0" width="600" height="500" fill="url(#craft-cotes)" />
              <rect class="sweep" x="-220" y="0" width="220" height="500" fill="url(#craft-sweep)" />
            </g>
            <path class="bevel" d="M90 170 Q220 90 420 130 Q520 150 520 250" />
            @for (j of jewels; track j.x) {
              <circle [attr.cx]="j.x" [attr.cy]="j.y" r="10" class="jewel-ring" />
              <circle [attr.cx]="j.x" [attr.cy]="j.y" r="5" class="jewel" />
            }
          </g>
          <g data-depth="1.1" class="tool">
            <g transform="translate(470 400) rotate(-50)">
              <rect x="-10" y="-130" width="20" height="150" rx="10" class="wood" />
            </g>
          </g>
        }
        @case ('assembly') {
          <g data-depth="0.25" class="faint">
            <line x1="300" y1="20" x2="300" y2="480" stroke-dasharray="4 8" />
          </g>
          <g data-depth="0.7" class="drawing">
            @for (layer of stack; track layer.y) {
              <ellipse class="draw" cx="300" [attr.cy]="layer.y" [attr.rx]="layer.rx" [attr.ry]="layer.rx * 0.28" />
              <ellipse class="draw thin" cx="300" [attr.cy]="layer.y + 8" [attr.rx]="layer.rx" [attr.ry]="layer.rx * 0.28" />
            }
          </g>
          <g data-depth="1.25" class="tool">
            <path d="M520 60 L372 262 M540 74 L380 268" />
            <circle cx="376" cy="266" r="4" class="jewel" />
            @for (s of screws; track s.x) {
              <g [attr.transform]="'translate(' + s.x + ' ' + s.y + ')'">
                <circle r="9" class="screw" />
                <line x1="-6" y1="0" x2="6" y2="0" [attr.transform]="'rotate(' + s.r + ')'" />
              </g>
            }
          </g>
        }
        @case ('regulation') {
          <g data-depth="0.25" class="faint">
            @for (y of gridY; track y) {
              <line x1="0" [attr.y1]="y" x2="600" [attr.y2]="y" />
            }
          </g>
          <g data-depth="0.6" class="drawing">
            <circle class="draw" cx="200" cy="240" r="110" />
            <path class="draw" d="M90 240 H310 M200 130 V350" />
            <path class="draw gold-stroke" [attr.d]="spiral" />
            <path class="draw" [attr.d]="escape" transform="translate(430 170)" />
          </g>
          <g data-depth="1.1" class="readout">
            <path class="trace" d="M330 330 L600 322" />
            <path class="trace alt" d="M330 350 L600 356" />
            <text x="340" y="400" class="big">{{ labels.rate }}</text>
            <text x="340" y="430" class="label left">{{ labels.amplitude }} · {{ labels.beatError }}</text>
            <text x="340" y="455" class="label left">{{ labels.positions }}</text>
          </g>
        }
      }
    </svg>
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
    }

    .art {
      width: 100%;
      height: auto;
      overflow: visible;
    }

    .faint {
      fill: none;
      stroke: rgba(255, 255, 255, 0.07);
      stroke-width: 1;
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
      stroke: rgba(201, 169, 110, 0.75);
    }

    .gold-stroke {
      stroke: var(--gold) !important;
    }

    .label {
      font-family: var(--font-mono);
      font-size: 13px;
      letter-spacing: 0.12em;
      fill: var(--gold);
      text-anchor: middle;
    }

    .label.left {
      text-anchor: start;
    }

    .big {
      font-family: var(--font-mono);
      font-size: 44px;
      fill: var(--text);
    }

    .tool rect,
    .tool path:not(.gold) {
      fill: none;
      stroke: rgba(184, 190, 198, 0.75);
      stroke-width: 1.4;
    }

    .gold {
      fill: var(--gold);
    }

    .wood {
      fill: #6b4a33 !important;
      stroke: #8d6848 !important;
    }

    .parts path {
      fill: rgba(201, 169, 110, 0.14);
      stroke: var(--gold);
      stroke-width: 1;
      fill-rule: evenodd;
    }

    .parts .spark {
      fill: none;
      stroke: var(--gold-light);
    }

    .bridge {
      fill: #2a2c30;
      stroke: rgba(255, 255, 255, 0.2);
    }

    .bevel {
      fill: none;
      stroke: rgba(255, 248, 230, 0.8);
      stroke-width: 2.5;
    }

    .jewel-ring {
      fill: #d9c38f;
    }

    .jewel {
      fill: #b3122a;
    }

    .screw {
      fill: #27468f;
    }

    .tool line {
      stroke: #0a0a0b;
      stroke-width: 2;
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
  protected readonly bigGear = spokedGearPath(48, 220, 206, 6, 440, 250);
  protected readonly gearSmall = spokedGearPath(24, 60, 52, 4);
  protected readonly gearTiny = gearPath(12, 26, 20);
  protected readonly gearMid = spokedGearPath(32, 80, 72, 5);
  protected readonly escape = escapeWheelPath(15, 70, 54);
  protected readonly gridX = Array.from({ length: 13 }, (_, i) => i * 50);
  protected readonly gridY = Array.from({ length: 11 }, (_, i) => i * 50);
  protected readonly jewels = [
    { x: 200, y: 180 },
    { x: 330, y: 160 },
    { x: 440, y: 260 },
  ];
  protected readonly stack = [
    { y: 110, rx: 190 },
    { y: 190, rx: 150 },
    { y: 270, rx: 120 },
    { y: 350, rx: 170 },
  ];
  protected readonly screws = [
    { x: 120, y: 420, r: 20 },
    { x: 160, y: 450, r: 70 },
    { x: 90, y: 460, r: 130 },
  ];
  protected readonly spiral = (() => {
    let d = 'M200 240';
    for (let i = 1; i <= 360; i++) {
      const a = (i / 360) * Math.PI * 2 * 8;
      const r = 6 + (i / 360) * 70;
      d += ` L${(200 + Math.cos(a) * r).toFixed(1)} ${(240 + Math.sin(a) * r).toFixed(1)}`;
    }
    return d;
  })();
}
