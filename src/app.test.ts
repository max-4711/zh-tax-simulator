import { describe, expect, it } from 'vitest';
import { renderApp } from './app';

describe('renderApp', () => {
  it('zeigt die persönliche Erfassung der Grundangaben', () => {
    const page = renderApp();

    expect(page).toContain('<h1 id="page-title">Meine Steuerdaten</h1>');
    expect(page).toContain('<form id="basic-inputs"');
    expect(page).toContain('Persönliches Steuer-Notiztool');
    expect(page).not.toContain('Projektstatus');
    expect(page).not.toContain('wordmark-icon');
  });

  it.each([
    'maritalStatus',
    'taxYear',
    'taxScale',
    'religionP1',
    'municipality',
    'taxableIncome',
    'ascertainedTaxableIncome',
    'taxableAssets',
    'ascertainedTaxableAssets',
  ])('enthält das Pflichtfeld %s', (field) => {
    expect(renderApp()).toContain(`name="${field}"`);
  });
});
