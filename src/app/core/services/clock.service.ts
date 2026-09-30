import { isPlatformBrowser } from '@angular/common';
import { computed, DestroyRef, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

/** Hand rotations in degrees, measured clockwise from 12 o'clock. */
export interface HandAngles {
  readonly hours: number;
  readonly minutes: number;
  readonly seconds: number;
}

/**
 * Classic wrapped angles (0–360) for a given moment. The second hand ticks in whole
 * seconds; the minute and hour hands creep continuously like a real movement.
 */
export function computeHandAngles(date: Date): HandAngles {
  const seconds = date.getSeconds();
  const minutes = date.getMinutes() + seconds / 60;
  const hours = (date.getHours() % 12) + minutes / 60;
  return {
    hours: hours * 30,
    minutes: minutes * 6,
    seconds: seconds * 6,
  };
}

/**
 * Monotonic angles that keep increasing through the day, so an animated hand never
 * sweeps backwards when it passes 12 o'clock (for example 354° → 360° instead of → 0°).
 */
export function computeContinuousAngles(date: Date): HandAngles {
  const total = secondsSinceMidnight(date);
  return {
    hours: total / 120,
    minutes: total / 10,
    seconds: total * 6,
  };
}

/** Whole seconds elapsed since local midnight. */
export function secondsSinceMidnight(date: Date): number {
  return date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
}

/** Formats a date as a 24-hour HH:MM:SS (or HH:MM) string. */
export function formatClock(date: Date, withSeconds = true): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const base = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  return withSeconds ? `${base}:${pad(date.getSeconds())}` : base;
}

/**
 * Shared clock. `now` ticks once per second on the client, aligned to the real second
 * boundary. Every clock face on the site (3D and SVG) reads from it.
 */
@Injectable({ providedIn: 'root' })
export class ClockService {
  private readonly nowState = signal(new Date());

  readonly now = this.nowState.asReadonly();
  readonly angles = computed(() => computeHandAngles(this.nowState()));
  readonly continuousAngles = computed(() => computeContinuousAngles(this.nowState()));
  readonly time = computed(() => formatClock(this.nowState()));
  readonly shortTime = computed(() => formatClock(this.nowState(), false));

  constructor() {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return;

    let timeout: ReturnType<typeof setTimeout> | undefined;
    const tick = () => {
      const now = new Date();
      this.nowState.set(now);
      // Re-align to the next whole second each tick so drift never accumulates.
      timeout = setTimeout(tick, 1000 - now.getMilliseconds() + 4);
    };
    tick();

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        clearTimeout(timeout);
        tick();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    inject(DestroyRef).onDestroy(() => {
      clearTimeout(timeout);
      document.removeEventListener('visibilitychange', onVisibility);
    });
  }
}
