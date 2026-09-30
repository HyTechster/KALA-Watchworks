// Configurator catalogue: models, finishes, dials, straps and pricing.

export type ModelId = 'dress' | 'diver' | 'chronograph';
export type CaseId = 'steel' | 'titanium' | 'rose-gold';
export type DialId = 'black' | 'teal' | 'salmon' | 'meteorite';
export type StrapId = 'leather' | 'rubber' | 'bracelet';
export type StrapSize = 'S' | 'M' | 'L';

export interface ModelOption {
  readonly id: ModelId;
  readonly name: string;
  readonly description: string;
  readonly basePrice: number;
  readonly caseSize: string;
  readonly defaultStrap: StrapId;
}

export interface CaseOption {
  readonly id: CaseId;
  readonly name: string;
  readonly description: string;
  readonly price: number;
}

export interface DialOption {
  readonly id: DialId;
  readonly name: string;
  readonly description: string;
  readonly price: number;
  readonly hex: string;
}

export interface StrapOption {
  readonly id: StrapId;
  readonly name: string;
  readonly description: string;
  readonly price: number;
}

export interface StrapSizeOption {
  readonly id: StrapSize;
  readonly label: string;
}

export const MODEL_OPTIONS: readonly ModelOption[] = [
  {
    id: 'dress',
    name: 'Dress',
    description: 'Slim 38 mm case, polished bezel, manual winding. Made for cuffs.',
    basePrice: 6400,
    caseSize: '38 mm',
    defaultStrap: 'leather',
  },
  {
    id: 'diver',
    name: 'Diver',
    description: '41 mm case, 120-click bezel, 300 m water resistance.',
    basePrice: 7200,
    caseSize: '41 mm',
    defaultStrap: 'rubber',
  },
  {
    id: 'chronograph',
    name: 'Chronograph',
    description: '40 mm case, column-wheel chronograph, two sub-dials.',
    basePrice: 8900,
    caseSize: '40 mm',
    defaultStrap: 'bracelet',
  },
];

export const CASE_OPTIONS: readonly CaseOption[] = [
  { id: 'steel', name: 'Steel', description: '904L steel, brushed flanks and polished bevels.', price: 0 },
  { id: 'titanium', name: 'Titanium', description: 'Grade 5 titanium. 40% lighter, warm grey.', price: 1200 },
  { id: 'rose-gold', name: 'Rose Gold', description: '18k rose gold, hand-polished for two days.', price: 6800 },
];

export const DIAL_OPTIONS: readonly DialOption[] = [
  { id: 'black', name: 'Black', description: 'Deep lacquer, twelve coats.', price: 0, hex: '#0f1012' },
  { id: 'teal', name: 'Teal', description: 'Series 03 signature sunburst.', price: 0, hex: '#1f5c58' },
  { id: 'salmon', name: 'Salmon', description: 'Warm copper-pink sunburst.', price: 350, hex: '#d69a80' },
  { id: 'meteorite', name: 'Meteorite grey', description: 'Sliced Gibeon meteorite.', price: 1900, hex: '#6d7074' },
];

export const STRAP_OPTIONS: readonly StrapOption[] = [
  { id: 'leather', name: 'Leather', description: 'Hand-stitched calf, tobacco brown.', price: 0 },
  { id: 'rubber', name: 'Rubber', description: 'Vulcanised FKM, ridged for grip.', price: 180 },
  { id: 'bracelet', name: 'Steel bracelet', description: 'Three-link, matched to the case.', price: 950 },
];

export const STRAP_SIZE_OPTIONS: readonly StrapSizeOption[] = [
  { id: 'S', label: 'Small · 150–170 mm wrist' },
  { id: 'M', label: 'Medium · 170–190 mm wrist' },
  { id: 'L', label: 'Large · 190–210 mm wrist' },
];

export const ENGRAVING = {
  maxLength: 20,
  price: 150,
  placeholder: 'e.g. For every second',
  hint: 'Hand-engraved on the caseback ring.',
} as const;

export const CONFIGURATOR_COPY = {
  eyebrow: 'Configurator',
  title: 'Make it yours.',
  intro: 'Choose a case, a dial and a strap. The watch is built live as you decide, and your engraving appears on its caseback.',
  steps: {
    model: 'Model',
    case: 'Case',
    dial: 'Dial',
    strap: 'Strap',
    engraving: 'Engraving',
    summary: 'Summary',
  },
  next: 'Continue',
  back: 'Back',
  priceLabel: 'Your price',
  priceNote: 'Including VAT and a 5-year warranty',
  summaryLabel: 'Current configuration',
  caseGroupLabel: 'Case material',
  modelGroupLabel: 'Watch model',
  dialGroupLabel: 'Dial colour',
  strapGroupLabel: 'Strap',
  engravingLabel: 'Caseback engraving',
  engravingCounterLabel: 'characters used',
  certificateTitle: 'Certificate of configuration',
  certificateSerial: 'Serial',
  certificateModel: 'Model',
  certificateCase: 'Case',
  certificateDial: 'Dial',
  certificateStrap: 'Strap',
  certificateEngraving: 'Engraving',
  certificateNoEngraving: 'None',
  certificateSigned: 'Assembled and regulated by hand in Kuala Lumpur',
  formTitle: 'Register interest',
  formBody: 'Reserve this configuration. We will write to you before Series 03 opens. No payment is taken now.',
  nameLabel: 'Full name',
  emailLabel: 'Email',
  strapSizeLabel: 'Preferred strap size',
  strapSizePlaceholder: 'Select a size',
  submit: 'Register interest',
  submitting: 'Winding…',
  successTitle: 'Your watch is wound.',
  successBody: 'We have noted your configuration. Expect a letter from the bench within two days.',
  snackbar: 'Interest registered for',
  snackbarAction: 'Close',
  errors: {
    nameRequired: 'Please tell us your name.',
    nameInvalid: 'Use letters, spaces, hyphens or apostrophes (2–60 characters).',
    emailRequired: 'Please enter your email address.',
    emailInvalid: 'That email address does not look complete.',
    strapRequired: 'Please choose a strap size.',
  },
  previewDescription:
    'A live 3D preview of your configured watch. It turns to show the caseback while you type an engraving.',
  dragHint: 'Drag to turn',
} as const;

export const CURRENCY = { code: 'USD', symbol: '$' } as const;
