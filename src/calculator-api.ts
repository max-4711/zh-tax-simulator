export const CALCULATOR_METADATA_URL =
  'https://webcalc.services.zh.ch/ZH-Web-Calculators/calculators/INCOME_ASSETS';
export const CALCULATOR_CALCULATION_URL = `${CALCULATOR_METADATA_URL}/calculate`;
export const FEDERAL_METADATA_URL =
  'https://webcalc.services.zh.ch/ZH-Web-Calculators/calculators/FEDERAL';
export const FEDERAL_CALCULATION_URL = `${FEDERAL_METADATA_URL}/calculate`;

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

export interface ChildrenConfiguration {
  applicable: boolean;
  label: string;
  maximum: number | null;
}

export function readChildrenConfiguration(metadata: unknown): ChildrenConfiguration {
  if (!isRecord(metadata)) {
    throw new Error('Die Antwort des Bundessteuerrechners ist ungültig.');
  }
  if (metadata.childrenNo === null) {
    return { applicable: false, label: '', maximum: null };
  }
  const configuration = metadata.childrenNo;
  if (!isRecord(configuration) || typeof configuration.label !== 'string') {
    throw new Error('Die Angaben zur Kinderanzahl fehlen oder sind ungültig.');
  }
  return {
    applicable: true,
    label: configuration.label,
    maximum:
      typeof configuration.maxSize === 'number' && configuration.maxSize >= 0
        ? configuration.maxSize
        : null,
  };
}

export async function fetchChildrenConfiguration(
  taxYear: string,
  taxScale: string,
): Promise<ChildrenConfiguration> {
  const response = await fetch(FEDERAL_METADATA_URL, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ taxYear, taxScale }),
  });
  if (!response.ok) {
    throw new Error(`Der Bundessteuerrechner antwortet mit Status ${response.status}.`);
  }
  return readChildrenConfiguration(await response.json());
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
  result.incomeTax.label = 'Einkommenssteuer';
  result.assetsTax.label = 'Vermögenssteuer';
  return result;
}

function numericValue(field: TaxValue): number {
  if (typeof field.value !== 'number') {
    throw new Error(`Der Steuerwert ${field.label} ist keine Zahl.`);
  }
  return field.value;
}

function roundedTax(base: number, rate: number, divisor: number, increment: number): number {
  const units = Math.floor((base * rate) / divisor / increment + 1e-9);
  return Math.round(units * increment * 100) / 100;
}

function correctedAmount(field: TaxValue, value: number): TaxValue {
  return { ...field, value };
}

