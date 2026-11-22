export const BASIC_INPUTS_STORAGE_KEY = 'zh-tax-simulator:basic-inputs:v1';

export interface BasicInputValues {
  maritalStatus: string;
  taxYear: string;
  taxScale: string;
  religionP1: string;
  municipality: string;
  childrenNo: string;
  taxableIncome: string;
  ascertainedTaxableIncome: string;
  useDifferentFederalIncome: string;
  federalTaxableIncome: string;
  federalAscertainedTaxableIncome: string;
  taxableAssets: string;
  ascertainedTaxableAssets: string;
}

type StorageReader = Pick<Storage, 'getItem'>;
type StorageWriter = Pick<Storage, 'setItem'>;

const INPUT_KEYS = Object.keys({
  maritalStatus: '',
  taxYear: '',
  taxScale: '',
  religionP1: '',
  municipality: '',
  childrenNo: '0',
  taxableIncome: '',
  ascertainedTaxableIncome: '',
  useDifferentFederalIncome: 'false',
  federalTaxableIncome: '',
  federalAscertainedTaxableIncome: '',
  taxableAssets: '',
  ascertainedTaxableAssets: '',
} satisfies BasicInputValues) as (keyof BasicInputValues)[];

export function emptyBasicInputValues(currentYear: number): BasicInputValues {
  return {
    maritalStatus: '',
    taxYear: String(currentYear),
    taxScale: '',
    religionP1: '',
    municipality: '',
    childrenNo: '0',
    taxableIncome: '',
    ascertainedTaxableIncome: '',
    useDifferentFederalIncome: 'false',
    federalTaxableIncome: '',
    federalAscertainedTaxableIncome: '',
    taxableAssets: '',
    ascertainedTaxableAssets: '',
  };
}

export function loadBasicInputValues(
  storage: StorageReader | undefined,
  currentYear: number,
): BasicInputValues {
  const values = emptyBasicInputValues(currentYear);

  if (storage === undefined) {
    return values;
  }

  try {
    const serialized = storage.getItem(BASIC_INPUTS_STORAGE_KEY);

    if (serialized === null) {
      return values;
    }

    const saved: unknown = JSON.parse(serialized);

    if (typeof saved !== 'object' || saved === null) {
      return values;
    }

    for (const key of INPUT_KEYS) {
      const value = (saved as Record<string, unknown>)[key];

      if (typeof value === 'string') {
        values[key] = value;
      }
    }
  } catch {
    return values;
  }

  return values;
}

export function saveBasicInputValues(
  storage: StorageWriter | undefined,
  values: BasicInputValues,
): boolean {
  if (storage === undefined) {
    return false;
  }

  try {
    storage.setItem(BASIC_INPUTS_STORAGE_KEY, JSON.stringify(values));
    return true;
  } catch {
    return false;
  }
}

export function getBrowserStorage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}
