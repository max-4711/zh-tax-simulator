import { describe, expect, it } from 'vitest';
import {
  readFederalTaxCalculationResult,
  readTaxCalculationResult,
  TAX_RESULT_FIELDS,
} from './calculator-api';
import { compareTaxValues, renderComparison, type ScenarioResult } from './comparison';

function scenarioResult(factor = 1): ScenarioResult {
  return {
    cantonal: readTaxCalculationResult(
      Object.fromEntries(
        TAX_RESULT_FIELDS.map((field, index) => [
          field,
          field === 'personalTaxRate'
            ? { label: 'Personalsteuer, Steuerfuss', value: 'pauschal' }
            : field.endsWith('Rate') || field.endsWith('RateP1')
              ? { label: `Satz ${field}`, value: index * factor, symbol: '%' }
              : { label: `Betrag ${field}`, value: (1000 + index) * factor, currency: 'CHF' },
        ]),
      ),
    ),
    federal: readFederalTaxCalculationResult({
      taxableAscertainedFederalIncome: { label: 'Satzbestimmendes Einkommen', value: 74000 * factor, currency: 'CHF' },
      taxableFederalIncome: { label: 'Steuerbares Einkommen', value: 73000 * factor, currency: 'CHF' },
      federalTaxRate: { label: 'Steuersatz', value: 1.01 * factor, symbol: '%' },
      totalFederalTax: { label: 'Total direkte Bundessteuer', value: 738 * factor, currency: 'CHF' },
      childrenDeduction: { label: 'Kinderabzug', value: 264 * factor, currency: 'CHF' },
      totalAfterChildrenDeduction: { label: 'Steuerbetrag', value: 474 * factor, currency: 'CHF' },
    }),
  };
}

function normalizeApostrophes(value: string): string {
  return value.replace(/[’']/g, '’');
}

describe('Vergleich von Steuerergebnissen', () => {
  it('berechnet absolute und relative Differenzen vom Basis- zum Vergleichswert', () => {
    expect(compareTaxValues(
      { label: 'Steuer', value: 1000, currency: 'CHF' },
      { label: 'Steuer', value: 1250, currency: 'CHF' },
    )).toEqual({ absolute: '+CHF 250.00', relative: '+25.0 %' });
    expect(compareTaxValues(
      { label: 'Steuer', value: 1000, currency: 'CHF' },
      { label: 'Steuer', value: 750, currency: 'CHF' },
    )).toEqual({ absolute: '−CHF 250.00', relative: '-25.0 %' });
  });

  it('zeigt bei null oder nicht numerischen Werten keine erfundene Prozentangabe', () => {
    expect(compareTaxValues(
      { label: 'Steuer', value: 0, currency: 'CHF' },
      { label: 'Steuer', value: 100, currency: 'CHF' },
    ).relative).toBe('–');
    expect(compareTaxValues(
      { label: 'Steuerfuss', value: 'pauschal' },
      { label: 'Steuerfuss', value: 'pauschal' },
    )).toEqual({ absolute: '–', relative: '–' });
  });

  it('zeigt einen nur in einem Szenario vorhandenen Kinderabzug in beiden Spalten', () => {
    const base = scenarioResult();
    const comparison = scenarioResult();
    comparison.federal.childrenDeduction = null;
    const page = renderComparison(base, comparison);

    expect(page).toContain('Kinderabzug');
    expect(page).toContain('<td data-label="1:1 Vergleich">–</td>');
  });

  it('stellt Gesamttotal, Zwischenergebnisse, Sätze und beide Differenzarten gegenüber', () => {
    const page = normalizeApostrophes(renderComparison(scenarioResult(), scenarioResult(1.1)));

    expect(page).toContain('Steuerbelastung im Vergleich');
    expect(page).toContain('CHF 4’526.00');
    expect(page).toContain('CHF 4’978.60');
    expect(page).toContain('+CHF 452.60');
    expect(page).toContain('+10.0 % gegenüber dem Basisszenario');
    expect(page).toContain('Betrag cantonalSimpleTax');
    expect(page).toContain('Betrag totalCantonalTax');
    expect(page).toContain('Satz cantonalBaseTaxRate');
    expect(page).toContain('Steuersatz');
    expect(page).toContain('Steuerbetrag');
    expect(page).toContain('+10.0 % relativ');
    expect(page).toContain('Personalsteuer, Steuerfuss');
  });
});
