export type PartId = 'barrel' | 'train' | 'escapement' | 'balance' | 'rotor';

export interface MovementPart {
  readonly id: PartId;
  readonly name: string;
  readonly short: string;
  readonly description: string;
  readonly statValue: string;
  readonly statLabel: string;
}

export const MOVEMENT_COPY = {
  eyebrow: 'Movement Explorer',
  title: 'The engine inside.',
  intro: 'Calibre K-03, built from 214 parts and beating 28,800 times an hour. Pull it apart, turn it around and tap a part to see what it does.',
  explodeLabel: 'Explode view',
  explodeHint: 'Separate the layers',
  partsLabel: 'Movement parts',
  resetView: 'Reset view',
  zoomIn: 'Zoom in',
  zoomOut: 'Zoom out',
  orbitLabel: 'Orbit',
  explodeValue: 'separation',
  selectHint: 'Select a part to learn what it does.',
  dragHint: 'Drag to orbit · + / − to zoom',
  canvasDescription:
    'A 3D model of the KALA Calibre K-03 movement. The mainspring barrel, gear train, escape wheel, balance wheel and rotor turn at their true relative speeds.',
  infoClose: 'Close part details',
  liveLabel: 'Live',
} as const;

export const MOVEMENT_PARTS: readonly MovementPart[] = [
  {
    id: 'barrel',
    name: 'Mainspring Barrel',
    short: 'Stores the energy',
    description:
      'A coiled spring inside this drum holds the energy. As it slowly unwinds, it pushes the rest of the watch forward, one tooth at a time.',
    statValue: '72 h',
    statLabel: 'power reserve',
  },
  {
    id: 'train',
    name: 'Gear Train',
    short: 'Carries the energy',
    description:
      'Four wheels step the energy down from the barrel. They also set the speed of each hand: the seconds wheel turns exactly once a minute.',
    statValue: '1 rpm',
    statLabel: 'seconds wheel',
  },
  {
    id: 'escapement',
    name: 'Escapement',
    short: 'Releases it in beats',
    description:
      'The escape wheel and pallet fork let the energy out in tiny, equal steps. This is the "tick" you hear when you hold the watch to your ear.',
    statValue: '8',
    statLabel: 'beats per second',
  },
  {
    id: 'balance',
    name: 'Balance Wheel',
    short: 'Keeps the time',
    description:
      'The heart of the watch. Its hairspring makes it swing back and forth four times a second. The steadier the swing, the more accurate the watch.',
    statValue: '4 Hz',
    statLabel: 'oscillation',
  },
  {
    id: 'rotor',
    name: 'Rotor',
    short: 'Winds it for you',
    description:
      'A weighted half-disc that spins as your wrist moves. It winds the mainspring on its own, so a watch worn every day never stops.',
    statValue: '22k',
    statLabel: 'gold weight',
  },
];
