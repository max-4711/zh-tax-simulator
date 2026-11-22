import { describe, expect, it, vi } from 'vitest';
import {
  CALCULATOR_CALCULATION_URL,
  CALCULATOR_METADATA_URL,
  calculateTaxes,
  fetchCalculatorMetadata,
  readAmountConfiguration,
  readChoiceConfiguration,
  readTaxCalculationResult,
  TAX_RESULT_FIELDS,
} from './calculator-api';
import { emptyBasicInputValues } from './basic-inputs-store';

const metadata = {
  taxYear: {
    label: 'Steuerjahr',
    options: [
      { code: 'pleaseSelect', value: 'Bitte wählen' },
      { code: '2026', value: '2026' },
    ],
  },
  taxableIncome: {
    label: 'Steuerbares Einkommen',
    hint: 'Ziffer 27 der Steuererklärung',
    maxSize: 10000000000,
    hasFractionDigits: false,
  },
};

describe('Metadaten des Steuerrechners', () => {
  it('liest Bezeichnungen und Auswahlmöglichkeiten ohne Platzhalter', () => {
    expect(readChoiceConfiguration(metadata, 'taxYear')).toEqual({
      label: 'Steuerjahr',
      options: [{ code: '2026', label: '2026' }],
    });
  });

  it('liest die Eigenschaften von Betragsfeldern', () => {
    expect(readAmountConfiguration(metadata, 'taxableIncome')).toEqual({
      label: 'Steuerbares Einkommen',
      hint: 'Ziffer 27 der Steuererklärung',
      maximum: 10000000000,
      hasFractionDigits: false,
    });
  });

  it('weist unbrauchbare Felddefinitionen zurück', () => {
    expect(() => readChoiceConfiguration({ taxYear: null }, 'taxYear')).toThrow();
    expect(() => readChoiceConfiguration({ taxYear: { options: [] } }, 'taxYear')).toThrow();
  });

  it('ruft die offizielle Metadatenquelle ab', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(metadata), { status: 200 }),
    );

    await expect(fetchCalculatorMetadata()).resolves.toEqual(metadata);
    expect(fetchMock).toHaveBeenCalledWith(CALCULATOR_METADATA_URL, {
      headers: { Accept: 'application/json' },
    });

    fetchMock.mockRestore();
  });

  it('meldet einen fehlgeschlagenen API-Aufruf', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(null, { status: 503 }),
    );

    await expect(fetchCalculatorMetadata()).rejects.toThrow('Status 503');
    fetchMock.mockRestore();
  });
});

describe('Steuerberechnung', () => {
  const calculationResponse = Object.fromEntries(
    TAX_RESULT_FIELDS.map((field) => [
      field,
      { label: `Bezeichnung ${field}`, value: 12.5, currency: 'CHF' },
    ]),
  );

  it('übermittelt alle Basisangaben im offiziellen Anfrageformat', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(calculationResponse), { status: 200 }),
    );
    const values = {
      ...emptyBasicInputValues(2027),
      maritalStatus: 'single',
      taxScale: 'BASIC',
      religionP1: 'OTHERS',
      municipality: '14',
      taxableIncome: '73000',
      ascertainedTaxableIncome: '74000',
      taxableAssets: '480000',
      ascertainedTaxableAssets: '490000',
    };

    await calculateTaxes(values);

    expect(fetchMock).toHaveBeenCalledWith(CALCULATOR_CALCULATION_URL, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        taxYear: '2027',
        maritalStatus: 'single',
        taxScale: 'BASIC',
        religionP1: 'OTHERS',
        municipality: '14',
        taxableIncome: 73000,
        ascertainedTaxableIncome: 74000,
        taxableAssets: 480000,
        ascertainedTaxableAssets: 490000,
      }),
    });
    fetchMock.mockRestore();
  });

  it('liest die offiziellen Bezeichnungen und die pauschale Personalsteuer', () => {
    const result = readTaxCalculationResult({
      ...calculationResponse,
      personalTaxRate: { label: 'Personalsteuer, Steuerfuss', value: 'pauschal' },
    });

    expect(result.cantonalSimpleTax.label).toBe('Bezeichnung cantonalSimpleTax');
    expect(result.personalTaxRate.value).toBe('pauschal');
    expect(() => readTaxCalculationResult({})).toThrow('ascertainedTaxableIncome');
  });
});
