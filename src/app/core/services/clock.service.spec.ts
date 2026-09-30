import { TestBed } from '@angular/core/testing';
import {
  ClockService,
  computeContinuousAngles,
  computeHandAngles,
  formatClock,
  secondsSinceMidnight,
} from './clock.service';

const at = (h: number, m: number, s: number) => new Date(2026, 8, 30, h, m, s);

describe('computeHandAngles', () => {
  it('points every hand at 12 at midnight and noon', () => {
    expect(computeHandAngles(at(0, 0, 0))).toEqual({ hours: 0, minutes: 0, seconds: 0 });
    expect(computeHandAngles(at(12, 0, 0))).toEqual({ hours: 0, minutes: 0, seconds: 0 });
  });

  it('puts the hour hand at 90° at 3:00', () => {
    expect(computeHandAngles(at(3, 0, 0)).hours).toBe(90);
    expect(computeHandAngles(at(15, 0, 0)).hours).toBe(90);
  });

  it('moves the hour hand halfway between indices at half past', () => {
    // 4:30 → 4.5 h × 30° = 135°
    expect(computeHandAngles(at(4, 30, 0)).hours).toBeCloseTo(135, 10);
  });

  it('lets the minute hand creep with the seconds', () => {
    // 10 min 30 s → 10.5 × 6° = 63°
    expect(computeHandAngles(at(9, 10, 30)).minutes).toBeCloseTo(63, 10);
  });

  it('ticks the second hand in whole 6° steps', () => {
    expect(computeHandAngles(at(1, 2, 45)).seconds).toBe(270);
    expect(computeHandAngles(at(1, 2, 59)).seconds).toBe(354);
  });

  it('keeps all angles inside 0–360', () => {
    const { hours, minutes, seconds } = computeHandAngles(at(23, 59, 59));
    for (const angle of [hours, minutes, seconds]) {
      expect(angle).toBeGreaterThanOrEqual(0);
      expect(angle).toBeLessThan(360);
    }
  });
});

describe('computeContinuousAngles', () => {
  it('never wraps backwards when a hand passes 12', () => {
    const before = computeContinuousAngles(at(10, 14, 59));
    const after = computeContinuousAngles(at(10, 15, 0));
    expect(after.seconds).toBeGreaterThan(before.seconds);
    expect(after.seconds - before.seconds).toBe(6);
  });

  it('matches the wrapped angles modulo 360', () => {
    const date = at(17, 42, 13);
    const wrapped = computeHandAngles(date);
    const continuous = computeContinuousAngles(date);
    expect(continuous.seconds % 360).toBeCloseTo(wrapped.seconds, 10);
    expect(continuous.minutes % 360).toBeCloseTo(wrapped.minutes, 10);
    expect(continuous.hours % 360).toBeCloseTo(wrapped.hours, 10);
  });
});

describe('secondsSinceMidnight and formatClock', () => {
  it('counts whole seconds from local midnight', () => {
    expect(secondsSinceMidnight(at(0, 0, 0))).toBe(0);
    expect(secondsSinceMidnight(at(1, 1, 1))).toBe(3661);
  });

  it('formats a padded 24-hour time', () => {
    expect(formatClock(at(7, 5, 9))).toBe('07:05:09');
    expect(formatClock(at(14, 32, 7), false)).toBe('14:32');
  });
});

describe('ClockService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(at(14, 32, 7));
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
  });

  it('exposes the current time as signals', () => {
    const clock = TestBed.inject(ClockService);
    expect(clock.time()).toBe('14:32:07');
    expect(clock.angles().seconds).toBe(42);
  });

  it('ticks once per second on the client', () => {
    const clock = TestBed.inject(ClockService);
    // Each tick is scheduled a few ms past the next whole second.
    vi.advanceTimersByTime(1010);
    expect(clock.time()).toBe('14:32:08');
    vi.advanceTimersByTime(2000);
    expect(clock.time()).toBe('14:32:10');
  });
});
