import { describe, expect, it } from 'vitest';
import { editAscertainedAmount, followBaseAmount } from './linked-amounts';

describe('verknüpfte Beträge', () => {
  it('übernimmt einen geänderten Grundbetrag ohne eigene Eingabe', () => {
    expect(followBaseAmount('60000', '50000', false)).toEqual({
      value: '60000',
      overridden: false,
    });
  });

  it('behält einen abweichenden satzbestimmenden Betrag', () => {
    expect(followBaseAmount('60000', '40000', true)).toEqual({
      value: '40000',
      overridden: true,
    });
  });

  it('erkennt eigenständige und wieder angeglichene Beträge', () => {
    expect(editAscertainedAmount('50000', '45000').overridden).toBe(true);
    expect(editAscertainedAmount('50000', '50000').overridden).toBe(false);
  });
});
