import * as THREE from 'three';
import { canvas } from './materials';

/**
 * Canvas texture for the caseback ring. It carries a fixed serial inscription around
 * the edge and the owner's engraving along the upper arc. Redrawn live as the user types.
 *
 * The texture maps onto a RingGeometry whose outer radius equals half the canvas, so a
 * canvas radius converts to world units as `r / (size / 2) * outerRadius`.
 */
export class EngravingTexture {
  readonly texture: THREE.CanvasTexture;
  private readonly el: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;

  constructor(
    private readonly size = 1024,
    private readonly innerRatio = 0.56,
  ) {
    const { canvas: el, ctx } = canvas(size);
    this.el = el;
    this.ctx = ctx;
    this.texture = new THREE.CanvasTexture(el);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.anisotropy = 8;
  }

  draw(engraving: string, serial: string): void {
    const { ctx, size } = this;
    const c = size / 2;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, size, size);

    // Circular brushing.
    ctx.fillStyle = '#d4d4d4';
    ctx.fillRect(0, 0, size, size);
    ctx.translate(c, c);
    for (let r = c * this.innerRatio; r < c; r += 2) {
      const v = 190 + Math.round(Math.random() * 55);
      ctx.strokeStyle = `rgb(${v},${v},${v})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Polished bevel line between the inscription bands.
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, c * 0.84, 0, Math.PI * 2);
    ctx.stroke();

    const outer = `KALA WATCHWORKS · SERIES 03 · ${serial} · CALIBRE K-03 · SAPPHIRE · 50 M ·`;
    this.circularText(outer, c * 0.905, 30, '500', 'rgba(40,40,42,0.85)');

    const text = engraving.trim().toUpperCase();
    if (text) {
      this.arcText(text, c * 0.7, 54, '600', 'rgba(30,30,32,0.92)');
    }

    this.texture.needsUpdate = true;
  }

  dispose(): void {
    this.texture.dispose();
  }

  /** Full-circle text, reading clockwise, starting at 12 o'clock. */
  private circularText(text: string, radius: number, px: number, weight: string, color: string) {
    const { ctx } = this;
    ctx.font = `${weight} ${px}px "JetBrains Mono", ui-monospace, monospace`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const chars = Array.from(text);
    const step = (Math.PI * 2) / chars.length;
    chars.forEach((ch, i) => {
      const a = i * step - Math.PI / 2;
      ctx.save();
      ctx.rotate(a + Math.PI / 2);
      ctx.translate(0, -radius);
      ctx.fillText(ch, 0, 0);
      ctx.restore();
    });
  }

  /** Text centred along the top arc, with a soft highlight to read as engraved. */
  private arcText(text: string, radius: number, px: number, weight: string, color: string) {
    const { ctx } = this;
    ctx.font = `${weight} ${px}px "Syne", ui-sans-serif, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const widths = Array.from(text).map((ch) => ctx.measureText(ch).width + px * 0.12);
    const total = widths.reduce((a, b) => a + b, 0);
    const span = Math.min(total / radius, Math.PI * 1.1);
    const scale = span / (total / radius);
    let angle = -Math.PI / 2 - span / 2;
    Array.from(text).forEach((ch, i) => {
      const w = (widths[i] / radius) * scale;
      const a = angle + w / 2;
      for (const [dy, fill] of [
        [1.5, 'rgba(255,255,255,0.8)'],
        [0, color],
      ] as const) {
        ctx.save();
        ctx.rotate(a + Math.PI / 2);
        ctx.translate(0, -radius + dy);
        ctx.fillStyle = fill;
        ctx.fillText(ch, 0, 0);
        ctx.restore();
      }
      angle += w;
    });
  }
}
