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
          aria-describedby="${field}-hint"
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
      <div class="header-inner">
        <div class="header-start">
          <button
            id="navigation-toggle"
            class="icon-button menu-button"
            type="button"
            aria-label="Navigation öffnen"
            aria-controls="navigation-drawer"
            aria-expanded="true"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span>Persönliches Steuer-Notiztool</span>
        </div>
        <span class="location">Kanton Zürich</span>
      </div>
    </header>

    <button
      class="drawer-backdrop"
      type="button"
      aria-label="Navigation schliessen"
      tabindex="-1"
      data-close-navigation
    ></button>

    <aside id="navigation-drawer" class="navigation-drawer" aria-label="Hauptnavigation" data-open="true">
      <div class="navigation-heading">
        <span>Navigation</span>
        <button class="icon-button" type="button" aria-label="Navigation schliessen" data-close-navigation>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>
      </div>
      <nav aria-label="Szenarien">
        <ul class="scenario-navigation">
          <li>
            <div class="scenario-label">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 19V9l8-5 8 5v10M8 19v-6h8v6M3 19h18" />
              </svg>
              <span>Basisszenario</span>
            </div>
            <ul class="sub-navigation">
              <li>
                <button class="sub-navigation-link" type="button" data-page-target="basisangaben" aria-current="page">
                  <span>Basisangaben</span>
                </button>
              </li>
              <li>
                <button
                  id="basisrechnung-navigation"
                  class="sub-navigation-link"
                  type="button"
                  data-page-target="basisrechnung"
                  aria-describedby="navigation-lock-hint"
                  disabled
                >
                  <span>Basisrechnung</span>
                  <svg class="lock-icon" viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="5" y="10" width="14" height="10" rx="2" />
                    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                  </svg>
                </button>
              </li>
            </ul>
          </li>
        </ul>
      </nav>
      <p id="navigation-lock-hint" class="navigation-lock-hint">
        Fülle zuerst alle Basisangaben aus, um die Basisrechnung freizuschalten.
      </p>
    </aside>

    <div class="app-content">
      <main>
        <section id="basisangaben-page" data-page="basisangaben" aria-labelledby="page-title">
          <div class="intro">
            <p class="eyebrow">Basisszenario</p>
            <h1 id="page-title" tabindex="-1">Basisangaben</h1>
            <p>
              Ein paar Angaben für meine eigenen Steuer-Szenarien. Die Auswahllisten
              kommen vom offiziellen Rechner des Kantons Zürich.
            </p>
          </div>

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
        </section>

        <section id="basisrechnung-page" data-page="basisrechnung" aria-labelledby="calculation-title" hidden>
          <div class="intro">
            <p class="eyebrow">Basisszenario</p>
            <h1 id="calculation-title" tabindex="-1">Basisrechnung</h1>
            <p>Die Berechnung verwendet die aktuellen Basisangaben und den offiziellen Steuerrechner des Kantons Zürich.</p>
          </div>
          <div class="calculation-status-row">
            <p id="tax-calculation-status" class="form-status" role="status" aria-live="polite"></p>
            <button id="tax-calculation-retry" class="secondary-button" type="button" hidden>Erneut berechnen</button>
          </div>
          <div id="tax-calculation-results" hidden></div>
        </section>
      </main>

      <footer>
        <p>Privates Hilfsmittel · Keine Steuerberatung oder rechtsverbindliche Steuerveranlagung.</p>
      </footer>
    </div>

    <div id="completion-notification" class="completion-notification" role="status" aria-live="polite" hidden>
      <span class="completion-check" aria-hidden="true">
        <svg viewBox="0 0 24 24"><path d="m6 12 4 4 8-8" /></svg>
      </span>
      <button class="completion-link" type="button" data-page-target="basisrechnung">
        <strong>Basisangaben vollständig</strong>
        <span>Zur Basisrechnung <span aria-hidden="true">→</span></span>
      </button>
      <button id="dismiss-completion" class="icon-button" type="button" aria-label="Hinweis schliessen">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17" /></svg>
      </button>
    </div>
  `;
}
