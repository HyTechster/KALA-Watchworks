import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  viewChild,
} from '@angular/core';
import { MotionService } from '../../core/services/motion.service';

interface Mote {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  phase: number;
  speed: number;
}

/** Slowly drifting gold dust on a plain 2D canvas (no second WebGL context). */
@Component({
  selector: 'app-gold-dust',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  template: `<canvas #canvas></canvas>`,
  styles: `
    :host {
      position: absolute;
      inset: 0;
      display: block;
      pointer-events: none;
    }

    canvas {
      width: 100%;
      height: 100%;
    }
  `,
})
export class GoldDustComponent {
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly motion = inject(MotionService);

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const canvas = this.canvas().nativeElement;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let width = 0;
      let height = 0;
      let motes: Mote[] = [];
      let frame = 0;
      let visible = false;
      let last = performance.now();

      const seed = () => {
        const count = Math.round(Math.min(110, (width * height) / 14000));
        motes = Array.from({ length: count }, () => ({
          x: Math.random() * width,
          y: Math.random() * height,
          r: 0.4 + Math.random() * 1.6,
          vx: (Math.random() - 0.5) * 6,
          vy: -4 - Math.random() * 10,
          phase: Math.random() * Math.PI * 2,
          speed: 0.6 + Math.random() * 1.4,
        }));
      };

      const resize = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        width = canvas.clientWidth;
        height = canvas.clientHeight;
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        seed();
        draw(0, 0);
      };

      const draw = (dt: number, time: number) => {
        ctx.clearRect(0, 0, width, height);
        for (const m of motes) {
          m.x += m.vx * dt;
          m.y += m.vy * dt;
          if (m.y < -4) {
            m.y = height + 4;
            m.x = Math.random() * width;
          }
          if (m.x < -4) m.x = width + 4;
          if (m.x > width + 4) m.x = -4;
          const twinkle = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(time * m.speed + m.phase));
          ctx.beginPath();
          ctx.fillStyle = `rgba(230, 211, 163, ${(0.55 * twinkle).toFixed(3)})`;
          ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
          ctx.fill();
          if (m.r > 1.4) {
            ctx.beginPath();
            ctx.fillStyle = `rgba(201, 169, 110, ${(0.08 * twinkle).toFixed(3)})`;
            ctx.arc(m.x, m.y, m.r * 4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      };

      const loop = (now: number) => {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        draw(dt, now / 1000);
        frame = requestAnimationFrame(loop);
      };

      const start = () => {
        if (frame || this.motion.reduced()) return;
        last = performance.now();
        frame = requestAnimationFrame(loop);
      };
      const stop = () => {
        cancelAnimationFrame(frame);
        frame = 0;
      };
      const sync = () => (visible && document.visibilityState === 'visible' ? start() : stop());

      const ro = new ResizeObserver(resize);
      ro.observe(canvas);
      const io = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        sync();
      });
      io.observe(canvas);
      document.addEventListener('visibilitychange', sync);

      destroyRef.onDestroy(() => {
        stop();
        ro.disconnect();
        io.disconnect();
        document.removeEventListener('visibilitychange', sync);
      });
    });
  }
}
