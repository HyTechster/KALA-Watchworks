export type CraftIllustration = 'design' | 'machining' | 'finishing' | 'assembly' | 'regulation';

export interface CraftPanel {
  readonly id: CraftIllustration;
  readonly index: string;
  readonly title: string;
  readonly kicker: string;
  readonly body: string;
  readonly statValue: string;
  readonly statLabel: string;
}

export const CRAFT_COPY = {
  eyebrow: 'The Craft',
  title: 'Five stages. No shortcuts.',
  intro: 'A KALA takes about 160 hours at the bench. Scroll through the five stages every watch passes through.',
  railLabel: 'Craft progress',
} as const;

export const CRAFT_PANELS: readonly CraftPanel[] = [
  {
    id: 'design',
    index: '01',
    title: 'Design',
    kicker: 'Pencil before metal',
    body: 'Every case starts as a drawing at 5:1 scale. Lug curves are checked on real wrists before any metal is cut.',
    statValue: '0.01 mm',
    statLabel: 'drawing tolerance',
  },
  {
    id: 'machining',
    index: '02',
    title: 'Machining',
    kicker: 'Cut from solid bar',
    body: 'Cases, plates and bridges are milled from solid bar stock. Each gear is cut and then checked under a 20× loupe.',
    statValue: '38 h',
    statLabel: 'of machining per watch',
  },
  {
    id: 'finishing',
    index: '03',
    title: 'Finishing',
    kicker: 'Light is the judge',
    body: 'Bevels are polished by hand with wooden pegs and diamond paste. Côtes de Genève stripes are brushed onto every bridge.',
    statValue: '140',
    statLabel: 'hand-polished bevels',
  },
  {
    id: 'assembly',
    index: '04',
    title: 'Assembly',
    kicker: '214 parts, one bench',
    body: 'One watchmaker puts all 214 parts together with tweezers and a steady breath. Nothing is handed down a line.',
    statValue: '214',
    statLabel: 'components',
  },
  {
    id: 'regulation',
    index: '05',
    title: 'Regulation',
    kicker: 'Six positions, eleven days',
    body: 'The finished watch is timed in six positions and three temperatures for eleven days. Only then is it signed.',
    statValue: '±2 s',
    statLabel: 'per day, certified',
  },
];

/** Technical labels drawn inside the craft illustrations. */
export const CRAFT_LABELS = {
  diameter: 'Ø 38.0',
  lugToLug: '47.5',
  thickness: '9.8',
  scale: 'SCALE 5:1',
  drawingNo: 'DWG K-303 / REV C',
  toolpath: 'T04 · 0.2 mm',
  rpm: '8 000 rpm',
  rate: '+1.2 s/d',
  amplitude: '285°',
  beatError: '0.1 ms',
  positions: 'DU · DD · 3H · 6H · 9H · 12H',
} as const;
