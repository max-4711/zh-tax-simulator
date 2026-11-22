export interface LinkedAmount {
  value: string;
  overridden: boolean;
}

export function followBaseAmount(
  baseValue: string,
  ascertainedValue: string,
  overridden: boolean,
): LinkedAmount {
  return overridden
    ? { value: ascertainedValue, overridden: true }
    : { value: baseValue, overridden: false };
}

export function editAscertainedAmount(
  baseValue: string,
  ascertainedValue: string,
): LinkedAmount {
  return {
    value: ascertainedValue,
    overridden: ascertainedValue !== baseValue,
  };
}
