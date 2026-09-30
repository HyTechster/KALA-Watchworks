export interface AnatomyTick {
  readonly index: number;
  readonly label: string;
  readonly detail: string;
}

export const ANATOMY_COPY = {
  eyebrow: 'Anatomy of a Second',
  title: 'One second, slowed down.',
  intro: 'Scroll to stretch a single second across the page. Inside it, the escapement ticks eight times.',
  counterLabel: 'Elapsed',
  secondDone: 'One second.',
  diagramDescription:
    'Diagram of a Swiss lever escapement: an escape wheel with fifteen teeth, a pallet fork and a balance wheel. As you scroll, the balance swings and the escape wheel advances half a tooth on each of eight ticks.',
  measureWheel: 'Ø 6.20',
  measureBalance: 'Ø 10.00',
  measureFork: '31°',
  measureBeat: '125 ms / beat',
  escapeWheel: 'Escape wheel',
  palletFork: 'Pallet fork',
  balanceWheel: 'Balance wheel',
} as const;

export const ANATOMY_TICKS: readonly AnatomyTick[] = [
  { index: 1, label: 'Unlock', detail: 'The balance swings through centre and knocks the fork free.' },
  { index: 2, label: 'Impulse', detail: 'An escape tooth slides across a jewel and pushes the balance on.' },
  { index: 3, label: 'Lock', detail: 'The next tooth lands on the opposite pallet stone. Click.' },
  { index: 4, label: 'Return', detail: 'The hairspring slows the balance, stops it and sends it back.' },
  { index: 5, label: 'Unlock', detail: 'Centre again. The fork flips the other way.' },
  { index: 6, label: 'Impulse', detail: 'A little energy from the mainspring tops up the swing.' },
  { index: 7, label: 'Lock', detail: 'Held. The wheel waits for the balance to come home.' },
  { index: 8, label: 'Advance', detail: 'Eight beats done. The seconds hand steps forward.' },
];
