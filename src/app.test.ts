import { describe, expect, it } from 'vitest';
import { renderApp } from './app';

describe('renderApp', () => {
  it('zeigt die deutschsprachige Einstiegsseite mit Hauptbereich', () => {
    const page = renderApp();

    expect(page).toContain('<main>');
    expect(page).toContain('<h1 id="page-title">Steuern im Kanton Zürich.');
    expect(page).toContain('Kanton Zürich');
  });

  it('kennzeichnet die Berechnung als noch nicht verfügbar', () => {
    const page = renderApp();

    expect(page).toContain('Die Grundlage ist geschaffen.');
    expect(page).toContain('Sobald die Details der offiziellen');
    expect(page).not.toContain('<form');
  });
});
