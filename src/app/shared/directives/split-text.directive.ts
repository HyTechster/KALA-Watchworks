import { afterNextRender, DestroyRef, Directive, effect, ElementRef, inject, Injector, input } from '@angular/core';
import { registerGsap, SplitText } from '../../core/gsap';
import { MotionService } from '../../core/services/motion.service';
import { PreloadService } from '../../core/services/preload.service';

/**
 * Splits the host's text into characters that rise from behind a line mask with a stagger.
 * `trigger="load"` waits for the preloader to finish; `trigger="scroll"` plays on enter.
 */
@Directive({
  selector: '[appSplitText]',
})
export class SplitTextDirective {
  readonly trigger = input<'load' | 'scroll'>('scroll');
  readonly splitDelay = input(0);

  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly motion = inject(MotionService);
  private readonly preload = inject(PreloadService);
  private readonly injector = inject(Injector);

  constructor() {
    const destroyRef = inject(DestroyRef);
    let split: SplitText | null = null;
    let ctx: gsap.Context | null = null;
    let started = false;

    const play = () => {
      if (started) return;
      started = true;
      const host = this.el.nativeElement;
      const gsap = registerGsap();

      ctx = gsap.context(() => {
        split = SplitText.create(host, {
          type: 'lines,words,chars',
          mask: 'lines',
          linesClass: 'split-line',
          autoSplit: true,
          onSplit: (self) =>
            gsap.from(self.chars, {
              yPercent: 110,
              rotate: 4,
              duration: 1.1,
              ease: 'expo.out',
              stagger: 0.022,
              delay: this.splitDelay(),
              scrollTrigger:
                this.trigger() === 'scroll' ? { trigger: host, start: 'top 85%', once: true } : undefined,
            }),
        });
      }, host);
    };

    afterNextRender(() => {
      if (this.motion.reduced()) return;
      document.fonts.ready.then(() => {
        if (this.trigger() === 'scroll') {
          play();
          return;
        }
        effect(
          () => {
            if (this.preload.done()) play();
          },
          { injector: this.injector },
        );
      });
    });

    destroyRef.onDestroy(() => {
      split?.revert();
      ctx?.revert();
    });
  }
}
