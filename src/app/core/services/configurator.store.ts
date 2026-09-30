import { computed, Injectable, linkedSignal, signal } from '@angular/core';
import { CollectionWatch } from '../../data/collection';
import {
  CASE_OPTIONS,
  CaseId,
  DIAL_OPTIONS,
  DialId,
  ENGRAVING,
  MODEL_OPTIONS,
  ModelId,
  STRAP_OPTIONS,
  StrapId,
} from '../../data/configurator-options';
import { TICKER } from '../../data/site';

export interface WatchConfiguration {
  readonly model: ModelId;
  readonly caseMaterial: CaseId;
  readonly dial: DialId;
  readonly strap: StrapId;
  readonly engraving: string;
}

export interface PriceLine {
  readonly label: string;
  readonly amount: number;
}

/** Index of the engraving step in the stepper. */
export const ENGRAVING_STEP = 4;

const byId = <T extends { id: string }>(list: readonly T[], id: string): T => {
  const found = list.find((item) => item.id === id);
  if (!found) throw new Error(`Unknown option: ${id}`);
  return found;
};

/** Removes control characters, collapses whitespace and caps the engraving at 20 characters. */
export function sanitizeEngraving(text: string): string {
  return text
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/\s+/g, ' ')
    .slice(0, ENGRAVING.maxLength);
}

/** Itemised price for a configuration. The engraving is charged only when non-blank. */
export function priceBreakdown(config: WatchConfiguration): PriceLine[] {
  const model = byId(MODEL_OPTIONS, config.model);
  const caseOption = byId(CASE_OPTIONS, config.caseMaterial);
  const dial = byId(DIAL_OPTIONS, config.dial);
  const strap = byId(STRAP_OPTIONS, config.strap);
  const lines: PriceLine[] = [
    { label: `${model.name} base`, amount: model.basePrice },
    { label: `${caseOption.name} case`, amount: caseOption.price },
    { label: `${dial.name} dial`, amount: dial.price },
    { label: strap.name, amount: strap.price },
  ];
  if (config.engraving.trim().length > 0) {
    lines.push({ label: 'Engraving', amount: ENGRAVING.price });
  }
  return lines;
}

export function calculatePrice(config: WatchConfiguration): number {
  return priceBreakdown(config).reduce((sum, line) => sum + line.amount, 0);
}

/** Formats a piece number as a limited-edition serial, e.g. KALA-03-077/088. */
export function formatSerial(piece: number, total: number, series = 3): string {
  const pad = (n: number, width: number) => String(n).padStart(width, '0');
  return `KALA-${pad(series, 2)}-${pad(piece, 3)}/${pad(total, 3)}`;
}

export function defaultStrapFor(model: ModelId): StrapId {
  return byId(MODEL_OPTIONS, model).defaultStrap;
}

/** Signal-based configurator state, shared by the stepper and the live 3D preview. */
@Injectable({ providedIn: 'root' })
export class ConfiguratorStore {
  readonly model = signal<ModelId>('dress');
  readonly caseMaterial = signal<CaseId>('steel');
  readonly dial = signal<DialId>('teal');
  /** Follows the model's default strap until the user picks another one. */
  readonly strap = linkedSignal<ModelId, StrapId>({
    source: this.model,
    computation: (model) => defaultStrapFor(model),
  });
  readonly engraving = signal('');
  readonly step = signal(0);
  /** The preview turns to its caseback while the engraving step is open. */
  readonly showCaseback = computed(() => this.step() === ENGRAVING_STEP);
  /** Increments each time a successful registration should play the winding animation. */
  readonly windCount = signal(0);

  readonly configuration = computed<WatchConfiguration>(() => ({
    model: this.model(),
    caseMaterial: this.caseMaterial(),
    dial: this.dial(),
    strap: this.strap(),
    engraving: this.engraving(),
  }));

  readonly breakdown = computed(() => priceBreakdown(this.configuration()));
  readonly price = computed(() => calculatePrice(this.configuration()));
  readonly serial = computed(() => formatSerial(TICKER.reserved + 1, TICKER.total));

  readonly modelOption = computed(() => byId(MODEL_OPTIONS, this.model()));
  readonly caseOption = computed(() => byId(CASE_OPTIONS, this.caseMaterial()));
  readonly dialOption = computed(() => byId(DIAL_OPTIONS, this.dial()));
  readonly strapOption = computed(() => byId(STRAP_OPTIONS, this.strap()));

  setEngraving(text: string): void {
    this.engraving.set(sanitizeEngraving(text));
  }

  /** Preselects a collection watch. The model is set first so the linked strap can be overridden. */
  preselect(watch: CollectionWatch): void {
    this.model.set(watch.category);
    this.caseMaterial.set(watch.caseMaterial);
    this.dial.set(watch.dial);
    this.strap.set(watch.strap);
    this.step.set(0);
  }

  wind(): void {
    this.windCount.update((n) => n + 1);
  }
}
