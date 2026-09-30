import { afterNextRender, DestroyRef, Directive, ElementRef, inject, input } from '@angular/core';
import { registerGsap } from '../../core/gsap';
import { MotionService } from '../../core/services/motion.service';

/**
 * Tilts the host in 3D toward the pointer and exposes the glare position as
 * `--glare-x`, `--glare-y` and `--glare-o` CSS variables for a moving highlight.
 */
@Directive({
  selector: '[appTilt3d]',
})
export class Tilt3dDirective {
  /** Maximum tilt in degrees. */
  readonly appTilt3d = input<number | ''>(10);

  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly motion = inject(MotionService);

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const host = this.el.nativeElement;
      const gsap = registerGsap();
      gsap.set(host, { transformPerspective: 900, transformStyle: 'preserve-3d' });
      const rxTo = gsap.quickTo(host, 'rotationX', { duration: 0.7, ease: 'power3.out' });
      const ryTo = gsap.quickTo(host, 'rotationY', { duration: 0.7, ease: 'power3.out' });
      let frame = 0;

      const max = () => {
        const value = this.appTilt3d();
        return value === '' ? 10 : value;
      };

      const onMove = (event: PointerEvent) => {
        if (this.motion.reduced() || !this.motion.finePointer()) return;
        const rect = host.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width;
        const py = (event.clientY - rect.top) / rect.height;
        rxTo((0.5 - py) * max());
        ryTo((px - 0.5) * max());
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          host.style.setProperty('--glare-x', `${(px * 100).toFixed(1)}%`);
          host.style.setProperty('--glare-y', `${(py * 100).toFixed(1)}%`);
          host.style.setProperty('--glare-o', '1');
        });
      };

      const onLeave = () => {
        rxTo(0);
        ryTo(0);
        cancelAnimationFrame(frame);
        host.style.setProperty('--glare-o', '0');
      };

      host.addEventListener('pointermove', onMove);
      host.addEventListener('pointerleave', onLeave);

      destroyRef.onDestroy(() => {
        cancelAnimationFrame(frame);
        host.removeEventListener('pointermove', onMove);
        host.removeEventListener('pointerleave', onLeave);
        gsap.killTweensOf(host);
      });
    });
  }
}
