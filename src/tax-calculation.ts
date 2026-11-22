import type { BasicInputValues } from './basic-inputs-store';
import {
  calculateTaxes,
  type TaxCalculationResult,
  type TaxValue,
} from './calculator-api';

const currencyFormatters = new Map<string, Intl.NumberFormat>();
const numberFormatter = new Intl.NumberFormat('de-CH', { maximumFractionDigits: 3 });

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] ?? character,
  );
}

export function formatTaxValue(field: TaxValue): string {
  if (typeof field.value === 'string') {
    return escapeHtml(field.value);
  }

  if (field.currency !== undefined) {
    let formatter = currencyFormatters.get(field.currency);
    if (formatter === undefined) {
      formatter = new Intl.NumberFormat('de-CH', {
        style: 'currency',
        currency: field.currency,
        minimumFractionDigits: 2,
      });
      currencyFormatters.set(field.currency, formatter);
    }
    return formatter.format(field.value).replace(/ /g, ' ');
  }

  return `${numberFormatter.format(field.value)}${field.symbol === undefined ? '' : ` ${escapeHtml(field.symbol)}`}`;
}

function resultField(field: TaxValue): string {
  return `
    <div class="tax-result-field">
      <dt>${escapeHtml(field.label)}</dt>
      <dd>${formatTaxValue(field)}</dd>
    </div>`;
}

function taxCard(
  title: string,
  field: TaxValue,
  base: TaxValue,
  rate: TaxValue,
): string {
  return `
    <article class="tax-card">
      <div class="tax-card-heading">
        <h3>${escapeHtml(title)}</h3>
        ${resultField(field)}
      </div>
      <p class="tax-formula">
        ${escapeHtml(base.label)} ${formatTaxValue(base)} ×
        ${escapeHtml(rate.label)} ${formatTaxValue(rate)} =
        ${formatTaxValue(field)}
      </p>
    </article>`;
}

