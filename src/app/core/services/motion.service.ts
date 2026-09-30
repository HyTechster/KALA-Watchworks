import { isPlatformBrowser } from '@angular/common';
import { DestroyRef, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

/** Exposes user motion and pointer preferences as signals. */
@Injectable({ providedIn: 'root' })
export class MotionService {
  readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly reducedState = signal(false);
  private readonly finePointerState = signal(false);

  /** True when the user prefers reduced motion. */
  readonly reduced = this.reducedState.asReadonly();
  /** True on devices with a precise, hover-capable pointer (mouse, trackpad). */
  readonly finePointer = this.finePointerState.asReadonly();

  constructor() {
    if (!this.isBrowser) return;

    const destroyRef = inject(DestroyRef);
    const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const pointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');

    const sync = () => {
      this.reducedState.set(reducedQuery.matches);
      this.finePointerState.set(pointerQuery.matches);
    };
    sync();

    reducedQuery.addEventListener('change', sync);
    pointerQuery.addEventListener('change', sync);
    destroyRef.onDestroy(() => {
      reducedQuery.removeEventListener('change', sync);
      pointerQuery.removeEventListener('change', sync);
    });
  }
}
