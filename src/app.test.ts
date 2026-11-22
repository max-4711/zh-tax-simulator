import { describe, expect, it } from 'vitest';
import { renderApp } from './app';

describe('renderApp', () => {
  it('zeigt die persönliche Erfassung der Grundangaben', () => {
    const page = renderApp();

    expect(page).toContain('<h1 id="page-title" tabindex="-1">Basisangaben</h1>');
    expect(page).toContain('<form id="basic-inputs"');
    expect(page).toContain('Persönliches Steuer-Notiztool');
    expect(page).not.toContain('Projektstatus');
    expect(page).not.toContain('wordmark-icon');
  });

  it('enthält die Navigation mit gesperrter Basisrechnung und einen dezenten Vollständigkeitshinweis', () => {
    const page = renderApp();

    expect(page).toContain('Basisszenario');
    expect(page).toContain('data-page-target="basisangaben"');
    expect(page).toContain('data-page-target="basisrechnung"');
    expect(page).toContain('id="basisrechnung-page"');
    expect(page).toContain('id="completion-notification"');
    expect(page).toContain('Basisangaben vollständig');
    expect(page).toMatch(/id="basisrechnung-navigation"[\s\S]*?disabled/);
  });

  it('enthält den interaktiven, nicht gespeicherten 1:1 Vergleich in der Navigation', () => {
    const page = renderApp();

    expect(page).toContain('Vergleichsszenarien');
    expect(page).toContain('data-page-target="vergleich-1-zu-1"');
    expect(page).toContain('id="comparison-inputs"');
    expect(page).toContain('id="comparison-calculation-results"');
    expect(page).toContain('Diese Eingaben werden nicht gespeichert.');
  });

  it.each([
    'maritalStatus',
    'taxYear',
    'taxScale',
    'religionP1',
    'municipality',
    'childrenNo',
    'taxableIncome',
    'ascertainedTaxableIncome',
    'useDifferentFederalIncome',
    'federalTaxableIncome',
    'federalAscertainedTaxableIncome',
    'taxableAssets',
    'ascertainedTaxableAssets',
  ])('enthält das Pflichtfeld %s', (field) => {
    expect(renderApp()).toContain(`name="${field}"`);
  });
});
