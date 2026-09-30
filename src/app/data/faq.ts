export interface FaqItem {
  readonly id: string;
  readonly question: string;
  readonly answer: string;
}

export const FAQ_COPY = {
  eyebrow: 'Questions',
  title: 'Care, winding and the long run.',
  intro: 'A mechanical watch is meant to outlive its first owner. Here is how we help it do that.',
} as const;

export const FAQ_ITEMS: readonly FaqItem[] = [
  {
    id: 'servicing',
    question: 'How often does a KALA need servicing?',
    answer:
      'We recommend a full service every five to seven years. The watch is taken apart, cleaned, re-oiled, regulated and tested again for eleven days. Servicing is done at our bench by the watchmaker who assembled it.',
  },
  {
    id: 'water',
    question: 'Can I swim with my watch?',
    answer:
      'Divers are rated to 300 m or 500 m and are made for swimming and diving. Dress models are rated to 30 m or 50 m: rain and hand-washing are fine, swimming is not. Never operate the crown under water, and have the seals checked every two years.',
  },
  {
    id: 'warranty',
    question: 'What does the warranty cover?',
    answer:
      'Every KALA has a five-year warranty covering the movement and any manufacturing faults. It stays with the watch, not the owner, so it transfers if the watch is passed on.',
  },
  {
    id: 'winding',
    question: 'How do I wind it?',
    answer:
      'Unscrew the crown, then turn it clockwise about 40 times for a full 72-hour reserve. Automatic models also wind themselves while you wear them. You will feel a soft stop on manual models: that is the mainspring saying it is full.',
  },
  {
    id: 'accuracy',
    question: 'How accurate is a mechanical watch?',
    answer:
      'Each KALA is regulated to within ±2 seconds per day across six positions, then certified. A quartz watch is more accurate, but it cannot be repaired a century from now. A KALA can.',
  },
  {
    id: 'reservation',
    question: 'How does a Series 03 reservation work?',
    answer:
      'Register your interest in the configurator. We confirm availability by letter within two days. Nothing is charged until your piece has passed regulation and is ready to be signed.',
  },
];
