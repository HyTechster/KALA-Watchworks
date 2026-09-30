import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideArrowRight, LucideCamera, LucideClapperboard, LucideMail, LucideRss } from '@lucide/angular';
import { registerGsap } from '../../core/gsap';
import { MotionService } from '../../core/services/motion.service';
import { ScrollService } from '../../core/services/scroll.service';
import { BRAND, FOOTER } from '../../data/site';
import { strictEmailValidator } from '../../shared/validators/kala-validators';

@Component({
  selector: 'app-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, LucideArrowRight, LucideCamera, LucideClapperboard, LucideMail, LucideRss],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  protected readonly copy = FOOTER;
  protected readonly brand = BRAND;
  protected readonly letters = Array.from(FOOTER.wordmark);

  private readonly scroll = inject(ScrollService);
  private readonly motion = inject(MotionService);
  private readonly wordmark = viewChild.required<ElementRef<HTMLElement>>('wordmark');
  private readonly hands = viewChild.required<ElementRef<SVGGElement>>('hands');

  protected readonly email = inject(NonNullableFormBuilder).control('', [Validators.required, strictEmailValidator()]);
  protected readonly submitted = signal(false);
  protected readonly attempted = signal(false);

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      if (this.motion.reduced()) return;
      const gsap = registerGsap();
      const wordmark = this.wordmark().nativeElement;
      const ctx = gsap.context(() => {
        gsap.from(wordmark.querySelectorAll('.letter'), {
          yPercent: 100,
          duration: 1.3,
          ease: 'expo.out',
          stagger: 0.09,
          scrollTrigger: { trigger: wordmark, start: 'top 95%', once: true },
        });
      }, wordmark);
      destroyRef.onDestroy(() => ctx.revert());
    });
  }

  protected emailError(): string | null {
    if (!this.attempted() && !this.email.touched) return null;
    if (this.email.hasError('required')) return this.attempted() ? this.copy.newsletterRequired : null;
    if (this.email.hasError('strictEmail')) return this.copy.newsletterInvalid;
    return null;
  }

  protected subscribe(): void {
    this.attempted.set(true);
    this.email.markAsTouched();
    if (this.email.invalid) return;
    this.submitted.set(true);
    this.email.reset();
    this.attempted.set(false);
  }

  /** Scrolls to the top while the little clock's hands rewind. */
  protected backToTop(): void {
    const duration = this.motion.reduced() ? 0 : 1.6;
    const hands = this.hands().nativeElement;
    if (duration > 0) {
      registerGsap().fromTo(
        hands.querySelectorAll('line'),
        { rotation: 0 },
        { rotation: (i: number) => (i === 0 ? -720 : -60), svgOrigin: '12 12', duration, ease: 'power3.inOut' },
      );
    }
    this.scroll.scrollTo(0, { duration, immediate: duration === 0 });
    document.getElementById('main')?.focus({ preventScroll: true });
  }
}
