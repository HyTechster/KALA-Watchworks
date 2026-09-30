import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { ClockService, HandAngles } from '../../core/services/clock.service';
import { CaseId, DIAL_OPTIONS, DialId, ModelId } from '../../data/configurator-options';
import { tickLines } from '../utils/svg-gear';

let uid = 0;

export const CASE_TONES: Record<CaseId, readonly [string, string, string]> = {
  steel: ['#eef1f4', '#9aa1a9', '#4d5359'],
  titanium: ['#cfd2d5', '#80858b', '#3f4347'],
  'rose-gold': ['#f5d3bf', '#c98f73', '#6e4332'],
};

const shade = (hex: string, amount: number): string => {
  const n = parseInt(hex.slice(1), 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const r = clamp(((n >> 16) & 255) * (1 + amount));
  const g = clamp(((n >> 8) & 255) * (1 + amount));
  const b = clamp((n & 255) * (1 + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
};

/**
 * Vector watch face. By default the hands follow the shared ClockService; pass `angles`
 * to drive them manually (the preloader does this).
 */
@Component({
  selector: 'app-svg-watch-face',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'k-watch-face' },
  template: `
    <svg [attr.viewBox]="withLugs() ? '-100 -132 200 264' : '-104 -104 208 208'" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient [attr.id]="ids.dial" cx="0" cy="0" r="82" gradientUnits="userSpaceOnUse">
          <stop offset="0" [attr.stop-color]="dialLight()" />
          <stop offset="0.65" [attr.stop-color]="dialHex()" />
          <stop offset="1" [attr.stop-color]="dialDark()" />
        </radialGradient>
        <linearGradient [attr.id]="ids.metal" x1="-1" y1="-1" x2="1" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0" [attr.stop-color]="tone()[0]" />
          <stop offset="0.45" [attr.stop-color]="tone()[1]" />
          <stop offset="0.55" [attr.stop-color]="tone()[2]" />
          <stop offset="1" [attr.stop-color]="tone()[0]" />
        </linearGradient>
        <linearGradient [attr.id]="ids.bezel" x1="0" y1="-100" x2="0" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0" [attr.stop-color]="tone()[0]" />
          <stop offset="0.5" [attr.stop-color]="tone()[2]" />
          <stop offset="1" [attr.stop-color]="tone()[1]" />
        </linearGradient>
        <radialGradient [attr.id]="ids.glass" cx="-30" cy="-45" r="120" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#ffffff" stop-opacity="0.22" />
          <stop offset="0.4" stop-color="#ffffff" stop-opacity="0.04" />
          <stop offset="1" stop-color="#ffffff" stop-opacity="0" />
        </radialGradient>
      </defs>

      @if (withLugs()) {
        <g [attr.fill]="'url(#' + ids.metal + ')'" opacity="0.95">
          <path d="M-58 -78 L-50 -128 L-26 -128 L-30 -84 Z" />
          <path d="M58 -78 L50 -128 L26 -128 L30 -84 Z" />
          <path d="M-58 78 L-50 128 L-26 128 L-30 84 Z" />
          <path d="M58 78 L50 128 L26 128 L30 84 Z" />
        </g>
      }

      <!-- Crown -->
      <rect x="94" y="-9" width="11" height="18" rx="2.5" [attr.fill]="'url(#' + ids.metal + ')'" />
      @if (variant() === 'chronograph') {
        <rect x="80" y="-62" width="10" height="13" rx="2" transform="rotate(38 85 -55)" [attr.fill]="'url(#' + ids.metal + ')'" />
        <rect x="80" y="49" width="10" height="13" rx="2" transform="rotate(-38 85 55)" [attr.fill]="'url(#' + ids.metal + ')'" />
      }

      <!-- Case and bezel -->
      <circle r="97" [attr.fill]="'url(#' + ids.bezel + ')'" />
      <circle r="95.5" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="0.6" />
      @if (variant() === 'diver') {
        <circle r="91" fill="#0c0d0f" />
        <g class="bezel-ticks">
          @for (t of bezelTicks; track $index) {
            <line [attr.x1]="t.x1" [attr.y1]="t.y1" [attr.x2]="t.x2" [attr.y2]="t.y2"
              [attr.stroke-width]="t.major ? 1.6 : 0.7" stroke="#d8d3c8" />
          }
        </g>
        @for (n of diverNumerals; track n.label) {
          <text [attr.x]="n.x" [attr.y]="n.y" class="bezel-num">{{ n.label }}</text>
        }
        <path d="M0 -89 L-4.5 -82 L4.5 -82 Z" fill="#e6d3a3" />
      } @else {
        <circle r="90" [attr.fill]="'url(#' + ids.metal + ')'" opacity="0.9" />
      }

      <!-- Dial -->
      <circle r="82" [attr.fill]="'url(#' + ids.dial + ')'" />
      <g class="sunburst" opacity="0.18">
        @for (r of rays; track $index) {
          <line [attr.x1]="0" [attr.y1]="0" [attr.x2]="r.x" [attr.y2]="r.y" stroke="#ffffff" stroke-width="0.25" />
        }
      </g>
      <circle r="82" fill="none" stroke="rgba(0,0,0,0.5)" stroke-width="2" />

      <!-- Minute track -->
      @for (t of minuteTicks; track $index) {
        <line [attr.x1]="t.x1" [attr.y1]="t.y1" [attr.x2]="t.x2" [attr.y2]="t.y2"
          [attr.stroke-width]="t.major ? 1 : 0.45" [attr.stroke]="printColor()" [attr.opacity]="t.major ? 0.9 : 0.55" />
      }

      <!-- Applied indices -->
      @for (idx of indices; track idx.angle) {
        <g [attr.transform]="'rotate(' + idx.angle + ')'">
          @if (idx.angle === 0) {
            <rect x="-5" y="-71" width="3.6" height="17" rx="0.8" [attr.fill]="'url(#' + ids.metal + ')'" />
            <rect x="1.4" y="-71" width="3.6" height="17" rx="0.8" [attr.fill]="'url(#' + ids.metal + ')'" />
          } @else {
            <rect x="-1.9" y="-70" width="3.8" height="14" rx="0.8" [attr.fill]="'url(#' + ids.metal + ')'" />
          }
        </g>
      }

      @if (variant() === 'chronograph') {
        @for (sub of subdials; track sub.x) {
          <g [attr.transform]="'translate(' + sub.x + ' ' + sub.y + ')'">
            <circle r="17" [attr.fill]="dialDark()" />
            <circle r="17" fill="none" [attr.stroke]="printColor()" stroke-opacity="0.35" stroke-width="0.5" />
            @for (t of subTicks; track $index) {
              <line [attr.x1]="t.x1" [attr.y1]="t.y1" [attr.x2]="t.x2" [attr.y2]="t.y2"
                [attr.stroke]="printColor()" stroke-width="0.5" opacity="0.7" />
            }
            <line class="hand" x1="0" y1="3" x2="0" y2="-14" stroke="#e6d3a3" stroke-width="1"
              [style.transform]="'rotate(' + (sub.live ? liveAngles().seconds : 120) + 'deg)'" />
            <circle r="1.6" fill="#e6d3a3" />
          </g>
        }
      }

      <!-- Signature -->
      <text x="0" y="-30" class="logo" [attr.fill]="printColor()">KALA</text>
      <text x="0" y="-22" class="sub" [attr.fill]="printColor()">{{ subLabel() }}</text>
      @if (variant() !== 'chronograph') {
        <text x="0" y="44" class="sub" [attr.fill]="printColor()">{{ lowerLabel() }}</text>
      }

      <!-- Hands -->
      <g class="hand hand--hour" [style.transform]="'rotate(' + liveAngles().hours + 'deg)'">
        <path d="M0 10 L-4.2 0 L0 -46 L4.2 0 Z" [attr.fill]="'url(#' + ids.metal + ')'" />
        <path d="M0 -8 L-1.4 -14 L0 -40 L1.4 -14 Z" fill="#dfe9dc" opacity="0.85" />
      </g>
      <g class="hand hand--minute" [style.transform]="'rotate(' + liveAngles().minutes + 'deg)'">
        <path d="M0 12 L-3.4 0 L0 -70 L3.4 0 Z" [attr.fill]="'url(#' + ids.metal + ')'" />
        <path d="M0 -10 L-1.1 -16 L0 -62 L1.1 -16 Z" fill="#dfe9dc" opacity="0.85" />
      </g>
      @if (showSeconds()) {
        <g class="hand hand--second" [class.is-snappy]="!angles()" [style.transform]="'rotate(' + liveAngles().seconds + 'deg)'">
          <line x1="0" y1="20" x2="0" y2="-76" stroke="#c9a96e" stroke-width="1" />
          <circle cx="0" cy="16" r="3.2" fill="#c9a96e" />
        </g>
      }
      <circle r="3.6" [attr.fill]="'url(#' + ids.metal + ')'" />
      <circle r="1.4" fill="#c9a96e" />

      <!-- Crystal reflection -->
      <circle r="88" [attr.fill]="'url(#' + ids.glass + ')'" />
    </svg>
  `,
  styles: `
    :host {
      display: block;
      aspect-ratio: 1;
      width: 100%;
    }

    :host svg {
      width: 100%;
      height: 100%;
      overflow: visible;
    }

    .hand {
      transform-box: view-box;
      transform-origin: 0 0;
    }

    .hand--hour,
    .hand--minute {
      transition: transform 0.6s var(--ease-out-3);
    }

    .hand--second.is-snappy {
      transition: transform 0.16s cubic-bezier(0.2, 0.9, 0.3, 1);
    }

    .logo {
      font-family: var(--font-display);
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.32em;
      text-anchor: middle;
    }

    .sub {
      font-family: var(--font-mono);
      font-size: 3.6px;
      letter-spacing: 0.3em;
      text-anchor: middle;
      opacity: 0.7;
    }

    .bezel-num {
      font-family: var(--font-mono);
      font-size: 7px;
      fill: #d8d3c8;
      text-anchor: middle;
      dominant-baseline: central;
    }

    @media (prefers-reduced-motion: reduce) {
      .hand--hour,
      .hand--minute,
      .hand--second.is-snappy {
        transition: none;
      }
    }
  `,
})
export class SvgWatchFaceComponent {
  readonly variant = input<ModelId>('dress');
  readonly dial = input<DialId>('teal');
  readonly caseMaterial = input<CaseId>('steel');
  readonly showSeconds = input(true);
  readonly withLugs = input(false);
  /** Manual hand angles. When omitted, the face shows live local time. */
  readonly angles = input<HandAngles | null>(null);
  readonly subLabel = input('AUTOMATIC · 28800');
  readonly lowerLabel = input('SERIES 03');

  private readonly clock = inject(ClockService);

  protected readonly ids = {
    dial: `kdial-${++uid}`,
    metal: `kmetal-${uid}`,
    bezel: `kbezel-${uid}`,
    glass: `kglass-${uid}`,
  };

  protected readonly liveAngles = computed(() => this.angles() ?? this.clock.continuousAngles());
  protected readonly dialHex = computed(() => DIAL_OPTIONS.find((d) => d.id === this.dial())?.hex ?? '#1f5c58');
  protected readonly dialLight = computed(() => shade(this.dialHex(), 0.35));
  protected readonly dialDark = computed(() => shade(this.dialHex(), -0.45));
  protected readonly tone = computed(() => CASE_TONES[this.caseMaterial()]);
  protected readonly printColor = computed(() => (this.dial() === 'salmon' ? '#2a1c16' : '#efeae1'));

  protected readonly minuteTicks = tickLines(60, 74, 79);
  protected readonly bezelTicks = tickLines(60, 84, 89.5);
  protected readonly subTicks = tickLines(12, 13, 16);
  protected readonly indices = Array.from({ length: 12 }, (_, i) => ({ angle: i * 30 }));
  protected readonly subdials = [
    { x: -36, y: 8, live: true },
    { x: 36, y: 8, live: false },
  ];
  protected readonly rays = Array.from({ length: 72 }, (_, i) => {
    const a = (i / 72) * Math.PI * 2;
    return { x: Math.cos(a) * 80, y: Math.sin(a) * 80 };
  });
  protected readonly diverNumerals = [10, 20, 30, 40, 50].map((n) => {
    const a = (n / 60) * Math.PI * 2 - Math.PI / 2;
    return { label: String(n), x: Math.cos(a) * 86.5, y: Math.sin(a) * 86.5 };
  });
}
