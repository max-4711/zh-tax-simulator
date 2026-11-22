import { AMOUNT_FIELDS, CHOICE_FIELDS } from './app';
import {
  readAmountConfiguration,
  readChoiceConfiguration,
  type AmountField,
  type CalculatorMetadata,
} from './calculator-api';
import {
  loadBasicInputValues,
  saveBasicInputValues,
  type BasicInputValues,
} from './basic-inputs-store';
import { editAscertainedAmount, followBaseAmount } from './linked-amounts';

type AscertainedField = 'ascertainedTaxableIncome' | 'ascertainedTaxableAssets';

const LINKED_AMOUNTS: Record<
  AmountField,
  { ascertained: AscertainedField; hint: string }
> = {
  taxableIncome: {
    ascertained: 'ascertainedTaxableIncome',
    hint: 'Entspricht dem steuerbaren Einkommen, solange nichts anderes eingetragen wird.',
  },
  taxableAssets: {
    ascertained: 'ascertainedTaxableAssets',
    hint: 'Entspricht dem steuerbaren Vermögen, solange nichts anderes eingetragen wird.',
  },
};

export class BasicInputsForm {
  private readonly values: BasicInputValues;
  private readonly overridden = new Set<AscertainedField>();
  private readonly currentYear: number;

  constructor(
    private readonly form: HTMLFormElement,
    private readonly storage: Storage | undefined,
    currentYear = new Date().getFullYear(),
    private readonly onCompleteChange: (complete: boolean) => void = () => undefined,
  ) {
    this.currentYear = currentYear;
    this.values = loadBasicInputValues(storage, currentYear);
    this.bindEvents();

    for (const [base, { ascertained }] of Object.entries(LINKED_AMOUNTS)) {
      const linked = editAscertainedAmount(
        this.values[base as AmountField],
        this.values[ascertained],
      );

      if (linked.overridden) {
        this.overridden.add(ascertained);
      }
    }
  }

  applyMetadata(metadata: CalculatorMetadata): void {
    for (const field of CHOICE_FIELDS) {
      const configuration = readChoiceConfiguration(metadata, field);
      const select = this.getControl<HTMLSelectElement>(field);

      this.setLabel(field, configuration.label);
      select.replaceChildren(new Option('Bitte wählen', ''));

      for (const option of configuration.options) {
        select.add(new Option(option.label, option.code));
      }

      if (configuration.options.some((option) => option.code === this.values[field])) {
        select.value = this.values[field];
      } else {
        this.values[field] = field === 'taxYear' ? String(this.currentYear) : '';
        select.value = this.values[field];
      }

      select.disabled = false;
    }

    this.configureAmount(metadata, 'taxableIncome');
    this.configureAmount(metadata, 'taxableAssets');

    for (const baseField of Object.keys(LINKED_AMOUNTS) as AmountField[]) {
      const { ascertained, hint } = LINKED_AMOUNTS[baseField];
      this.setLabel(ascertained, this.amountLabel(baseField));
      const input = this.getControl<HTMLInputElement>(ascertained);
      input.value = this.values[ascertained];
      input.disabled = false;
      this.setHint(ascertained, hint);
    }

    this.form.setAttribute('aria-busy', 'false');
    this.form.querySelector('#loading-status')?.remove();
    this.save();
    this.notifyCompletionChange();
  }

  getValues(): BasicInputValues {
    return { ...this.values };
  }

  showLoadingError(): void {
    const status = this.form.querySelector<HTMLElement>('#loading-status');

    if (status !== null) {
      status.textContent =
        'Die Auswahlmöglichkeiten konnten nicht geladen werden. Bitte Seite neu laden und erneut versuchen.';
      status.dataset.state = 'error';
    }

    this.form.setAttribute('aria-busy', 'false');
  }

  private configureAmount(metadata: CalculatorMetadata, field: AmountField): void {
    const configuration = readAmountConfiguration(metadata, field);
    const input = this.getControl<HTMLInputElement>(field);

    this.setLabel(field, configuration.label);
    input.min = '0';
    input.step = configuration.hasFractionDigits ? '0.01' : '1';

    if (configuration.maximum !== null) {
      input.max = String(configuration.maximum);
    }

    this.setHint(field, configuration.hint ?? '');
    input.value = this.values[field];
    input.disabled = false;
  }

  private amountLabel(field: AmountField): string {
    return field === 'taxableIncome'
      ? 'Satzbestimmendes Einkommen'
      : 'Satzbestimmendes Vermögen';
  }

  private bindEvents(): void {
    for (const field of [...CHOICE_FIELDS, ...AMOUNT_FIELDS]) {
      this.getControl(field).addEventListener('input', () => {
        this.handleInput(field);
      });
    }
  }

  private handleInput(field: (typeof CHOICE_FIELDS)[number] | (typeof AMOUNT_FIELDS)[number]): void {
    this.values[field] = this.getControl(field).value;

    if (field === 'taxableIncome' || field === 'taxableAssets') {
      const { ascertained } = LINKED_AMOUNTS[field];
      const linked = followBaseAmount(
        this.values[field],
        this.values[ascertained],
        this.overridden.has(ascertained),
      );
      this.values[ascertained] = linked.value;
      this.getControl<HTMLInputElement>(ascertained).value = linked.value;
    } else if (
      field === 'ascertainedTaxableIncome' ||
      field === 'ascertainedTaxableAssets'
    ) {
      const base = field === 'ascertainedTaxableIncome' ? 'taxableIncome' : 'taxableAssets';
      const linked = editAscertainedAmount(this.values[base], this.values[field]);
      this.values[field] = linked.value;

      if (linked.overridden) {
        this.overridden.add(field);
      } else {
        this.overridden.delete(field);
      }
    }

    this.save();
    this.notifyCompletionChange();
  }

  private notifyCompletionChange(): void {
    const controls = [...CHOICE_FIELDS, ...AMOUNT_FIELDS].map((field) => this.getControl(field));
    const complete =
      this.form.getAttribute('aria-busy') === 'false' &&
      controls.every(
        (control) => !control.disabled && control.value.trim() !== '' && control.checkValidity(),
      );

    this.onCompleteChange(complete);
  }

  private save(): void {
    const saved = saveBasicInputValues(this.storage, this.values);
    const status = this.form.querySelector<HTMLElement>('#storage-status');

    if (status !== null) {
      status.textContent = saved
        ? 'Änderungen werden automatisch nur in diesem Browser gespeichert.'
        : 'Dieser Browser erlaubt kein lokales Speichern. Die Eingaben gelten nur für diese Sitzung.';
    }
  }

  private getControl<T extends HTMLInputElement | HTMLSelectElement>(
    field: keyof BasicInputValues,
  ): T {
    const control = this.form.elements.namedItem(field);

    if (!(control instanceof HTMLInputElement || control instanceof HTMLSelectElement)) {
      throw new Error(`Das Eingabefeld ${field} fehlt.`);
    }

    return control as T;
  }

  private setLabel(field: keyof BasicInputValues, label: string): void {
    const element = this.form.querySelector<HTMLLabelElement>(`label[for="${field}"]`);

    if (element === null) {
      throw new Error(`Die Beschriftung für ${field} fehlt.`);
    }

    element.textContent = label;
  }

  private setHint(field: keyof BasicInputValues, hint: string): void {
    const element = this.form.querySelector<HTMLElement>(`#${field}-hint`);

    if (element !== null) {
      element.textContent = hint;
    }
  }
}
