import { describe, expect, it, vi } from 'vitest';
import {
  CALCULATOR_METADATA_URL,
  fetchCalculatorMetadata,
  readAmountConfiguration,
  readChoiceConfiguration,
} from './calculator-api';

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