export function correctCantonalTaxResult(
  result: TaxCalculationResult,
  taxableIncome: number,
  taxableAssets: number,
): TaxCalculationResult {
  const incomeTax = roundedTax(taxableIncome, numericValue(result.incomeTaxRate), 100, 1);
  const assetsTax = roundedTax(taxableAssets, numericValue(result.assetsTaxRate), 1000, 1);
  const simpleTax = incomeTax + assetsTax;
  const cantonalBaseTax = roundedTax(
    simpleTax,
    numericValue(result.cantonalBaseTaxRate),
    100,
    0.05,
  );
  const municipalityTax = roundedTax(
    simpleTax,
    numericValue(result.municipalityTaxRate),
    100,
    0.05,
  );
  const religionTax = roundedTax(
    simpleTax,
    numericValue(result.religionTaxRateP1),
    100,
    0.05,
  );
  const personalTax = numericValue(result.personalTax);

  return {
    ...result,
    ascertainedTaxableIncome: result.ascertainedTaxableIncome,
    taxableIncome: correctedAmount(result.taxableIncome, taxableIncome),
    incomeTax: correctedAmount(result.incomeTax, incomeTax),
    taxableAssets: correctedAmount(result.taxableAssets, taxableAssets),
    assetsTax: correctedAmount(result.assetsTax, assetsTax),
    cantonalSimpleTax: correctedAmount(result.cantonalSimpleTax, simpleTax),
    cantonalBaseTax: correctedAmount(result.cantonalBaseTax, cantonalBaseTax),
    municipalityTax: correctedAmount(result.municipalityTax, municipalityTax),
    religionTaxP1: correctedAmount(result.religionTaxP1, religionTax),
    totalCantonalTax: correctedAmount(
      result.totalCantonalTax,
      cantonalBaseTax + municipalityTax + religionTax + personalTax,
    ),
  };
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
    taxableIncome: Number(values.ascertainedTaxableIncome),
    taxableAssets: Number(values.ascertainedTaxableAssets),
  };
  const response = await fetch(CALCULATOR_CALCULATION_URL, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Der Steuerrechner antwortet mit Status ${response.status}.`);
  }

  return correctCantonalTaxResult(
    readTaxCalculationResult(await response.json()),
    Number(values.taxableIncome),
    Number(values.taxableAssets),
  );
}

export interface FederalTaxCalculationResult {
  taxableAscertainedFederalIncome: TaxValue;
  taxableFederalIncome: TaxValue;
  federalTaxRate: TaxValue;
  totalFederalTax: TaxValue;
  childrenDeduction: TaxValue | null;
  totalAfterChildrenDeduction: TaxValue;
}

export function readFederalTaxCalculationResult(
  response: unknown,
): FederalTaxCalculationResult {
  if (!isRecord(response)) {
    throw new Error('Die Antwort des Bundessteuerrechners ist ungültig.');
  }
  return {
    taxableAscertainedFederalIncome: readTaxValue(
      response.taxableFederalIncome,
      'taxableFederalIncome',
    ),
    taxableFederalIncome: readTaxValue(
      response.taxableFederalIncome,
      'taxableFederalIncome',
    ),
    federalTaxRate: readTaxValue(response.federalTaxRate, 'federalTaxRate'),
    totalFederalTax: readTaxValue(response.totalFederalTax, 'totalFederalTax'),
    childrenDeduction:
      response.childrenDeduction === null
        ? null
        : readTaxValue(response.childrenDeduction, 'childrenDeduction'),
    totalAfterChildrenDeduction: readTaxValue(
      response.totalAfterChildrenDeduction,
      'totalAfterChildrenDeduction',
    ),
  };
}

export function federalTaxScale(taxScale: string): string {
  if (taxScale === 'BASIC') {
    return 'SINGLE';
  }
  if (taxScale === 'MARRIED_OR_SINGLE_PARENT') {
    return taxScale;
  }
  throw new Error(`Der Tarif ${taxScale} wird vom Bundessteuerrechner nicht unterstützt.`);
}

export function correctFederalTaxResult(
  result: FederalTaxCalculationResult,
  taxableIncome: number,
): FederalTaxCalculationResult {
  const totalFederalTax = roundedTax(
    taxableIncome,
    numericValue(result.federalTaxRate),
    100,
    0.05,
  );
  const deduction =
    result.childrenDeduction === null ? 0 : numericValue(result.childrenDeduction);
  return {
    ...result,
    taxableFederalIncome: correctedAmount(result.taxableFederalIncome, taxableIncome),
    totalFederalTax: correctedAmount(result.totalFederalTax, totalFederalTax),
    totalAfterChildrenDeduction: correctedAmount(
      result.totalAfterChildrenDeduction,
      Math.round((totalFederalTax - deduction) * 100) / 100,
    ),
  };
}

export async function calculateFederalTaxes(
  values: import('./basic-inputs-store').BasicInputValues,
): Promise<FederalTaxCalculationResult> {
  const taxableIncome = Number(
    values.useDifferentFederalIncome === 'true'
      ? values.federalTaxableIncome
      : values.taxableIncome,
  );
  const ascertainedTaxableIncome = Number(
    values.useDifferentFederalIncome === 'true'
      ? values.federalAscertainedTaxableIncome
      : values.ascertainedTaxableIncome,
  );
  const response = await fetch(FEDERAL_CALCULATION_URL, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      taxYear: values.taxYear,
      taxScale: federalTaxScale(values.taxScale),
      childrenNo: values.childrenNo,
      taxableIncome: ascertainedTaxableIncome,
    }),
  });
  if (!response.ok) {
    throw new Error(`Der Bundessteuerrechner antwortet mit Status ${response.status}.`);
  }
  return correctFederalTaxResult(
    readFederalTaxCalculationResult(await response.json()),
    taxableIncome,
  );
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
