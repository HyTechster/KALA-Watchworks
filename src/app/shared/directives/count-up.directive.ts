import { afterNextRender, DestroyRef, Directive, ElementRef, inject, input } from '@angular/core';
import { registerGsap } from '../../core/gsap';
import { MotionService } from '../../core/services/motion.service';

export function formatCount(value: number, decimals: number, prefix = '', suffix = ''): string {
  const formatted = value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${prefix}${formatted}${suffix}`;
}

/**
 * Counts the host's number up from zero when it scrolls into view. The server-rendered
 * text already holds the final value, so it stays correct without JavaScript.
 */
@Directive({
  selector: '[appCountUp]',
})
export class CountUpDirective {
  readonly appCountUp = input.required<number>();
  readonly decimals = input(0);
  readonly prefix = input('');
  readonly suffix = input('');

  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly motion = inject(MotionService);

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const host = this.el.nativeElement;
      const render = (n: number) => {
        host.textContent = formatCount(n, this.decimals(), this.prefix(), this.suffix());
      };
      if (this.motion.reduced()) {
        render(this.appCountUp());
        return;
      }

      const gsap = registerGsap();
      const counter = { value: 0 };
      render(0);

      const ctx = gsap.context(() => {
        gsap.to(counter, {
          value: this.appCountUp(),
          duration: 2.2,
          ease: 'expo.out',
          onUpdate: () => render(this.decimals() === 0 ? Math.round(counter.value) : counter.value),
          scrollTrigger: { trigger: host, start: 'top 90%', once: true },
        });
      }, host);

      destroyRef.onDestroy(() => ctx.revert());
    });
  }
}
