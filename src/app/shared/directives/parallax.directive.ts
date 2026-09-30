import { afterNextRender, DestroyRef, Directive, ElementRef, inject, input } from '@angular/core';
import { registerGsap } from '../../core/gsap';
import { MotionService } from '../../core/services/motion.service';

/** Scroll-scrubbed vertical drift. Positive speeds move slower than the page, negative faster. */
@Directive({
  selector: '[appParallax]',
})
export class ParallaxDirective {
  /** Travel in percent of the element's height across the viewport pass. */
  readonly appParallax = input<number | ''>(12);

  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly motion = inject(MotionService);

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      if (this.motion.reduced()) return;
      const host = this.el.nativeElement;
      const gsap = registerGsap();
      const value = this.appParallax();
      const travel = value === '' ? 12 : value;

      const ctx = gsap.context(() => {
        gsap.fromTo(
          host,
          { yPercent: -travel },
          {
            yPercent: travel,
            ease: 'none',
            scrollTrigger: { trigger: host, start: 'top bottom', end: 'bottom top', scrub: true },
          },
        );
      }, host);

      destroyRef.onDestroy(() => ctx.revert());
    });
  }
}