export function renderTaxCalculation(result: TaxCalculationResult): string {
  return `
    <section class="tax-overview" aria-labelledby="tax-total-title">
      <div>
        <p class="eyebrow">Zu zahlen</p>
        <h2 id="tax-total-title">${escapeHtml(result.totalCantonalTax.label)}</h2>
        <p>Ohne Bundessteuer. Diese wird in einer späteren Ausbaustufe ergänzt.</p>
      </div>
      <strong>${formatTaxValue(result.totalCantonalTax)}</strong>
    </section>

    <div class="tax-sections">
      <section class="tax-section simple-tax" aria-labelledby="simple-tax-title">
        <div class="tax-section-heading">
          <div>
            <p class="eyebrow">Zwischenergebnis</p>
            <h2 id="simple-tax-title">Kantonale einfache Steuer</h2>
          </div>
          <span>Nicht direkt geschuldet</span>
        </div>

        <div class="simple-tax-grid">
          <section aria-labelledby="income-tax-title">
            <h3 id="income-tax-title">Einkommenssteuer</h3>
            <dl class="tax-details">
              ${resultField(result.ascertainedTaxableIncome)}
              <div class="rate-arrow" aria-hidden="true">↓ bestimmt den Satz</div>
              ${resultField(result.incomeTaxRate)}
              ${resultField(result.taxableIncome)}
            </dl>
            <p class="tax-formula">${escapeHtml(result.incomeTaxRate.label)} ${formatTaxValue(result.incomeTaxRate)} × ${escapeHtml(result.taxableIncome.label)} ${formatTaxValue(result.taxableIncome)} = ${formatTaxValue(result.incomeTax)}</p>
            <dl>${resultField(result.incomeTax)}</dl>
          </section>

          <section aria-labelledby="assets-tax-title">
            <h3 id="assets-tax-title">Vermögenssteuer</h3>
            <dl class="tax-details">
              ${resultField(result.ascertainedTaxableAssets)}
              <div class="rate-arrow" aria-hidden="true">↓ bestimmt den Satz</div>
              ${resultField(result.assetsTaxRate)}
              ${resultField(result.taxableAssets)}
            </dl>
            <p class="tax-formula">${escapeHtml(result.assetsTaxRate.label)} ${formatTaxValue(result.assetsTaxRate)} × ${escapeHtml(result.taxableAssets.label)} ${formatTaxValue(result.taxableAssets)} = ${formatTaxValue(result.assetsTax)}</p>
            <dl>${resultField(result.assetsTax)}</dl>
          </section>
        </div>
        <dl class="simple-tax-total">${resultField(result.cantonalSimpleTax)}</dl>
        <p class="tax-section-note">Einkommenssteuer + Vermögenssteuer. Die einfache Steuer ist die Basis für die folgenden Steuerfüsse.</p>
      </section>

      <section class="payable-taxes" aria-labelledby="payable-taxes-title">
        <div class="tax-section-heading">
          <div>
            <p class="eyebrow">Steuerbetrag</p>
            <h2 id="payable-taxes-title">Zu zahlende Steuern</h2>
          </div>
        </div>
        <div class="tax-card-grid">
          ${taxCard(
            'Staatssteuer (Kanton)',
            result.cantonalBaseTax,
            result.cantonalSimpleTax,
            result.cantonalBaseTaxRate,
          )}
          ${taxCard(
            'Gemeindesteuer',
            result.municipalityTax,
            result.cantonalSimpleTax,
            result.municipalityTaxRate,
          )}
          ${taxCard(
            'Kirchensteuer',
            result.religionTaxP1,
            result.cantonalSimpleTax,
            result.religionTaxRateP1,
          )}
          <article class="tax-card">
            <div class="tax-card-heading">
              <h3>Personalsteuer</h3>
              ${resultField(result.personalTax)}
            </div>
            <p class="tax-formula">${escapeHtml(result.personalTaxRate.label)}: ${formatTaxValue(result.personalTaxRate)}</p>
          </article>
          <article class="tax-card tax-card-placeholder" aria-labelledby="federal-tax-title">
            <div class="tax-card-heading">
              <h3 id="federal-tax-title">Bundessteuer</h3>
              <span class="tax-placeholder-label">Folgt später</span>
            </div>
            <p class="tax-formula">Die Bundessteuer wird über eine separate Schnittstelle berechnet und ist in der obigen Summe noch nicht enthalten.</p>
          </article>
        </div>
      </section>
    </div>`;
}

export class TaxCalculationPage {
  private readonly results: HTMLElement;
  private readonly status: HTMLElement;
  private readonly retryButton: HTMLButtonElement;
  private requestNumber = 0;

  constructor(
    root: HTMLElement,
    private readonly getValues: () => BasicInputValues,
    private readonly calculate: typeof calculateTaxes = calculateTaxes,
  ) {
    this.results = this.getElement(root, '#tax-calculation-results');
    this.status = this.getElement(root, '#tax-calculation-status');
    this.retryButton = this.getElement(root, '#tax-calculation-retry');
    this.retryButton.addEventListener('click', () => void this.open());
  }

  async open(): Promise<void> {
    const requestNumber = ++this.requestNumber;
    this.results.hidden = true;
    this.retryButton.hidden = true;
    this.status.dataset.state = 'loading';
    this.status.textContent = 'Die Steuerberechnung wird geladen …';

    try {
      const result = await this.calculate(this.getValues());
      if (requestNumber !== this.requestNumber) {
        return;
      }
      this.results.innerHTML = renderTaxCalculation(result);
      this.results.hidden = false;
      this.status.dataset.state = 'success';
      this.status.textContent = 'Berechnung mit den aktuellen Basisangaben aktualisiert.';
    } catch {
      if (requestNumber !== this.requestNumber) {
        return;
      }
      this.status.dataset.state = 'error';
      this.status.textContent =
        'Die Steuerberechnung konnte nicht geladen werden. Bitte erneut versuchen.';
      this.retryButton.hidden = false;
    }
  }

  private getElement<T extends HTMLElement>(root: HTMLElement, selector: string): T {
    const element = root.querySelector<T>(selector);
    if (element === null) {
      throw new Error(`Das Berechnungselement ${selector} fehlt.`);
    }
    return element;
  }
}
