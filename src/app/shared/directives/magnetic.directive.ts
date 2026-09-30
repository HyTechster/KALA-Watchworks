import { afterNextRender, DestroyRef, Directive, ElementRef, inject, input } from '@angular/core';
import { registerGsap } from '../../core/gsap';
import { MotionService } from '../../core/services/motion.service';

/** Pulls the host toward the pointer while it hovers nearby, then eases back. */
@Directive({
  selector: '[appMagnetic]',
})
export class MagneticDirective {
  /** Fraction of the pointer offset applied to the element. */
  readonly appMagnetic = input<number | ''>(0.35);

  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly motion = inject(MotionService);

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const host = this.el.nativeElement;
      const gsap = registerGsap();
      const xTo = gsap.quickTo(host, 'x', { duration: 0.8, ease: 'power3.out' });
      const yTo = gsap.quickTo(host, 'y', { duration: 0.8, ease: 'power3.out' });

      const strength = () => {
        const value = this.appMagnetic();
        return value === '' ? 0.35 : value;
      };

      const onMove = (event: PointerEvent) => {
        if (this.motion.reduced() || !this.motion.finePointer()) return;
        const rect = host.getBoundingClientRect();
        const dx = event.clientX - (rect.left + rect.width / 2);
        const dy = event.clientY - (rect.top + rect.height / 2);
        xTo(dx * strength());
        yTo(dy * strength());
      };

      const onLeave = () => {
        xTo(0);
        yTo(0);
      };

      host.addEventListener('pointermove', onMove);
      host.addEventListener('pointerleave', onLeave);

      destroyRef.onDestroy(() => {
        host.removeEventListener('pointermove', onMove);
        host.removeEventListener('pointerleave', onLeave);
        gsap.killTweensOf(host);
      });
    });
  }
}
