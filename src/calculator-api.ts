export const CALCULATOR_METADATA_URL =
  'https://webcalc.services.zh.ch/ZH-Web-Calculators/calculators/INCOME_ASSETS';

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
