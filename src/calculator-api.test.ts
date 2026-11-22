import { describe, expect, it, vi } from 'vitest';
import {
  CALCULATOR_CALCULATION_URL,
  CALCULATOR_METADATA_URL,
  FEDERAL_CALCULATION_URL,
  FEDERAL_METADATA_URL,
  calculateFederalTaxes,
  calculateTaxes,
  federalTaxScale,
  fetchCalculatorMetadata,
  fetchChildrenConfiguration,
  readAmountConfiguration,
  readChoiceConfiguration,
  readChildrenConfiguration,
  readFederalTaxCalculationResult,
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

describe('Bundessteuer', () => {
  const federalResponse = {
    taxableAscertainedFederalIncome: null,
    taxableFederalIncome: { label: 'Steuerbares Einkommen', value: 73000, currency: 'CHF' },
    federalTaxRate: { label: 'Steuersatz', value: 1.01, symbol: '%' },
    totalFederalTax: { label: 'Total direkte Bundessteuer', value: 738, currency: 'CHF' },
    childrenDeduction: { label: 'Kinderabzug', value: 264, currency: 'CHF' },
    totalAfterChildrenDeduction: { label: 'Steuerbetrag', value: 474, currency: 'CHF' },
  };

  it('lädt die Anwendbarkeit und Bezeichnung der Kinderanzahl für den gewählten Tarif', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({
        childrenNo: { label: 'Anzahl eigene Kinder im gleichen Haushalt', maxSize: 20 },
      }), { status: 200 }),
    );

    await expect(fetchChildrenConfiguration('2027', 'MARRIED_OR_SINGLE_PARENT')).resolves.toEqual({
      applicable: true,
      label: 'Anzahl eigene Kinder im gleichen Haushalt',
      maximum: 20,
    });
    expect(fetchMock).toHaveBeenCalledWith(FEDERAL_METADATA_URL, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ taxYear: '2027', taxScale: 'MARRIED_OR_SINGLE_PARENT' }),
    });
    expect(readChildrenConfiguration({ childrenNo: null }).applicable).toBe(false);
    fetchMock.mockRestore();
  });

  it('bildet die offiziellen Tarifcodes aufeinander ab', () => {
    expect(federalTaxScale('BASIC')).toBe('SINGLE');
    expect(federalTaxScale('MARRIED_OR_SINGLE_PARENT')).toBe('MARRIED_OR_SINGLE_PARENT');
    expect(() => federalTaxScale('UNKNOWN')).toThrow();
  });

  it('übermittelt Einkommen und Kinderanzahl an den Bundessteuerrechner', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(federalResponse), { status: 200 }),
    );
    const values = {
      ...emptyBasicInputValues(2027),
      taxScale: 'MARRIED_OR_SINGLE_PARENT',
      childrenNo: '1',
      taxableIncome: '73000',
      ascertainedTaxableIncome: '74000',
    };

    await calculateFederalTaxes(values);

    expect(fetchMock).toHaveBeenCalledWith(FEDERAL_CALCULATION_URL, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        taxYear: '2027',
        taxScale: 'MARRIED_OR_SINGLE_PARENT',
        childrenNo: '1',
        taxableIncome: 73000,
        ascertainedTaxableIncome: 74000,
      }),
    });
    fetchMock.mockRestore();
  });

  it('verwendet optional die separat erfassten Bundes-Einkommensbeträge', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(federalResponse), { status: 200 }),
    );
    const values = {
      ...emptyBasicInputValues(2027),
      taxScale: 'BASIC',
      taxableIncome: '73000',
      ascertainedTaxableIncome: '74000',
      useDifferentFederalIncome: 'true',
      federalTaxableIncome: '70000',
      federalAscertainedTaxableIncome: '71000',
    };

    await calculateFederalTaxes(values);

    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toMatchObject({
      taxableIncome: 70000,
      ascertainedTaxableIncome: 71000,
    });
    fetchMock.mockRestore();
  });

  it('verwendet bei fehlendem satzbestimmendem Einkommen das steuerbare Einkommen', () => {
    const result = readFederalTaxCalculationResult(federalResponse);

    expect(result.taxableAscertainedFederalIncome).toEqual(federalResponse.taxableFederalIncome);
    expect(result.childrenDeduction?.value).toBe(264);
    expect(readFederalTaxCalculationResult({
      ...federalResponse,
      childrenDeduction: null,
    }).childrenDeduction).toBeNull();
  });
});
