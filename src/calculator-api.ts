export const CALCULATOR_METADATA_URL =
  'https://webcalc.services.zh.ch/ZH-Web-Calculators/calculators/INCOME_ASSETS';
export const CALCULATOR_CALCULATION_URL = `${CALCULATOR_METADATA_URL}/calculate`;

export interface CalculatorOption {
  code: string;
  label: string;
}

export interface ChoiceConfiguration {
  label: string;
  options: CalculatorOption[];
}

export interface AmountConfiguration {
  label: string;
  hint: string | null;
  maximum: number | null;
  hasFractionDigits: boolean;
}

export type ChoiceField =
  | 'maritalStatus'
  | 'taxYear'
  | 'taxScale'
  | 'religionP1'
  | 'municipality';

export type AmountField = 'taxableIncome' | 'taxableAssets';

export type CalculatorMetadata = Record<string, unknown>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function readChoiceConfiguration(
  metadata: CalculatorMetadata,
  field: ChoiceField,
): ChoiceConfiguration {
  const configuration = metadata[field];

  if (
    !isRecord(configuration) ||
    typeof configuration.label !== 'string' ||
    !Array.isArray(configuration.options)
  ) {
    throw new Error(`Die Angaben für ${field} fehlen oder sind ungültig.`);
  }

  const options = configuration.options.flatMap((option): CalculatorOption[] => {
    if (
      !isRecord(option) ||
      typeof option.code !== 'string' ||
      typeof option.value !== 'string' ||
      option.value.trim().toLocaleLowerCase('de') === 'bitte wählen'
    ) {
      return [];
    }

    return [{ code: option.code, label: option.value }];
  });

  if (options.length === 0) {
    throw new Error(`Die Auswahlmöglichkeiten für ${field} fehlen.`);
  }

  return { label: configuration.label, options };
}

export function readAmountConfiguration(
  metadata: CalculatorMetadata,
  field: AmountField,
): AmountConfiguration {
  const configuration = metadata[field];

  if (!isRecord(configuration) || typeof configuration.label !== 'string') {
    throw new Error(`Die Angaben für ${field} fehlen oder sind ungültig.`);
  }

  const maximum = configuration.maxSize;

  return {
    label: configuration.label,
    hint: typeof configuration.hint === 'string' ? configuration.hint : null,
    maximum:
      typeof maximum === 'number' && Number.isFinite(maximum) && maximum >= 0
        ? maximum
        : null,
    hasFractionDigits: configuration.hasFractionDigits === true,
  };
}

export interface TaxValue {
  label: string;
  value: number | string;
  currency?: string;
  symbol?: string;
}

export const TAX_RESULT_FIELDS = [
  'ascertainedTaxableIncome',
  'incomeTaxRate',
  'taxableIncome',
  'incomeTax',
  'ascertainedTaxableAssets',
  'assetsTaxRate',
  'taxableAssets',
  'assetsTax',
  'cantonalSimpleTax',
  'cantonalBaseTaxRate',
  'cantonalBaseTax',
  'municipalityTaxRate',
  'municipalityTax',
  'religionTaxRateP1',
  'religionTaxP1',
  'personalTaxRate',
  'personalTax',
  'totalCantonalTax',
] as const;

export type TaxCalculationResult = Record<(typeof TAX_RESULT_FIELDS)[number], TaxValue>;

function readTaxValue(value: unknown, field: string): TaxValue {
  if (
    !isRecord(value) ||
    typeof value.label !== 'string' ||
    (typeof value.value !== 'number' && typeof value.value !== 'string') ||
    (typeof value.value === 'number' && !Number.isFinite(value.value))
  ) {
    throw new Error(`Das Berechnungsergebnis ${field} fehlt oder ist ungültig.`);
  }

  const result: TaxValue = { label: value.label, value: value.value };
  if (typeof value.currency === 'string') {
    result.currency = value.currency;
  }
  if (typeof value.symbol === 'string') {
    result.symbol = value.symbol;
  }
  return result;
}

export function readTaxCalculationResult(response: unknown): TaxCalculationResult {
  if (!isRecord(response)) {
    throw new Error('Die Antwort des Steuerrechners ist ungültig.');
  }

  const result = {} as TaxCalculationResult;
  for (const field of TAX_RESULT_FIELDS) {
    result[field] = readTaxValue(response[field], field);
  }
  return result;
}

export async function calculateTaxes(
  values: import('./basic-inputs-store').BasicInputValues,
): Promise<TaxCalculationResult> {
  const payload = {
    taxYear: values.taxYear,
    maritalStatus: values.maritalStatus,
    taxScale: values.taxScale,
    religionP1: values.religionP1,
    municipality: values.municipality,
    taxableIncome: Number(values.taxableIncome),
    ascertainedTaxableIncome: Number(values.ascertainedTaxableIncome),
    taxableAssets: Number(values.taxableAssets),
    ascertainedTaxableAssets: Number(values.ascertainedTaxableAssets),
  };
  const response = await fetch(CALCULATOR_CALCULATION_URL, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Der Steuerrechner antwortet mit Status ${response.status}.`);
  }

  return readTaxCalculationResult(await response.json());
}

export async function fetchCalculatorMetadata(): Promise<CalculatorMetadata> {
  const response = await fetch(CALCULATOR_METADATA_URL, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Der Steuerrechner antwortet mit Status ${response.status}.`);
  }

  const metadata: unknown = await response.json();

  if (!isRecord(metadata)) {
    throw new Error('Die Antwort des Steuerrechners ist ungültig.');
  }

  return metadata;
}
