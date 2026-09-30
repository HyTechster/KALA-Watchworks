import { NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  contentChild,
  DestroyRef,
  ElementRef,
  inject,
  input,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { registerGsap } from '../../core/gsap';
import { MotionService } from '../../core/services/motion.service';
import { ScrollService } from '../../core/services/scroll.service';

/**
 * Infinite marquee. Pass the content as an <ng-template>; it is rendered several times
 * and the track loops seamlessly. Optionally reacts to scroll velocity and pauses on hover.
 */
@Component({
  selector: 'app-marquee',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  host: {
    class: 'k-marquee',
    '[class.is-static]': 'motion.reduced()',
  },
  template: `
    <div class="track" #track>
      @for (copy of copies; track copy) {
        <div class="group" [attr.aria-hidden]="copy > 0 ? 'true' : null" [attr.inert]="copy > 0 ? '' : null">
          @if (template(); as tpl) {
            <ng-container *ngTemplateOutlet="tpl" />
          }
        </div>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
      overflow: hidden;
      width: 100%;
    }

    .track {
      display: flex;
      width: max-content;
      will-change: transform;
    }

    .group {
      display: flex;
      flex: none;
      align-items: stretch;
    }

    :host(.is-static) {
      overflow-x: auto;
      scrollbar-width: none;
    }

    :host(.is-static) .group:not(:first-child) {
      display: none;
    }
  `,
})
export class MarqueeComponent {
  /** Pixels per second. */
  readonly speed = input(60);
  readonly direction = input<'left' | 'right'>('left');
  readonly reactToScroll = input(false);
  readonly pauseOnHover = input(false);

  protected readonly motion = inject(MotionService);
  private readonly scroll = inject(ScrollService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly template = contentChild(TemplateRef);
  private readonly track = viewChild.required<ElementRef<HTMLElement>>('track');

  protected readonly copies = [0, 1, 2];

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      if (this.motion.reduced()) return;
      const gsap = registerGsap();
      const track = this.track().nativeElement;
      const hostEl = this.host.nativeElement;
      const firstGroup = track.firstElementChild as HTMLElement | null;
      if (!firstGroup) return;

      let groupWidth = firstGroup.offsetWidth;
      let offset = 0;
      let speedFactor = 1;
      let targetFactor = 1;
      let skew = 0;
      let visible = true;
      const dir = this.direction() === 'left' ? -1 : 1;

      const resize = new ResizeObserver(() => (groupWidth = firstGroup.offsetWidth));
      resize.observe(firstGroup);

      const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting), { rootMargin: '100px' });
      io.observe(hostEl);

      const tick = (_time: number, deltaMs: number) => {
        if (!visible || groupWidth === 0) return;
        const dt = Math.min(deltaMs, 64) / 1000;
        const velocity = this.reactToScroll() ? this.scroll.velocity : 0;
        const boost = Math.min(Math.abs(velocity) * 0.35, 6);
        speedFactor += (targetFactor + boost - speedFactor) * Math.min(1, dt * 6);
        offset += dir * this.speed() * speedFactor * dt;
        offset = ((offset % groupWidth) - groupWidth) % groupWidth;

        const targetSkew = this.reactToScroll() ? Math.max(-8, Math.min(8, velocity * -0.6)) : 0;
        skew += (targetSkew - skew) * Math.min(1, dt * 8);
        track.style.transform = `translate3d(${offset.toFixed(2)}px,0,0) skewX(${skew.toFixed(2)}deg)`;
      };
      gsap.ticker.add(tick);

      const onEnter = () => {
        if (this.pauseOnHover()) targetFactor = 0;
      };
      const onLeave = () => (targetFactor = 1);
      hostEl.addEventListener('pointerenter', onEnter);
      hostEl.addEventListener('pointerleave', onLeave);
      hostEl.addEventListener('focusin', onEnter);
      hostEl.addEventListener('focusout', onLeave);

      destroyRef.onDestroy(() => {
        gsap.ticker.remove(tick);
        resize.disconnect();
        io.disconnect();
        hostEl.removeEventListener('pointerenter', onEnter);
        hostEl.removeEventListener('pointerleave', onLeave);
        hostEl.removeEventListener('focusin', onEnter);
        hostEl.removeEventListener('focusout', onLeave);
      });
    });
  }
}
