import { TestBed } from '@angular/core/testing';
import { COLLECTION } from '../../data/collection';
import {
  calculatePrice,
  ConfiguratorStore,
  defaultStrapFor,
  ENGRAVING_STEP,
  formatSerial,
  priceBreakdown,
  sanitizeEngraving,
  WatchConfiguration,
} from './configurator.store';

const base: WatchConfiguration = {
  model: 'dress',
  caseMaterial: 'steel',
  dial: 'teal',
  strap: 'leather',
  engraving: '',
};

describe('calculatePrice', () => {
  it('prices the base dress configuration at its model price', () => {
    expect(calculatePrice(base)).toBe(6400);
  });

  it('adds the case, dial and strap surcharges', () => {
    // 8,900 chronograph + 6,800 rose gold + 1,900 meteorite + 950 bracelet
    expect(
      calculatePrice({ ...base, model: 'chronograph', caseMaterial: 'rose-gold', dial: 'meteorite', strap: 'bracelet' }),
    ).toBe(18550);
  });

  it('charges for engraving only when there is visible text', () => {
    expect(calculatePrice({ ...base, engraving: 'For every second' })).toBe(6550);
    expect(calculatePrice({ ...base, engraving: '   ' })).toBe(6400);
  });

  it('matches the listed price of every collection watch', () => {
    for (const watch of COLLECTION) {
      const price = calculatePrice({
        model: watch.category,
        caseMaterial: watch.caseMaterial,
        dial: watch.dial,
        strap: watch.strap,
        engraving: '',
      });
      expect(price, watch.name).toBe(watch.price);
    }
  });

  it('itemises each line in the breakdown', () => {
    const lines = priceBreakdown({ ...base, caseMaterial: 'titanium', engraving: 'A' });
    expect(lines.map((l) => l.amount)).toEqual([6400, 1200, 0, 0, 150]);
  });
});

describe('sanitizeEngraving and formatSerial', () => {
  it('strips control characters, collapses spaces and caps at 20 characters', () => {
    expect(sanitizeEngraving('Hello\u0007   world')).toBe('Hello world');
    expect(sanitizeEngraving('x'.repeat(30))).toHaveLength(20);
  });

  it('formats a zero-padded limited-edition serial', () => {
    expect(formatSerial(77, 88)).toBe('KALA-03-077/088');
    expect(formatSerial(5, 25, 4)).toBe('KALA-04-005/025');
  });

  it('maps each model to its default strap', () => {
    expect(defaultStrapFor('dress')).toBe('leather');
    expect(defaultStrapFor('diver')).toBe('rubber');
    expect(defaultStrapFor('chronograph')).toBe('bracelet');
  });
});

describe('ConfiguratorStore', () => {
  let store: ConfiguratorStore;

  beforeEach(() => {
    store = TestBed.inject(ConfiguratorStore);
  });

  afterEach(() => TestBed.resetTestingModule());

  it('recomputes the price when a signal changes', () => {
    expect(store.price()).toBe(6400);
    store.caseMaterial.set('titanium');
    expect(store.price()).toBe(7600);
    store.setEngraving('Hari Raya 2026');
    expect(store.price()).toBe(7750);
  });

  it('resets the strap to the new model default (linkedSignal) but keeps manual overrides until then', () => {
    store.strap.set('bracelet');
    expect(store.strap()).toBe('bracelet');
    store.model.set('diver');
    expect(store.strap()).toBe('rubber');
    expect(store.price()).toBe(7200 + 180);
  });

  it('preselects a collection watch including its non-default strap', () => {
    const bulan = COLLECTION.find((w) => w.id === 'bulan');
    expect(bulan).toBeDefined();
    store.preselect(bulan!);
    expect(store.model()).toBe('chronograph');
    expect(store.strap()).toBe('leather');
    expect(store.price()).toBe(bulan!.price);
  });

  it('turns the preview to the caseback on the engraving step', () => {
    expect(store.showCaseback()).toBe(false);
    store.step.set(ENGRAVING_STEP);
    expect(store.showCaseback()).toBe(true);
  });

  it('issues the next piece serial and counts winding requests', () => {
    expect(store.serial()).toBe('KALA-03-077/088');
    store.wind();
    store.wind();
    expect(store.windCount()).toBe(2);
  });
});
