import { describe, expect, it } from 'vitest';
import {
  formatTaxValue,
  renderTaxCalculation,
} from './tax-calculation';
import {
  readFederalTaxCalculationResult,
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

function federalResult(withDeduction = true) {
  return readFederalTaxCalculationResult({
    taxableAscertainedFederalIncome: { label: 'Satzbestimmendes Einkommen', value: 74000, currency: 'CHF' },
    taxableFederalIncome: { label: 'Steuerbares Einkommen', value: 73000, currency: 'CHF' },
    federalTaxRate: { label: 'Steuersatz', value: 1.01, symbol: '%' },
    totalFederalTax: { label: 'Total direkte Bundessteuer', value: 738, currency: 'CHF' },
    childrenDeduction: withDeduction
      ? { label: 'Kinderabzug', value: 264, currency: 'CHF' }
      : null,
    totalAfterChildrenDeduction: {
      label: 'Steuerbetrag',
      value: withDeduction ? 474 : 738,
      currency: 'CHF',
    },
  });
}

function normalizeApostrophes(value: string): string {
  return value.replace(/[’']/g, '’');
}

describe('Darstellung der Basisrechnung', () => {
  it('verwendet API-Bezeichnungen und stellt Zwischenergebnis und Endbeträge getrennt dar', () => {
    const page = renderTaxCalculation(calculationResult(), federalResult());

    expect(page).toContain('Total Steuern inklusive direkter Bundessteuer');
    expect(page).toContain('Nicht direkt geschuldet');
    expect(page).toContain('Betrag cantonalSimpleTax');
    expect(page).toContain('Betrag cantonalBaseTax');
    expect(page).toContain('Betrag municipalityTax');
    expect(page).toContain('Betrag religionTaxP1');
    expect(page).toContain('Personalsteuer, Steuerfuss: pauschal');
    expect(page).toContain('Bundessteuer');
    expect(page).toContain('Kinderabzug');
    expect(normalizeApostrophes(page)).toContain('CHF 4’526.00');
  });

  it('zeigt die Steuersätze und ihre Berechnungsbasis in den Formeln', () => {
    const page = renderTaxCalculation(calculationResult(), federalResult());

    expect(page).toContain('Satz cantonalBaseTaxRate 9 %');
    expect(normalizeApostrophes(page)).toContain('Betrag cantonalSimpleTax CHF 1’008.00');
    expect(page).toContain('<dt>Betrag cantonalBaseTax</dt>');
    expect(normalizeApostrophes(page)).toContain('<dd>CHF 1’010.00</dd>');
    expect(page).toContain('Satz municipalityTaxRate 11 %');

    expect(page).toContain('<dt>Betrag municipalityTax</dt>');
    expect(normalizeApostrophes(page)).toContain('<dd>CHF 1’012.00</dd>');
  });

  it('zeigt die Bundessteuer ohne Kinderabzug als direkten Steuerbetrag', () => {
    const page = renderTaxCalculation(calculationResult(), federalResult(false));

    expect(page).toContain('Steuersatz 1.01 %');
    expect(page).toContain('Total direkte Bundessteuer');
    expect(page).not.toContain('Kinderabzug');
    expect(normalizeApostrophes(page)).toContain('CHF 4’790.00');
  });

  it('formatiert Werte mit den von der API gelieferten Einheiten', () => {
    expect(formatTaxValue({ label: 'Steuerfuss', value: 0.58, symbol: '‰' })).toBe('0.58 ‰');
    expect(normalizeApostrophes(formatTaxValue({ label: 'Steuer', value: 3848.45, currency: 'CHF' }))).toBe(
      'CHF 3’848.45',
    );
  });
});
