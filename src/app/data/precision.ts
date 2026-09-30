export interface PrecisionStat {
  readonly id: string;
  readonly value: number;
  readonly decimals: number;
  readonly prefix: string;
  readonly suffix: string;
  readonly label: string;
}

export const PRECISION_COPY = {
  eyebrow: 'Precision in Numbers',
  title: 'Measured, not promised.',
  intro: 'Every watch leaves the bench with its own rate record. These are the numbers from a Series 03 regulation run.',
  accuracyTitle: 'Daily rate, 30 days',
  accuracyBody: 'Deviation in seconds per day. The shaded band is our ±2 s/day limit.',
  accuracyUnit: 's/day',
  accuracyBand: 'Certified band ±2 s/day',
  accuracyDayLabel: 'Day',
  reserveTitle: 'Power reserve',
  reserveBody: 'The needle drains in real time. Wind the mainspring to fill it again.',
  reserveUnit: 'h',
  reserveWind: 'Wind the mainspring',
  reserveWinding: 'Winding…',
  guideLabel: '±2 s/day · certified',
  chartDescription:
    'Line chart of daily accuracy over 30 days. Every value stays between minus 1.6 and plus 1.8 seconds per day, inside the ±2 second band.',
  gaugeDescription: 'Gauge showing the remaining power reserve in hours, out of 72.',
} as const;

// Seconds gained (+) or lost (−) per day across a 30-day regulation run.
export const DAILY_DEVIATION: readonly number[] = [
  0.8, 1.1, 0.6, 1.4, 0.9, 0.3, -0.2, 0.5, 1.2, 1.8, 1.3, 0.7, 0.1, -0.6, -1.1, -0.4, 0.2, 0.9, 1.5, 1.0, 0.4, -0.3,
  -0.9, -1.6, -1.2, -0.5, 0.3, 0.8, 1.1, 0.6,
];

export const PRECISION_STATS: readonly PrecisionStat[] = [
  { id: 'components', value: 214, decimals: 0, prefix: '', suffix: '', label: 'components' },
  { id: 'reserve', value: 72, decimals: 0, prefix: '', suffix: ' h', label: 'power reserve' },
  { id: 'beats', value: 28800, decimals: 0, prefix: '', suffix: '', label: 'beats per hour' },
  { id: 'accuracy', value: 2, decimals: 0, prefix: '±', suffix: ' s/day', label: 'accuracy' },
];

export const POWER_RESERVE = {
  max: 72,
  start: 64.5,
  // Hours drained per real second, so the needle visibly creeps.
  drainPerSecond: 0.012,
} as const;
