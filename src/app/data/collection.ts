import { CaseId, DialId, ModelId, StrapId } from './configurator-options';

export type CollectionFilter = 'all' | 'dress' | 'diver' | 'chronograph' | 'limited';

/** Studio renders of each watch, shot in Blender: dial (without hands), caseback, profile. */
export type RenderView = 'front' | 'back' | 'side';
export const RENDER_VIEWS: readonly RenderView[] = ['front', 'back', 'side'];

export function renderUrl(watchId: string, view: RenderView): string {
  return `renders/${watchId}-${view}.webp`;
}

export interface CollectionWatch {
  readonly id: string;
  readonly name: string;
  readonly reference: string;
  readonly category: ModelId;
  readonly limited: boolean;
  readonly edition?: string;
  readonly tagline: string;
  readonly story: string;
  readonly price: number;
  readonly caseSize: string;
  readonly thickness: string;
  readonly waterResistance: string;
  readonly movement: string;
  readonly powerReserve: string;
  readonly caseMaterial: CaseId;
  readonly dial: DialId;
  readonly strap: StrapId;
}

export const COLLECTION_COPY = {
  eyebrow: 'The Collection',
  title: 'Eight watches. One pair of hands.',
  intro: 'Every reference shares the same in-house calibre and the same obsession. Filter by character, then open a piece to see it from every side.',
  filterLabel: 'Filter the collection',
  from: 'From',
  open: 'View details',
  configure: 'Configure this watch',
  close: 'Close',
  specsTitle: 'Specifications',
  galleryLabel: 'Watch gallery',
  prevView: 'Previous view',
  nextView: 'Next view',
  dragLabel: 'Drag',
  specCase: 'Case size',
  specThickness: 'Thickness',
  specWater: 'Water resistance',
  specMovement: 'Movement',
  specReserve: 'Power reserve',
  specMaterial: 'Case material',
  galleryViews: ['Dial', 'Caseback', 'Profile'] as readonly string[],
  galleryAlts: [
    'dial, with the hands showing your local time',
    'exhibition caseback with the movement on view',
    'three-quarter profile of the case and crown',
  ] as readonly string[],
  limitedBadge: 'Limited',
  empty: 'No watches match this filter yet.',
} as const;

export const COLLECTION_FILTERS: readonly { readonly id: CollectionFilter; readonly label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'dress', label: 'Dress' },
  { id: 'diver', label: 'Diver' },
  { id: 'chronograph', label: 'Chronograph' },
  { id: 'limited', label: 'Limited' },
];

export const COLLECTION: readonly CollectionWatch[] = [
  {
    id: 'kala-tiga',
    name: 'Kala Tiga',
    reference: 'K-303',
    category: 'dress',
    limited: true,
    edition: 'Series 03 · 88 pieces',
    tagline: 'The Series 03 signature.',
    story: 'A teal sunburst dial under a domed sapphire, with applied indices cut from solid steel. "Tiga" means three.',
    price: 6400,
    caseSize: '38 mm',
    thickness: '9.8 mm',
    waterResistance: '50 m',
    movement: 'Calibre K-03, automatic',
    powerReserve: '72 h',
    caseMaterial: 'steel',
    dial: 'teal',
    strap: 'leather',
  },
  {
    id: 'satu',
    name: 'Satu',
    reference: 'K-101',
    category: 'dress',
    limited: false,
    tagline: 'The first KALA. Still the purest.',
    story: 'Black lacquer, a slim case and nothing extra. "Satu" means one: the first watch from the bench.',
    price: 6400,
    caseSize: '38 mm',
    thickness: '9.2 mm',
    waterResistance: '30 m',
    movement: 'Calibre K-01, manual winding',
    powerReserve: '72 h',
    caseMaterial: 'steel',
    dial: 'black',
    strap: 'leather',
  },
  {
    id: 'laut',
    name: 'Laut',
    reference: 'K-210',
    category: 'diver',
    limited: false,
    tagline: 'A diver for warm, deep water.',
    story: 'Titanium case, teal dial and a ceramic bezel with lume at every minute. "Laut" means sea.',
    price: 8580,
    caseSize: '41 mm',
    thickness: '12.4 mm',
    waterResistance: '300 m',
    movement: 'Calibre K-03, automatic',
    powerReserve: '72 h',
    caseMaterial: 'titanium',
    dial: 'teal',
    strap: 'rubber',
  },
  {
    id: 'senja',
    name: 'Senja',
    reference: 'K-120',
    category: 'dress',
    limited: false,
    tagline: 'Rose gold for the last light.',
    story: 'A salmon sunburst in a rose-gold case, polished by hand over two full days. "Senja" means dusk.',
    price: 13550,
    caseSize: '38 mm',
    thickness: '9.4 mm',
    waterResistance: '30 m',
    movement: 'Calibre K-01, manual winding',
    powerReserve: '72 h',
    caseMaterial: 'rose-gold',
    dial: 'salmon',
    strap: 'leather',
  },
  {
    id: 'detik',
    name: 'Detik',
    reference: 'K-340',
    category: 'chronograph',
    limited: false,
    tagline: 'Measures seconds. Respects them.',
    story: 'A column-wheel chronograph with a meteorite dial and a steel bracelet. "Detik" means second.',
    price: 11750,
    caseSize: '40 mm',
    thickness: '13.1 mm',
    waterResistance: '100 m',
    movement: 'Calibre K-05, automatic chronograph',
    powerReserve: '60 h',
    caseMaterial: 'steel',
    dial: 'meteorite',
    strap: 'bracelet',
  },
  {
    id: 'dalam',
    name: 'Dalam',
    reference: 'K-250',
    category: 'diver',
    limited: true,
    edition: '50 pieces',
    tagline: 'Built for the dark below.',
    story: 'A black dial and a steel bracelet, tested to 500 m in our own pressure tank. "Dalam" means deep.',
    price: 8150,
    caseSize: '42 mm',
    thickness: '13.6 mm',
    waterResistance: '500 m',
    movement: 'Calibre K-03, automatic',
    powerReserve: '72 h',
    caseMaterial: 'steel',
    dial: 'black',
    strap: 'bracelet',
  },
  {
    id: 'pantas',
    name: 'Pantas',
    reference: 'K-360',
    category: 'chronograph',
    limited: false,
    tagline: 'A light chronograph for quick hands.',
    story: 'Titanium, a black dial and a ridged rubber strap. It weighs less than a set of keys. "Pantas" means swift.',
    price: 10280,
    caseSize: '40 mm',
    thickness: '12.8 mm',
    waterResistance: '100 m',
    movement: 'Calibre K-05, automatic chronograph',
    powerReserve: '60 h',
    caseMaterial: 'titanium',
    dial: 'black',
    strap: 'rubber',
  },
  {
    id: 'bulan',
    name: 'Bulan',
    reference: 'K-388',
    category: 'chronograph',
    limited: true,
    edition: '25 pieces',
    tagline: 'Rose gold and a slice of a fallen star.',
    story: 'A meteorite dial in a rose-gold chronograph case. Each dial pattern is unique. "Bulan" means moon.',
    price: 17600,
    caseSize: '40 mm',
    thickness: '13.1 mm',
    waterResistance: '50 m',
    movement: 'Calibre K-05, automatic chronograph',
    powerReserve: '60 h',
    caseMaterial: 'rose-gold',
    dial: 'meteorite',
    strap: 'leather',
  },
];
