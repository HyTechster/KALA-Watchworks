import { computed, inject, Injectable, signal } from '@angular/core';
import { MotionService } from './motion.service';

export type CursorVariant = 'default' | 'interactive' | 'drag' | 'text' | 'hidden';

/**
 * State for the custom cursor. Elements opt into a variant with
 * `data-cursor="drag"` and an optional `data-cursor-label`.
 */
@Injectable({ providedIn: 'root' })
export class CursorService {
  private readonly motion = inject(MotionService);

  private readonly variantState = signal<CursorVariant>('default');
  private readonly labelState = signal('');

  readonly variant = this.variantState.asReadonly();
  readonly label = this.labelState.asReadonly();
  /** The custom cursor only runs on fine pointers; touch devices keep their native behaviour. */
  readonly enabled = computed(() => this.motion.finePointer());

  set(variant: CursorVariant, label = ''): void {
    if (variant !== this.variantState()) this.variantState.set(variant);
    if (label !== this.labelState()) this.labelState.set(label);
  }

  reset(): void {
    this.set('default');
  }
}
