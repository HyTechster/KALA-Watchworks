import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CaseId, ModelId } from '../../data/configurator-options';
import { circlePath, escapeWheelPath, spokedGearPath } from '../utils/svg-gear';
import { CASE_TONES } from './svg-watch-face.component';

let uid = 0;

/** Vector caseback (with a beating balance) and technical side profile of a KALA watch. */
@Component({
  selector: 'app-svg-watch-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @switch (view()) {
      @case ('caseback') {
        <svg viewBox="-104 -104 208 208" aria-hidden="true" focusable="false">
          <defs>
            <linearGradient [attr.id]="ids.metal" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" [attr.stop-color]="tone()[0]" />
              <stop offset="0.5" [attr.stop-color]="tone()[2]" />
              <stop offset="1" [attr.stop-color]="tone()[1]" />
            </linearGradient>
            <radialGradient [attr.id]="ids.plate" cx="0" cy="0" r="66" gradientUnits="userSpaceOnUse">
              <stop offset="0" stop-color="#3a3d42" />
              <stop offset="1" stop-color="#1c1d20" />
            </radialGradient>
            <path [attr.id]="ids.ring" d="M-80 0 A80 80 0 1 1 80 0 A80 80 0 1 1 -80 0" />
          </defs>
          <circle r="97" [attr.fill]="'url(#' + ids.metal + ')'" />
          <circle r="88" fill="#1a1b1e" />
          <circle r="88" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="0.5" />
          <text class="ring-text">
            <textPath [attr.href]="'#' + ids.ring" startOffset="0">{{ ringText() }}</textPath>
          </text>
          @for (s of screws; track $index) {
            <g [attr.transform]="'translate(' + s.x + ' ' + s.y + ')'">
              <circle r="3.2" [attr.fill]="'url(#' + ids.metal + ')'" />
              <line x1="-2.4" y1="0" x2="2.4" y2="0" stroke="#2b2c30" stroke-width="0.8" [attr.transform]="'rotate(' + s.r + ')'" />
            </g>
          }
          <!-- Sapphire window with movement -->
          <circle r="68" [attr.fill]="'url(#' + ids.plate + ')'" />
          @for (p of perlage; track $index) {
            <circle [attr.cx]="p.x" [attr.cy]="p.y" r="6" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="3" />
          }
          <g transform="translate(18 22)">
            <g class="gear gear--a" fill="#c9a96e" fill-rule="evenodd">
              <path [attr.d]="gearA" />
            </g>
          </g>
          <g transform="translate(-22 30)">
            <g class="gear gear--b" fill="#b8bec6" fill-rule="evenodd">
              <path [attr.d]="gearB" />
            </g>
          </g>
          <g transform="translate(24 -30)">
            <g class="gear gear--esc" fill="#b8bec6">
              <path [attr.d]="escape" />
            </g>
          </g>
          <!-- Bridge with Côtes de Genève -->
          <path d="M-60 26 C-30 10 10 12 50 36 L44 48 C8 26 -28 24 -54 38 Z" fill="#8f959c" opacity="0.9" />
          <g transform="translate(-26 -24)">
            <g class="balance" fill="none" stroke="#e6d3a3">
              <circle r="17" stroke-width="2.6" />
              <line x1="-17" y1="0" x2="17" y2="0" stroke-width="1.6" />
              <line x1="0" y1="-17" x2="0" y2="17" stroke-width="1.6" />
              <path d="M0 0 m-3 0 a3 3 0 1 0 6 0 a5 5 0 1 0 -10 0 a7 7 0 1 0 14 0 a9 9 0 1 0 -18 0" stroke-width="0.4" opacity="0.8" />
            </g>
            <circle r="2" fill="#c0392b" />
          </g>
          <!-- Rotor -->
          <g class="rotor">
            <path [attr.d]="rotor" [attr.fill]="'url(#' + ids.metal + ')'" fill-rule="evenodd" opacity="0.92" />
            <text x="0" y="52" class="rotor-text">KALA · K-03</text>
          </g>
          <circle r="4.2" fill="#e6d3a3" />
          <circle r="68" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="0.6" />
        </svg>
      }
      @case ('profile') {
        <svg viewBox="-150 -80 300 160" aria-hidden="true" focusable="false">
          <defs>
            <linearGradient [attr.id]="ids.metal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" [attr.stop-color]="tone()[0]" />
              <stop offset="0.5" [attr.stop-color]="tone()[1]" />
              <stop offset="1" [attr.stop-color]="tone()[2]" />
            </linearGradient>
          </defs>
          <g class="guides" stroke="rgba(201,169,110,0.5)" stroke-width="0.4" fill="none">
            <line x1="-120" y1="-60" x2="120" y2="-60" stroke-dasharray="2 3" />
            <line x1="-120" y1="40" x2="120" y2="40" stroke-dasharray="2 3" />
            <line x1="130" y1="-34" x2="130" y2="28" />
            <line x1="126" y1="-34" x2="134" y2="-34" />
            <line x1="126" y1="28" x2="134" y2="28" />
            <line x1="-96" y1="54" x2="96" y2="54" />
            <line x1="-96" y1="50" x2="-96" y2="58" />
            <line x1="96" y1="50" x2="96" y2="58" />
          </g>
          <text x="137" y="0" class="dim">{{ thicknessLabel() }}</text>
          <text x="0" y="66" class="dim dim--center">{{ diameterLabel() }}</text>
          <!-- Lugs -->
          <path d="M-96 -6 C-112 -6 -124 6 -128 22 L-116 24 C-110 12 -104 8 -96 8 Z" [attr.fill]="'url(#' + ids.metal + ')'" />
          <path d="M96 -6 C112 -6 124 6 128 22 L116 24 C110 12 104 8 96 8 Z" [attr.fill]="'url(#' + ids.metal + ')'" />
          <!-- Case band -->
          <path d="M-96 -22 L96 -22 C100 -22 102 -18 102 -12 L102 14 C102 22 96 28 88 28 L-88 28 C-96 28 -102 22 -102 14 L-102 -12 C-102 -18 -100 -22 -96 -22 Z"
            [attr.fill]="'url(#' + ids.metal + ')'" />
          <!-- Bezel and domed crystal -->
          <path d="M-92 -22 L-88 -30 L88 -30 L92 -22 Z" [attr.fill]="'url(#' + ids.metal + ')'" />
          <path d="M-84 -30 C-60 -40 60 -40 84 -30 Z" fill="rgba(170,210,220,0.25)" stroke="rgba(255,255,255,0.5)" stroke-width="0.5" />
          <!-- Caseback -->
          <path d="M-80 28 L-74 34 L74 34 L80 28 Z" [attr.fill]="'url(#' + ids.metal + ')'" opacity="0.85" />
          <!-- Crown -->
          <rect x="102" y="-8" width="4" height="10" [attr.fill]="'url(#' + ids.metal + ')'" />
          <rect x="106" y="-12" width="10" height="18" rx="2" [attr.fill]="'url(#' + ids.metal + ')'" />
          @for (k of knurls; track k) {
            <line [attr.x1]="106 + k" y1="-12" [attr.x2]="106 + k" y2="6" stroke="rgba(0,0,0,0.35)" stroke-width="0.5" />
          }
          @if (variant() === 'chronograph') {
            <rect x="92" y="-28" width="12" height="6" rx="1.5" [attr.fill]="'url(#' + ids.metal + ')'" />
          }
          <line x1="-102" y1="-4" x2="102" y2="-4" stroke="rgba(255,255,255,0.35)" stroke-width="0.4" />
        </svg>
      }
    }
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
    }

    svg {
      width: 100%;
      height: 100%;
    }

    .ring-text {
      font-family: var(--font-mono);
      font-size: 5.2px;
      letter-spacing: 0.28em;
      fill: rgba(242, 239, 233, 0.6);
    }

    .rotor-text {
      font-family: var(--font-mono);
      font-size: 5px;
      letter-spacing: 0.3em;
      text-anchor: middle;
      fill: #2b2c30;
    }

    .dim {
      font-family: var(--font-mono);
      font-size: 7px;
      fill: #c9a96e;
      dominant-baseline: central;
    }

    .dim--center {
      text-anchor: middle;
    }

    // Each moving part is drawn around its own origin inside a translated wrapper.
    .gear,
    .balance,
    .rotor {
      transform-box: view-box;
      transform-origin: 0 0;
    }

    .gear--a {
      animation: spin 60s steps(480) infinite;
    }

    .gear--b {
      animation: spin 20s steps(160) infinite reverse;
    }

    .gear--esc {
      animation: spin 3.75s steps(30) infinite;
    }

    .balance {
      animation: swing 0.125s ease-in-out infinite alternate;
    }

    .rotor {
      animation: spin 24s linear infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    @keyframes swing {
      from {
        transform: rotate(-110deg);
      }
      to {
        transform: rotate(110deg);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .gear--a,
      .gear--b,
      .gear--esc,
      .balance,
      .rotor {
        animation: none;
      }
    }
  `,
})
export class SvgWatchViewComponent {
  readonly view = input<'caseback' | 'profile'>('caseback');
  readonly caseMaterial = input<CaseId>('steel');
  readonly variant = input<ModelId>('dress');
  readonly ringText = input('KALA WATCHWORKS · CALIBRE K-03 · 28,800 VPH · SAPPHIRE · HAND-ASSEMBLED ·');
  readonly thicknessLabel = input('9.8');
  readonly diameterLabel = input('Ø 38.0');

  protected readonly ids = { metal: `kv-metal-${++uid}`, plate: `kv-plate-${uid}`, ring: `kv-ring-${uid}` };
  protected readonly tone = computed(() => CASE_TONES[this.caseMaterial()]);

  protected readonly gearA = spokedGearPath(40, 24, 22, 5);
  protected readonly gearB = spokedGearPath(30, 15, 13.4, 4);
  protected readonly escape = escapeWheelPath(15, 11, 8) + circlePath(1.5);
  protected readonly rotor =
    'M-64 0 A64 64 0 0 0 64 0 L50 0 A50 50 0 0 1 -50 0 Z ' +
    'M-44 6 A44 44 0 0 0 44 6 L8 6 A8 8 0 0 1 -8 6 Z';
  protected readonly screws = [0, 60, 120, 180, 240, 300].map((deg, i) => {
    const a = (deg * Math.PI) / 180;
    return { x: Math.cos(a) * 92.5, y: Math.sin(a) * 92.5, r: i * 37 };
  });
  protected readonly perlage = Array.from({ length: 18 }, (_, i) => ({
    x: -48 + (i % 6) * 19,
    y: -40 + Math.floor(i / 6) * 34,
  }));
  protected readonly knurls = [1, 2.5, 4, 5.5, 7, 8.5];
}
