export const CHOICE_FIELDS = [
  'maritalStatus',
  'taxYear',
  'taxScale',
  'religionP1',
  'municipality',
] as const;

export const AMOUNT_FIELDS = [
  'taxableIncome',
  'ascertainedTaxableIncome',
  'taxableAssets',
  'ascertainedTaxableAssets',
] as const;

function renderChoiceField(field: (typeof CHOICE_FIELDS)[number]): string {
  return `
    <div class="field">
      <label for="${field}"></label>
      <select id="${field}" name="${field}" required disabled>
        <option value="">Bitte wählen</option>
      </select>
    </div>`;
}

function renderAmountField(field: (typeof AMOUNT_FIELDS)[number]): string {
  return `
    <div class="field">
      <label for="${field}"></label>
      <div class="amount-input">
        <input
          id="${field}"
          name="${field}"
          type="number"
          inputmode="decimal"
          min="0"
          placeholder="0"
          required
        />
        <span aria-hidden="true">CHF</span>
      </div>
      <p class="field-hint" id="${field}-hint"></p>
    </div>`;
}

export function renderApp(): string {
  return `
    <header class="site-header">
      <span>Persönliches Steuer-Notiztool</span>
      <span class="location">Kanton Zürich</span>
    </header>

    <main>
      <section class="intro" aria-labelledby="page-title">
        <h1 id="page-title">Meine Steuerdaten</h1>
        <p>
          Ein paar Angaben für meine eigenen Steuer-Szenarien. Die Auswahllisten
          kommen vom offiziellen Rechner des Kantons Zürich.
        </p>
      </section>

      <form id="basic-inputs" class="input-form" aria-busy="true">
        <div class="form-heading">
          <h2>Grundangaben</h2>
          <span>Alle Felder sind erforderlich.</span>
        </div>

        <p id="loading-status" class="form-status" role="status">
          Auswahlmöglichkeiten werden geladen …
        </p>

        <div class="form-grid">
          ${CHOICE_FIELDS.map(renderChoiceField).join('')}
        </div>

        <fieldset>
          <legend>Einkommen</legend>
          <div class="form-grid amount-grid">
            ${AMOUNT_FIELDS.slice(0, 2).map(renderAmountField).join('')}
          </div>
        </fieldset>

        <fieldset>
          <legend>Vermögen</legend>
          <div class="form-grid amount-grid">
            ${AMOUNT_FIELDS.slice(2).map(renderAmountField).join('')}
          </div>
        </fieldset>

        <p id="storage-status" class="storage-note">
          Änderungen werden automatisch nur in diesem Browser gespeichert.
        </p>
        <noscript>Zum Erfassen der Angaben wird JavaScript benötigt.</noscript>
      </form>
    </main>

    <footer>
      <p>Privates Hilfsmittel · Keine Steuerberatung oder rechtsverbindliche Steuerveranlagung.</p>
    </footer>
  `;
}
