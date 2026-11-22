import { describe, expect, it } from 'vitest';
import {
  BASIC_INPUTS_STORAGE_KEY,
  emptyBasicInputValues,
  loadBasicInputValues,
  saveBasicInputValues,
} from './basic-inputs-store';

function storageWith(saved: string | null): Pick<Storage, 'getItem'> {
  return { getItem: () => saved };
}

describe('lokal gespeicherte Grundangaben', () => {
  it('verwendet ohne Speicher nur das aktuelle Steuerjahr', () => {
    expect(loadBasicInputValues(undefined, 2026)).toEqual({
      maritalStatus: '',
      taxYear: '2026',
      taxScale: '',
      religionP1: '',
      religionP2: '',
      municipality: '',
      childrenNo: '0',
      taxableIncome: '',
      ascertainedTaxableIncome: '',
      useDifferentFederalIncome: 'false',
      federalTaxableIncome: '',
      federalAscertainedTaxableIncome: '',
      taxableAssets: '',
      ascertainedTaxableAssets: '',
    });
  });

  it('liest gespeicherte Werte ohne fehlende Angaben zu erfinden', () => {
    const saved = JSON.stringify({
      maritalStatus: 'single',
      taxYear: '2025',
      taxableIncome: '75000',
    });

    const values = loadBasicInputValues(storageWith(saved), 2026);

    expect(values.maritalStatus).toBe('single');
    expect(values.taxYear).toBe('2025');
    expect(values.taxableIncome).toBe('75000');
    expect(values.taxableAssets).toBe('');
  });

  it('ignoriert beschädigte oder unbrauchbare Speicherinhalte', () => {
    expect(loadBasicInputValues(storageWith('{'), 2026)).toEqual(
      emptyBasicInputValues(2026),
    );
    expect(loadBasicInputValues(storageWith('null'), 2026)).toEqual(
      emptyBasicInputValues(2026),
    );
  });

  it('speichert alle Eingaben unter einem stabilen Schlüssel', () => {
    const values = emptyBasicInputValues(2026);
    values.maritalStatus = 'married';
    let key = '';
    let serialized = '';

    expect(
      saveBasicInputValues(
        {
          setItem: (savedKey, value) => {
            key = savedKey;
            serialized = value;
          },
        },
        values,
      ),
    ).toBe(true);
    expect(key).toBe(BASIC_INPUTS_STORAGE_KEY);
    expect(JSON.parse(serialized)).toEqual(values);
  });

  it('meldet nicht verfügbaren oder blockierten Speicher', () => {
    const values = emptyBasicInputValues(2026);

    expect(saveBasicInputValues(undefined, values)).toBe(false);
    expect(
      saveBasicInputValues(
        {
          setItem: () => {
            throw new Error('Speicher blockiert');
          },
        },
        values,
      ),
    ).toBe(false);
  });
});
