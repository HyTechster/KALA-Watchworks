import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { registerGsap } from '../../core/gsap';
import { MotionService } from '../../core/services/motion.service';
import { ScrollService } from '../../core/services/scroll.service';
import { ANATOMY_COPY, ANATOMY_TICKS } from '../../data/anatomy';
import { SectionHeadingComponent } from '../../shared/ui/section-heading.component';
import { circlePath, escapeWheelPath, spokeWindowsPath, tickLines } from '../../shared/utils/svg-gear';

const BEATS = 8;
const ESCAPE_TEETH = 15;
const HALF_TOOTH = 360 / ESCAPE_TEETH / 2;
const BALANCE_AMPLITUDE = 70;
const FORK_ANGLE = 8;

export const ESCAPE_CENTER = { x: 300, y: 440 };
export const FORK_PIVOT = { x: 300, y: 282 };
export const BALANCE_CENTER = { x: 300, y: 128 };

/** Moment of the k-th tick (1-based) inside one second. */
export const tickTime = (k: number) => (k - 0.5) / BEATS;

/** Number of ticks that have happened by time t (0–1 s). */
export function ticksAt(t: number): number {
  let count = 0;
  for (let k = 1; k <= BEATS; k++) if (t >= tickTime(k)) count++;
  return count;
}

/** Escapement pose (degrees) at time t. The balance crosses centre exactly on each tick. */
export function escapementPose(t: number): { balance: number; fork: number; escape: number } {
  const done = ticksAt(t);
  const since = done === 0 ? 0 : (t - tickTime(done)) * BEATS;
  const snap = done === 0 ? 0 : 1 - Math.pow(1 - Math.min(1, since / 0.3), 3);
  const escape = done === 0 ? 0 : (done - 1 + snap) * HALF_TOOTH;

  const side = done % 2 === 0 ? -1 : 1;
  const previous = -side;
  const blend = done === 0 ? 1 : Math.min(1, since / 0.2);
  const fork = (previous + (side - previous) * blend) * FORK_ANGLE;

  const balance = BALANCE_AMPLITUDE * Math.sin(2 * Math.PI * 4 * (t - tickTime(1)));
  return { balance, fork, escape };
}

/**
 * Anatomy of a Second: one second stretched across the scroll. The escapement animates
 * frame by frame, eight ticks are labelled, and the big second hand snaps at the end.
 */
@Component({
  selector: 'app-anatomy',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SectionHeadingComponent],
  templateUrl: './anatomy.component.html',
  styleUrl: './anatomy.component.scss',
})
export class AnatomyComponent {
  protected readonly copy = ANATOMY_COPY;
  protected readonly ticks = ANATOMY_TICKS;
  protected readonly motion = inject(MotionService);
  private readonly scroll = inject(ScrollService);

