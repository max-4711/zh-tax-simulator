import { describe, expect, it } from 'vitest';
import {
  formatTaxValue,
  renderTaxCalculation,
} from './tax-calculation';
import {
  readTaxCalculationResult,
  TAX_RESULT_FIELDS,
} from './calculator-api';

function calculationResult() {
  return readTaxCalculationResult(
    Object.fromEntries(
      TAX_RESULT_FIELDS.map((field, index) => [
        field,
        field === 'personalTaxRate'
          ? { label: 'Personalsteuer, Steuerfuss', value: 'pauschal' }
          : field.endsWith('Rate') || field.endsWith('RateP1')
            ? { label: `Satz ${field}`, value: index, symbol: '%' }
            : { label: `Betrag ${field}`, value: 1000 + index, currency: 'CHF' },
      ]),
    ),
  );
}

describe('Darstellung der Basisrechnung', () => {
  it('verwendet API-Bezeichnungen und stellt Zwischenergebnis und Endbeträge getrennt dar', () => {
    const page = renderTaxCalculation(calculationResult());

    expect(page).toContain('Betrag totalCantonalTax');
    expect(page).toContain('Nicht direkt geschuldet');
    expect(page).toContain('Betrag cantonalSimpleTax');
    expect(page).toContain('Betrag cantonalBaseTax');
    expect(page).toContain('Betrag municipalityTax');
    expect(page).toContain('Betrag religionTaxP1');
    expect(page).toContain('Personalsteuer, Steuerfuss: pauschal');
    expect(page).toContain('Bundessteuer');
    expect(page).toContain('Folgt später');
  });

  it('zeigt die Steuersätze und ihre Berechnungsbasis in den Formeln', () => {
    const page = renderTaxCalculation(calculationResult());

    expect(page).toContain('Satz cantonalBaseTaxRate 9 %');
    expect(page).toContain('Betrag cantonalSimpleTax CHF 1’008.00');
    expect(page).toContain('<dt>Betrag cantonalBaseTax</dt>');
    expect(page).toContain('<dd>CHF 1’010.00</dd>');
    expect(page).toContain('Satz municipalityTaxRate 11 %');

    expect(page).toContain('<dt>Betrag municipalityTax</dt>');
    expect(page).toContain('<dd>CHF 1’012.00</dd>');
  });

  it('formatiert Werte mit den von der API gelieferten Einheiten', () => {
    expect(formatTaxValue({ label: 'Steuerfuss', value: 0.58, symbol: '‰' })).toBe('0.58 ‰');
    expect(formatTaxValue({ label: 'Steuer', value: 3848.45, currency: 'CHF' })).toBe(
      'CHF 3’848.45',
    );
  });
});
