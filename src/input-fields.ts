import type { BasicInputValues } from './basic-inputs-store';

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

type InputField = Exclude<keyof BasicInputValues, 'useDifferentFederalIncome'>;

function renderChoiceField(field: (typeof CHOICE_FIELDS)[number], idPrefix: string): string {
  return `
    <div class="field">
      <label for="${idPrefix}${field}"></label>
      <select id="${idPrefix}${field}" name="${field}" required disabled>
        <option value="">Bitte wählen</option>
      </select>
    </div>`;
}

type AmountInputField =
  | (typeof AMOUNT_FIELDS)[number]
  | 'federalTaxableIncome'
  | 'federalAscertainedTaxableIncome';

function renderAmountField(field: AmountInputField, idPrefix: string): string {
  return `
    <div class="field">
      <label for="${idPrefix}${field}"></label>
      <div class="amount-input">
        <input
          id="${idPrefix}${field}"
          name="${field}"
          type="number"
          inputmode="decimal"
          aria-describedby="${idPrefix}${field}-hint"
          min="0"
          placeholder="0"
          required
        />
        <span aria-hidden="true">CHF</span>
      </div>
      <p class="field-hint" id="${idPrefix}${field}-hint"></p>
    </div>`;
}

export function renderInputFields(storageNote: string, statusId: string, idPrefix = ''): string {
  return `
    <div class="form-heading">
      <h2>Grundangaben</h2>
      <span>Alle Felder sind erforderlich.</span>
    </div>

    <p id="${statusId}" class="form-status" role="status" data-loading-status>
      Auswahlmöglichkeiten werden geladen …
    </p>

    <div class="form-grid">
      ${CHOICE_FIELDS.map((field) => renderChoiceField(field, idPrefix)).join('')}
    </div>

    <div id="${idPrefix}religion-p2-field" class="field religion-p2-field" hidden>
      <label for="${idPrefix}religionP2"></label>
      <select id="${idPrefix}religionP2" name="religionP2" required disabled>
        <option value="">Bitte wählen</option>
      </select>
      <p id="${idPrefix}religion-p2-status" class="field-hint" role="status"></p>
    </div>

    <div id="${idPrefix}children-no-field" class="field children-field" hidden>
      <label for="${idPrefix}childrenNo"></label>
      <input id="${idPrefix}childrenNo" name="childrenNo" type="number" inputmode="numeric" min="0" step="1" value="0" required disabled />
      <p id="${idPrefix}children-no-status" class="field-hint" role="status"></p>
    </div>

    <fieldset>
      <legend>Einkommen</legend>
      <div class="form-grid amount-grid">
        ${AMOUNT_FIELDS.slice(0, 2).map((field) => renderAmountField(field, idPrefix)).join('')}
      </div>
    </fieldset>

    <fieldset class="federal-income-settings">
      <legend>Bundessteuer</legend>
      <label class="checkbox-field" for="${idPrefix}useDifferentFederalIncome">
        <input id="${idPrefix}useDifferentFederalIncome" name="useDifferentFederalIncome" type="checkbox" />
        <span>Abweichende Einkommensbeträge für die Bundessteuer verwenden</span>
      </label>
      <p class="field-hint">Standardmässig gelten die oben erfassten Einkommensbeträge auch für die Bundessteuer.</p>
      <div id="${idPrefix}federal-income-fields" class="form-grid amount-grid" hidden>
        ${renderAmountField('federalTaxableIncome', idPrefix)}
        ${renderAmountField('federalAscertainedTaxableIncome', idPrefix)}
      </div>
    </fieldset>

    <fieldset>
      <legend>Vermögen</legend>
      <div class="form-grid amount-grid">
        ${AMOUNT_FIELDS.slice(2).map((field) => renderAmountField(field, idPrefix)).join('')}
      </div>
    </fieldset>

    <p class="storage-note">${storageNote}</p>`;
}

export type { InputField };
