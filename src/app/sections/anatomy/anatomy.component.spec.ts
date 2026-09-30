import { countdownTo } from '../ticker/ticker.component';
import { escapementPose, tickTime, ticksAt } from './anatomy.component';

describe('Anatomy of a second', () => {
  it('fits exactly eight ticks inside one second', () => {
    expect(ticksAt(0)).toBe(0);
    expect(ticksAt(tickTime(1))).toBe(1);
    expect(ticksAt(0.999)).toBe(8);
  });

  it('advances the escape wheel half a tooth (12°) per tick', () => {
    const settled = (k: number) => escapementPose(tickTime(k) + 0.1).escape;
    expect(settled(1)).toBeCloseTo(12, 5);
    expect(settled(8)).toBeCloseTo(96, 5);
  });

  it('swings the balance through centre on every tick', () => {
    for (let k = 1; k <= 8; k++) {
      expect(escapementPose(tickTime(k)).balance).toBeCloseTo(0, 5);
    }
  });
});

describe('Release countdown', () => {
  it('counts down to the anchor date', () => {
    const now = new Date('2026-09-30T03:39:00+08:00');
    expect(countdownTo(now, '2026-10-14T10:00:00+08:00', 28)).toEqual({ days: 14, hours: 6, minutes: 21 });
  });

  it('rolls forward by whole cycles once the anchor has passed', () => {
    const now = new Date('2026-10-15T10:00:00+08:00');
    const left = countdownTo(now, '2026-10-14T10:00:00+08:00', 28);
    expect(left).toEqual({ days: 27, hours: 0, minutes: 0 });
  });
});