  protected readonly escapePath = escapeWheelPath(ESCAPE_TEETH, 108, 84) +
    spokeWindowsPath(5, 70, 22, 8) +
    circlePath(6);
  protected readonly dialTicks = tickLines(60, 150, 162);
  protected readonly escape = ESCAPE_CENTER;
  protected readonly pivot = FORK_PIVOT;
  protected readonly balance = BALANCE_CENTER;
  protected readonly balanceScrews = Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2;
    return { x: BALANCE_CENTER.x + Math.cos(a) * 92, y: BALANCE_CENTER.y + Math.sin(a) * 92 };
  });
  /** Lever with fork horns at the top and two pallet arms reaching down to the escape wheel. */
  protected readonly forkPath = (() => {
    const { x, y } = FORK_PIVOT;
    const pts: [number, number][] = [
      [x - 6, y - 120], [x - 14, y - 140], [x - 4, y - 140], [x, y - 128], [x + 4, y - 140],
      [x + 14, y - 140], [x + 6, y - 120], [x + 6, y - 10], [x + 70, y + 58], [x + 58, y + 70],
      [x, y + 14], [x - 58, y + 70], [x - 70, y + 58], [x - 6, y - 10],
    ];
    return `M ${pts.map(([px, py]) => `${px} ${py}`).join(' L ')} Z`;
  })();
  protected readonly pallets = [1, -1].map((side) => {
    const cx = FORK_PIVOT.x + side * 63;
    const cy = FORK_PIVOT.y + 73;
    return { x: cx - 7, y: cy - 15, transform: `rotate(${-side * 45} ${cx} ${cy})` };
  });
  protected readonly spiral = (() => {
    let d = `M${BALANCE_CENTER.x} ${BALANCE_CENTER.y}`;
    for (let i = 1; i <= 240; i++) {
      const a = (i / 240) * Math.PI * 2 * 6;
      const r = 6 + (i / 240) * 44;
      d += ` L${(BALANCE_CENTER.x + Math.cos(a) * r).toFixed(1)} ${(BALANCE_CENTER.y + Math.sin(a) * r).toFixed(1)}`;
    }
    return d;
  })();

  protected readonly done = signal(0);
  protected readonly finished = computed(() => this.done() >= BEATS);
  protected readonly current = computed(() => this.ticks[Math.max(0, this.done() - 1)]);

  private readonly section = viewChild.required<ElementRef<HTMLElement>>('section');
  private readonly pin = viewChild.required<ElementRef<HTMLElement>>('pin');
  private readonly counter = viewChild.required<ElementRef<HTMLElement>>('counter');
  private readonly escapeEl = viewChild.required<ElementRef<SVGGElement>>('escapeEl');
  private readonly forkEl = viewChild.required<ElementRef<SVGGElement>>('forkEl');
  private readonly balanceEl = viewChild.required<ElementRef<SVGGElement>>('balanceEl');
  private readonly secondEl = viewChild.required<ElementRef<SVGGElement>>('secondEl');

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const gsap = registerGsap();
      const esc = this.escapeEl().nativeElement;
      const fork = this.forkEl().nativeElement;
      const balance = this.balanceEl().nativeElement;
      const second = this.secondEl().nativeElement;
      const counter = this.counter().nativeElement;
      let snapped = false;

      const render = (t: number) => {
        const pose = escapementPose(t);
        gsap.set(esc, { rotation: pose.escape, svgOrigin: `${ESCAPE_CENTER.x} ${ESCAPE_CENTER.y}` });
        gsap.set(fork, { rotation: pose.fork, svgOrigin: `${FORK_PIVOT.x} ${FORK_PIVOT.y}` });
        gsap.set(balance, { rotation: pose.balance, svgOrigin: `${BALANCE_CENTER.x} ${BALANCE_CENTER.y}` });
        counter.textContent = `${t.toFixed(3)} s`;
        const count = t >= 0.9995 ? BEATS : ticksAt(t);
        if (count !== this.done()) this.done.set(count);

        const shouldSnap = t >= 0.9995;
        if (shouldSnap !== snapped) {
          snapped = shouldSnap;
          gsap.to(second, {
            rotation: shouldSnap ? 6 : 0,
            svgOrigin: '200 200',
            duration: this.motion.reduced() ? 0 : 0.18,
            ease: 'power4.out',
          });
        }
      };

      if (this.motion.reduced()) {
        render(1);
        return;
      }

      render(0);
      const ctx = gsap.context(() => {
        gsap.from(this.section().nativeElement.querySelectorAll('.measure'), {
          drawSVG: '0%',
          duration: 1.6,
          ease: 'expo.inOut',
          stagger: 0.1,
          scrollTrigger: { trigger: this.pin().nativeElement, start: 'top 70%', once: true },
        });
        gsap.to(
          {},
          {
            ease: 'none',
            scrollTrigger: {
              trigger: this.pin().nativeElement,
              start: 'top top',
              end: '+=320%',
              pin: true,
              scrub: 0.6,
              onUpdate: (self) => render(self.progress),
            },
          },
        );
      }, this.section().nativeElement);
      this.scroll.requestRefresh();

      destroyRef.onDestroy(() => ctx.revert());
    });
  }
}
