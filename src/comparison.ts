import { BasicInputsForm } from './basic-inputs-form';
import type { BasicInputValues } from './basic-inputs-store';
import {
  calculateFederalTaxes,
  calculateTaxes,
  type CalculatorMetadata,
  type FederalTaxCalculationResult,
  type TaxCalculationResult,
  type TaxValue,
} from './calculator-api';
import { formatTaxValue, totalTaxValue } from './tax-calculation';

export interface ScenarioResult {
  cantonal: TaxCalculationResult;
  federal: FederalTaxCalculationResult;
}

export interface ValueDelta {
  absolute: string;
  relative: string;
}

const percentFormatter = new Intl.NumberFormat('de-CH', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
  signDisplay: 'exceptZero',
});

export function compareTaxValues(base: TaxValue, comparison: TaxValue): ValueDelta {
  if (typeof base.value !== 'number' || typeof comparison.value !== 'number') {
    return { absolute: '–', relative: '–' };
  }

  const difference = comparison.value - base.value;
  const absolute: TaxValue = { ...base, value: Math.abs(difference) };
  return {
    absolute: `${difference > 0 ? '+' : difference < 0 ? '−' : ''}${formatTaxValue(absolute)}`,
    relative:
      base.value === 0
        ? '–'
        : `${percentFormatter.format((difference / Math.abs(base.value)) * 100)} %`,
  };
}

interface ComparisonRow {
  base: TaxValue;
  comparison: TaxValue;
}

interface ComparisonSection {
  title: string;
  note?: string;
  rows: ComparisonRow[];
}

function row(base: TaxValue, comparison: TaxValue): ComparisonRow {
  return { base, comparison };
}

function optionalRow(base: TaxValue | null, comparison: TaxValue | null): ComparisonRow[] {
  if (base === null && comparison === null) {
    return [];
  }
  return [
    row(
      base ?? { label: comparison?.label ?? '', value: '–' },
      comparison ?? { label: base?.label ?? '', value: '–' },
    ),
  ];
}

function comparisonSections(base: ScenarioResult, comparison: ScenarioResult): ComparisonSection[] {
  const sections: ComparisonSection[] = [
    {
      title: 'Einkommenssteuer',
      rows: [
        row(base.cantonal.ascertainedTaxableIncome, comparison.cantonal.ascertainedTaxableIncome),
        row(base.cantonal.incomeTaxRate, comparison.cantonal.incomeTaxRate),
        row(base.cantonal.taxableIncome, comparison.cantonal.taxableIncome),
        row(base.cantonal.incomeTax, comparison.cantonal.incomeTax),
      ],
    },
    {
      title: 'Vermögenssteuer',
      rows: [
        row(base.cantonal.ascertainedTaxableAssets, comparison.cantonal.ascertainedTaxableAssets),
        row(base.cantonal.assetsTaxRate, comparison.cantonal.assetsTaxRate),
        row(base.cantonal.taxableAssets, comparison.cantonal.taxableAssets),
        row(base.cantonal.assetsTax, comparison.cantonal.assetsTax),
      ],
    },
    {
      title: 'Kantonale einfache Steuer',
      note: 'Nicht direkt geschuldet; Basis für Staats-, Gemeinde- und Kirchensteuer.',
      rows: [row(base.cantonal.cantonalSimpleTax, comparison.cantonal.cantonalSimpleTax)],
    },
    {
      title: 'Staats-, Gemeinde- und Kirchensteuer',
      rows: [
        row(base.cantonal.cantonalBaseTaxRate, comparison.cantonal.cantonalBaseTaxRate),
        row(base.cantonal.cantonalBaseTax, comparison.cantonal.cantonalBaseTax),
        row(base.cantonal.municipalityTaxRate, comparison.cantonal.municipalityTaxRate),
        row(base.cantonal.municipalityTax, comparison.cantonal.municipalityTax),
        row(base.cantonal.religionTaxRateP1, comparison.cantonal.religionTaxRateP1),
        row(base.cantonal.religionTaxP1, comparison.cantonal.religionTaxP1),
      ],
    },
    {
      title: 'Personalsteuer und kantonale Zwischensumme',
      rows: [
        row(base.cantonal.personalTaxRate, comparison.cantonal.personalTaxRate),
        row(base.cantonal.personalTax, comparison.cantonal.personalTax),
        row(base.cantonal.totalCantonalTax, comparison.cantonal.totalCantonalTax),
      ],
    },
    {
      title: 'Direkte Bundessteuer',
      rows: [
        row(base.federal.taxableAscertainedFederalIncome, comparison.federal.taxableAscertainedFederalIncome),
        row(base.federal.federalTaxRate, comparison.federal.federalTaxRate),
        row(base.federal.taxableFederalIncome, comparison.federal.taxableFederalIncome),
        row(base.federal.totalFederalTax, comparison.federal.totalFederalTax),
        ...optionalRow(base.federal.childrenDeduction, comparison.federal.childrenDeduction),
        row(base.federal.totalAfterChildrenDeduction, comparison.federal.totalAfterChildrenDeduction),
      ],
    },
  ];
  return sections;
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] ?? character,
  );
}

