import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
} from '@angular/core';
import { registerGsap } from '../../core/gsap';
import { MotionService } from '../../core/services/motion.service';

export type GuideLayout = 'frame' | 'cross' | 'grid';

/**
 * Technical-drawing guide lines and measurements that draw themselves in (DrawSVG)
 * behind a section when it scrolls into view.
 */
@Component({
  selector: 'app-guide-lines',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  template: `
    <svg viewBox="0 0 1000 600" preserveAspectRatio="none" class="lines">
      @switch (layout()) {
        @case ('frame') {
          <path class="draw" d="M40 60 H960" />
          <path class="draw" d="M40 540 H960" />
          <path class="draw" d="M80 20 V580" />
          <path class="draw" d="M920 20 V580" />
          <path class="draw dim" d="M80 580 H920" />
          <path class="draw dim" d="M80 572 V588 M920 572 V588" />
          <circle class="draw" cx="500" cy="300" r="220" />
          <circle class="draw faint" cx="500" cy="300" r="160" />
        }
        @case ('cross') {
          <path class="draw" d="M0 300 H1000" />
          <path class="draw" d="M500 0 V600" />
          <circle class="draw" cx="500" cy="300" r="250" />
          <circle class="draw faint" cx="500" cy="300" r="120" />
          <path class="draw dim" d="M250 40 H750 M250 32 V48 M750 32 V48" />
        }
        @case ('grid') {
          <path class="draw faint" d="M0 150 H1000 M0 300 H1000 M0 450 H1000" />
          <path class="draw faint" d="M250 0 V600 M500 0 V600 M750 0 V600" />
          <path class="draw dim" d="M40 580 H960 M40 572 V588 M960 572 V588" />
        }
      }
    </svg>
    @if (label()) {
      <span class="measure t-label">{{ label() }}</span>
    }
  `,
  styles: `
    :host {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 0;
      overflow: hidden;
    }

    .lines {
      width: 100%;
      height: 100%;
      overflow: visible;
    }

    .draw {
      fill: none;
      stroke: rgba(255, 255, 255, 0.07);
      stroke-width: 1;
      vector-effect: non-scaling-stroke;
    }

    .faint {
      stroke: rgba(255, 255, 255, 0.04);
      stroke-dasharray: 4 6;
    }

    .dim {
      stroke: rgba(201, 169, 110, 0.35);
    }

    .measure {
      position: absolute;
      right: 8%;
      bottom: 2.4%;
      color: rgba(201, 169, 110, 0.7);
      font-size: 0.625rem;
    }
  `,
})
export class GuideLinesComponent {
  readonly layout = input<GuideLayout>('frame');
  readonly label = input('');

  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly motion = inject(MotionService);

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      if (this.motion.reduced()) return;
      const gsap = registerGsap();
      const host = this.el.nativeElement;
      const ctx = gsap.context(() => {
        const solid = host.querySelectorAll('.draw:not(.faint)');
        gsap.from(solid, {
          drawSVG: '0%',
          duration: 1.8,
          ease: 'expo.inOut',
          stagger: 0.12,
          scrollTrigger: { trigger: host, start: 'top 75%', once: true },
        });
        gsap.from(host.querySelectorAll('.faint, .measure'), {
          autoAlpha: 0,
          duration: 1.2,
          delay: 0.8,
          scrollTrigger: { trigger: host, start: 'top 75%', once: true },
        });
      }, host);
      destroyRef.onDestroy(() => ctx.revert());
    });
  }
}
