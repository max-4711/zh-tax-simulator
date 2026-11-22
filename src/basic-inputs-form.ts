import { AMOUNT_FIELDS, CHOICE_FIELDS, type InputField } from './input-fields';
import {
  fetchChildrenConfiguration,
  fetchSecondReligionConfiguration,
  readAmountConfiguration,
  readChoiceConfiguration,
  type ChildrenConfiguration,
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

export interface BasicInputsFormOptions {
  storage?: Storage | undefined;
  initialValues?: BasicInputValues;
  persist?: boolean;
  onCompleteChange?: (complete: boolean) => void;
}

export class BasicInputsForm {
  private readonly values: BasicInputValues;
  private readonly overridden = new Set<AscertainedField>();
  private readonly currentYear: number;
  private childrenConfiguration: ChildrenConfiguration | undefined;
  private childrenRequestNumber = 0;
  private secondReligionApplicable: boolean | undefined;
  private secondReligionRequestNumber = 0;

  constructor(
    private readonly form: HTMLFormElement,
    currentYear = new Date().getFullYear(),
    private readonly options: BasicInputsFormOptions = {},
  ) {
    this.currentYear = currentYear;
    this.values = {
      ...(options.initialValues ?? loadBasicInputValues(options.storage, currentYear)),
    };
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
    this.configureFederalIncome(metadata);

    for (const baseField of Object.keys(LINKED_AMOUNTS) as AmountField[]) {
      const { ascertained, hint } = LINKED_AMOUNTS[baseField];
      this.setLabel(ascertained, this.amountLabel(baseField));
      const input = this.getControl<HTMLInputElement>(ascertained);
      input.value = this.values[ascertained];
      input.disabled = false;
      this.setHint(ascertained, hint);
    }

    this.form.setAttribute('aria-busy', 'false');
    this.form.querySelector('[data-loading-status]')?.remove();
    this.save();
    this.notifyCompletionChange();
    void this.updateChildrenConfiguration();
    void this.updateSecondReligionConfiguration();
  }

  getValues(): BasicInputValues {
    return { ...this.values };
  }

  showLoadingError(): void {
    const status = this.form.querySelector<HTMLElement>('[data-loading-status]');

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

  private configureFederalIncome(metadata: CalculatorMetadata): void {
    const configuration = readAmountConfiguration(metadata, 'taxableIncome');
    const checkbox = this.getControl<HTMLInputElement>('useDifferentFederalIncome');
    checkbox.checked = this.values.useDifferentFederalIncome === 'true';

    for (const field of ['federalTaxableIncome', 'federalAscertainedTaxableIncome'] as const) {
      const input = this.getControl<HTMLInputElement>(field);
      this.setLabel(
        field,
        field === 'federalTaxableIncome'
          ? configuration.label
          : this.amountLabel('taxableIncome'),
      );
      input.min = '0';
      input.step = configuration.hasFractionDigits ? '0.01' : '1';
      input.max = configuration.maximum === null ? '' : String(configuration.maximum);
      input.value = this.values[field];
      this.setHint(
        field,
        field === 'federalAscertainedTaxableIncome'
          ? 'Entspricht dem steuerbaren Einkommen für die Bundessteuer.'
          : '',
      );
    }
    this.updateFederalIncomeVisibility();
  }

  private updateFederalIncomeVisibility(): void {
    const enabled = this.values.useDifferentFederalIncome === 'true';
    const fields = this.form.querySelector<HTMLElement>('.federal-income-settings .form-grid');
    if (fields === null) {
      throw new Error('Die Eingabefelder für das Bundes-Einkommen fehlen.');
    }
    fields.hidden = !enabled;
    this.getControl<HTMLInputElement>('federalTaxableIncome').disabled = !enabled;
    this.getControl<HTMLInputElement>('federalAscertainedTaxableIncome').disabled = true;
  }

  private amountLabel(field: AmountField): string {
    return field === 'taxableIncome'
      ? 'Satzbestimmendes Einkommen'
      : 'Satzbestimmendes Vermögen';
  }

  private bindEvents(): void {
    for (const field of [
      ...CHOICE_FIELDS,
      'religionP2',
      ...AMOUNT_FIELDS,
      'childrenNo',
      'federalTaxableIncome',
      'federalAscertainedTaxableIncome',
    ] as const) {
      this.getControl(field).addEventListener('input', () => {
        this.handleInput(field);
      });
    }
    this.getControl<HTMLInputElement>('useDifferentFederalIncome').addEventListener(
      'change',
      () => this.toggleFederalIncome(),
    );
  }

  private handleInput(field: InputField): void {
    this.values[field] = this.getControl(field).value;

    if (field === 'federalTaxableIncome') {
      this.values.federalAscertainedTaxableIncome = this.values.federalTaxableIncome;
      this.getControl<HTMLInputElement>('federalAscertainedTaxableIncome').value =
        this.values.federalAscertainedTaxableIncome;
    }

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
    if (field === 'taxYear' || field === 'taxScale') {
      void this.updateChildrenConfiguration();
    }
    if (field === 'taxYear' || field === 'maritalStatus') {
      void this.updateSecondReligionConfiguration();
    }
  }

  private toggleFederalIncome(): void {
    const enabled = this.getControl<HTMLInputElement>('useDifferentFederalIncome').checked;
    this.values.useDifferentFederalIncome = String(enabled);
    if (
      enabled &&
      this.values.federalTaxableIncome === '' &&
      this.values.federalAscertainedTaxableIncome === ''
    ) {
      this.values.federalTaxableIncome = this.values.taxableIncome;
      this.values.federalAscertainedTaxableIncome = this.values.ascertainedTaxableIncome;
      this.getControl<HTMLInputElement>('federalTaxableIncome').value =
        this.values.federalTaxableIncome;
      this.getControl<HTMLInputElement>('federalAscertainedTaxableIncome').value =
        this.values.federalAscertainedTaxableIncome;
    }
    this.getControl<HTMLInputElement>('federalTaxableIncome').value =
      this.values.federalTaxableIncome;
    this.getControl<HTMLInputElement>('federalAscertainedTaxableIncome').value =
      this.values.federalAscertainedTaxableIncome;
    this.updateFederalIncomeVisibility();
    this.save();
    this.notifyCompletionChange();
  }

  private async updateSecondReligionConfiguration(): Promise<void> {
    const requestNumber = ++this.secondReligionRequestNumber;
    const field = this.form.querySelector<HTMLElement>('.religion-p2-field');
    const select = this.getControl<HTMLSelectElement>('religionP2');
    const status = this.form.querySelector<HTMLElement>('.religion-p2-field .field-hint');
    if (field === null || status === null) {
      throw new Error('Das Auswahlfeld für Konfession Person 2 fehlt.');
    }

    this.secondReligionApplicable = undefined;
    field.hidden = false;
    select.disabled = true;
    status.textContent = 'Angaben zur Konfession werden geladen …';
    this.notifyCompletionChange();

    try {
      const configuration = await fetchSecondReligionConfiguration(
        this.values.taxYear,
        this.values.maritalStatus,
      );
      if (requestNumber !== this.secondReligionRequestNumber) {
        return;
      }
      this.secondReligionApplicable = configuration !== null;
      field.hidden = configuration === null;
      select.disabled = configuration === null;
      status.textContent = '';
      if (configuration !== null) {
        this.setLabel('religionP2', configuration.label);
        select.replaceChildren(new Option('Bitte wählen', ''));
        for (const option of configuration.options) {
          select.add(new Option(option.label, option.code));
        }
        if (!configuration.options.some((option) => option.code === this.values.religionP2)) {
          this.values.religionP2 = '';
          this.save();
        }
        select.value = this.values.religionP2;
      }
    } catch {
      if (requestNumber !== this.secondReligionRequestNumber) {
        return;
      }
      status.textContent =
        'Die Angaben zur Konfession konnten nicht geladen werden. Bitte Steuerjahr oder Zivilstand erneut auswählen.';
      status.dataset.state = 'error';
    }
    this.notifyCompletionChange();
  }

  private async updateChildrenConfiguration(): Promise<void> {
    const requestNumber = ++this.childrenRequestNumber;
    const field = this.form.querySelector<HTMLElement>('.children-field');
    const input = this.getControl<HTMLInputElement>('childrenNo');
    const status = this.form.querySelector<HTMLElement>('.children-field .field-hint');
    if (field === null || status === null) {
      throw new Error('Das Eingabefeld für die Kinderanzahl fehlt.');
    }

    this.childrenConfiguration = undefined;
    field.hidden = false;
    input.disabled = true;
    status.textContent = 'Angaben zur Bundessteuer werden geladen …';
    this.notifyCompletionChange();

    try {
      const configuration = await fetchChildrenConfiguration(
        this.values.taxYear,
        this.values.taxScale,
      );
      if (requestNumber !== this.childrenRequestNumber) {
        return;
      }
      this.childrenConfiguration = configuration;
      field.hidden = !configuration.applicable;
      input.disabled = !configuration.applicable;
      input.value = this.values.childrenNo;
      status.textContent = '';
      if (configuration.applicable) {
        this.setLabel('childrenNo', configuration.label);
        input.max = configuration.maximum === null ? '' : String(configuration.maximum);
      }
    } catch {
      if (requestNumber !== this.childrenRequestNumber) {
        return;
      }
      status.textContent =
        'Die Angaben zur Bundessteuer konnten nicht geladen werden. Bitte Steuerjahr oder Tarif erneut auswählen.';
      status.dataset.state = 'error';
    }
    this.notifyCompletionChange();
  }

  private notifyCompletionChange(): void {
    const controls = [...CHOICE_FIELDS, ...AMOUNT_FIELDS].map((field) => this.getControl(field));
    const childrenInput = this.getControl<HTMLInputElement>('childrenNo');
    const childrenComplete =
      this.childrenConfiguration !== undefined &&
      (!this.childrenConfiguration.applicable ||
        (!childrenInput.disabled && childrenInput.checkValidity()));
    const federalComplete =
      this.values.useDifferentFederalIncome !== 'true' ||
      (['federalTaxableIncome', 'federalAscertainedTaxableIncome'] as const).every((field) => {
        const input = this.getControl<HTMLInputElement>(field);
        return input.value.trim() !== '' && input.checkValidity();
      });
    const secondReligionInput = this.getControl<HTMLSelectElement>('religionP2');
    const secondReligionComplete =
      this.secondReligionApplicable !== undefined &&
      (!this.secondReligionApplicable ||
        (!secondReligionInput.disabled && secondReligionInput.checkValidity()));
    const complete =
      this.form.getAttribute('aria-busy') === 'false' &&
      secondReligionComplete &&
      childrenComplete &&
      federalComplete &&
      controls.every(
        (control) => !control.disabled && control.value.trim() !== '' && control.checkValidity(),
      );

    this.options.onCompleteChange?.(complete);
  }

  private save(): void {
    if (this.options.persist === false) {
      return;
    }

    const saved = saveBasicInputValues(this.options.storage, this.values);
    const status = this.form.querySelector<HTMLElement>('.storage-note');

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
    const element = this.form.querySelector<HTMLLabelElement>(`label[for="${this.getControl(field).id}"]`);

    if (element === null) {
      throw new Error(`Die Beschriftung für ${field} fehlt.`);
    }

    element.textContent = label;
  }

  private setHint(field: keyof BasicInputValues, hint: string): void {
    const element = this.form.querySelector<HTMLElement>(`[id="${this.getControl(field).id}-hint"]`);

    if (element !== null) {
      element.textContent = hint;
    }
  }
}