function renderSummary(base: TaxValue, comparison: TaxValue): string {
  const delta = compareTaxValues(base, comparison);
  const difference = Number(comparison.value) - Number(base.value);
  const change = difference === 0 ? 'Unverändert' : difference < 0 ? 'Weniger Steuern' : 'Mehr Steuern';
  return `
    <section class="comparison-summary" aria-labelledby="comparison-summary-title">
      <p class="eyebrow">Gesamttotal</p>
      <h2 id="comparison-summary-title">Steuerbelastung im Vergleich</h2>
      <div class="comparison-summary-grid">
        <div class="summary-scenario">
          <h3>Basisszenario</h3>
          <strong>${formatTaxValue(base)}</strong>
        </div>
        <div class="summary-scenario comparison-scenario">
          <h3>1:1 Vergleich</h3>
          <strong>${formatTaxValue(comparison)}</strong>
        </div>
        <div class="summary-delta" data-change="${difference < 0 ? 'decrease' : difference > 0 ? 'increase' : 'unchanged'}">
          <h3>${change}</h3>
          <strong>${delta.absolute}</strong>
          <span>${delta.relative} gegenüber dem Basisszenario</span>
        </div>
      </div>
      <p class="comparison-total-note">Total aus Staats-, Gemeinde-, Kirchen-, Personal- und direkter Bundessteuer. Differenz: Vergleich minus Basisszenario.</p>
    </section>`;
}

function renderSection(section: ComparisonSection): string {
  return `
    <section class="comparison-detail-section">
      <h3>${section.title}</h3>
      ${section.note === undefined ? '' : `<p class="comparison-section-note">${section.note}</p>`}
      <table class="comparison-table">
        <thead>
          <tr><th scope="col">Position</th><th scope="col">Basisszenario</th><th scope="col">1:1 Vergleich</th><th scope="col">Differenz</th></tr>
        </thead>
        <tbody>
          ${section.rows
            .map(({ base, comparison }) => {
              const delta = compareTaxValues(base, comparison);
              return `<tr>
                <th scope="row">${escapeHtml(base.label)}</th>
                <td data-label="Basisszenario">${formatTaxValue(base)}</td>
                <td data-label="1:1 Vergleich">${formatTaxValue(comparison)}</td>
                <td data-label="Differenz"><span>${delta.absolute}</span><small>${delta.relative === '–' ? '–' : `${delta.relative} relativ`}</small></td>
              </tr>`;
            })
            .join('')}
        </tbody>
      </table>
    </section>`;
}

export function renderComparison(base: ScenarioResult, comparison: ScenarioResult): string {
  return `
    ${renderSummary(totalTaxValue(base.cantonal, base.federal), totalTaxValue(comparison.cantonal, comparison.federal))}
    <section class="comparison-details" aria-labelledby="comparison-details-title">
      <div class="comparison-details-heading">
        <h2 id="comparison-details-title">Alle Ergebnisse im Detail</h2>
        <p>Absolute Differenz und relative Veränderung gegenüber dem Basisszenario.</p>
      </div>
      ${comparisonSections(base, comparison).map(renderSection).join('')}
      <p class="comparison-footnote">Bei einem Ausgangswert von 0 oder einem nicht numerischen Wert ist keine relative Veränderung darstellbar.</p>
    </section>`;
}

