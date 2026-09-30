import { afterNextRender, DestroyRef, Directive, ElementRef, inject, input } from '@angular/core';
import { registerGsap } from '../../core/gsap';
import { MotionService } from '../../core/services/motion.service';

/**
 * Heavy fade-up on scroll. Use `appReveal="children"` to stagger the direct children
 * instead of the host itself.
 */
@Directive({
  selector: '[appReveal]',
})
export class RevealDirective {
  readonly appReveal = input<'self' | 'children' | ''>('self');
  readonly revealDelay = input(0);
  readonly revealY = input(48);
  readonly revealStart = input('top 88%');

  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly motion = inject(MotionService);

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      if (this.motion.reduced()) return;
      const host = this.el.nativeElement;
      const gsap = registerGsap();
      const targets = this.appReveal() === 'children' ? Array.from(host.children) : [host];
      if (targets.length === 0) return;

      const ctx = gsap.context(() => {
        gsap.from(targets, {
          y: this.revealY(),
          autoAlpha: 0,
          duration: 1.15,
          ease: 'expo.out',
          delay: this.revealDelay(),
          stagger: 0.09,
          clearProps: 'transform',
          scrollTrigger: {
            trigger: host,
            start: this.revealStart(),
            once: true,
          },
        });
      }, host);

      destroyRef.onDestroy(() => ctx.revert());
    });
  }
}
