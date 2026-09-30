import { computed, Injectable, signal } from '@angular/core';

/** Tasks the preloader waits for before revealing the page. */
export type PreloadTask = 'fonts' | 'scene';

const REQUIRED_TASKS: readonly PreloadTask[] = ['fonts', 'scene'];

/**
 * Tracks real asset loading (web fonts and the first rendered frame of the hero scene).
 * The preloader's crown-winding ring reads `progress`.
 */
@Injectable({ providedIn: 'root' })
export class PreloadService {
  private readonly tasks = signal<Record<PreloadTask, number>>({ fonts: 0, scene: 0 });
  private readonly doneState = signal(false);

  /** 0 → 1, the mean of every required task. */
  readonly progress = computed(() => {
    const t = this.tasks();
    return REQUIRED_TASKS.reduce((sum, key) => sum + t[key], 0) / REQUIRED_TASKS.length;
  });

  /** True when every required task has completed. */
  readonly loaded = computed(() => this.progress() >= 1);

  /** True once the preloader has finished its exit. Entrance animations wait for this. */
  readonly done = this.doneState.asReadonly();

  report(task: PreloadTask, value: number): void {
    const clamped = Math.min(1, Math.max(0, value));
    this.tasks.update((t) => (clamped > t[task] ? { ...t, [task]: clamped } : t));
  }

  complete(task: PreloadTask): void {
    this.report(task, 1);
  }

  /** Forces every task to complete, used as a safety net and for reduced motion. */
  completeAll(): void {
    this.tasks.set({ fonts: 1, scene: 1 });
  }

  markDone(): void {
    this.doneState.set(true);
  }
}