export class ComparisonPage {
  private readonly form: BasicInputsForm;
  private readonly status: HTMLElement;
  private readonly results: HTMLElement;
  private readonly retryButton: HTMLButtonElement;
  private active = false;
  private complete = false;
  private initialized = false;
  private requestNumber = 0;
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor(
    root: HTMLElement,
    formElement: HTMLFormElement,
    private readonly getBaseValues: () => BasicInputValues,
    private readonly calculate: typeof calculateTaxes = calculateTaxes,
    private readonly calculateFederal: typeof calculateFederalTaxes = calculateFederalTaxes,
    private readonly delay = 450,
  ) {
    this.status = this.getElement(root, '#comparison-calculation-status');
    this.results = this.getElement(root, '#comparison-calculation-results');
    this.retryButton = this.getElement(root, '#comparison-calculation-retry');
    this.form = new BasicInputsForm(formElement, new Date().getFullYear(), {
      initialValues: getBaseValues(),
      persist: false,
      onCompleteChange: (complete) => {
        this.complete = complete;
        this.scheduleCalculation();
      },
    });
    this.retryButton.addEventListener('click', () => this.scheduleCalculation());
  }

  applyMetadata(metadata: CalculatorMetadata): void {
    this.initialized = true;
    this.form.applyMetadata(metadata);
  }

  showLoadingError(): void {
    this.form.showLoadingError();
  }

  open(): void {
    this.active = true;
    this.scheduleCalculation();
  }

  close(): void {
    this.active = false;
    this.clearTimer();
    this.requestNumber += 1;
  }

  private scheduleCalculation(): void {
    this.requestNumber += 1;
    this.clearTimer();
    if (!this.active || !this.initialized) {
      return;
    }
    if (!this.complete) {
      this.requestNumber += 1;
      this.results.hidden = true;
      this.retryButton.hidden = true;
      this.status.dataset.state = '';
      this.status.textContent = 'Vervollständige die Angaben für den Vergleich.';
      return;
    }
    this.status.dataset.state = 'loading';
    this.status.textContent = 'Die Vergleichsberechnung wird aktualisiert …';
    this.timer = setTimeout(() => void this.update(), this.delay);
  }

  private async update(): Promise<void> {
    const requestNumber = ++this.requestNumber;
    this.retryButton.hidden = true;
    const baseValues = this.getBaseValues();
    const comparisonValues = this.form.getValues();
    try {
      const [baseCantonal, baseFederal, comparisonCantonal, comparisonFederal] = await Promise.all([
        this.calculate(baseValues),
        this.calculateFederal(baseValues),
        this.calculate(comparisonValues),
        this.calculateFederal(comparisonValues),
      ]);
      if (!this.active || requestNumber !== this.requestNumber) {
        return;
      }
      this.results.innerHTML = renderComparison(
        { cantonal: baseCantonal, federal: baseFederal },
        { cantonal: comparisonCantonal, federal: comparisonFederal },
      );
      this.results.hidden = false;
      this.status.dataset.state = 'success';
      this.status.textContent = 'Vergleich mit den aktuellen Angaben aktualisiert.';
    } catch {
      if (!this.active || requestNumber !== this.requestNumber) {
        return;
      }
      this.results.hidden = true;
      this.status.dataset.state = 'error';
      this.status.textContent = 'Die Vergleichsberechnung konnte nicht geladen werden. Bitte erneut versuchen.';
      this.retryButton.hidden = false;
    }
  }

  private clearTimer(): void {
    if (this.timer !== undefined) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
  }

  private getElement<T extends HTMLElement>(root: HTMLElement, selector: string): T {
    const element = root.querySelector<T>(selector);
    if (element === null) {
      throw new Error(`Das Vergleichselement ${selector} fehlt.`);
    }
    return element;
  }
}
