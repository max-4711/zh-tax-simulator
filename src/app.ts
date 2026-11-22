export function renderApp(): string {
  return `
    <header class="site-header">
      <a class="wordmark" href="./" aria-label="Steuer-Szenarien – Startseite">
        <span class="wordmark-icon" aria-hidden="true">ZH</span>
        <span>Steuer-Szenarien</span>
      </a>
      <span class="location">Kanton Zürich</span>
    </header>

    <main>
      <section class="intro" aria-labelledby="page-title">
        <p class="eyebrow">Klarheit für Ihre Planung</p>
        <h1 id="page-title">Steuern im Kanton Zürich.<br /><span>Im Szenario betrachtet.</span></h1>
        <p class="intro-text">
          Ein schlanker Rechner für Ihre Steuer-Szenarien – auf Grundlage der
          offiziellen Berechnung des Kantons Zürich.
        </p>
      </section>

      <section class="status-card" aria-labelledby="status-title">
        <div class="status-heading">
          <span class="status-icon" aria-hidden="true">i</span>
          <div>
            <p class="section-label">Projektstatus</p>
            <h2 id="status-title">Die Grundlage ist geschaffen.</h2>
          </div>
        </div>
        <p>
          Die technische Infrastruktur ist bereit. Sobald die Details der offiziellen
          Schnittstelle vorliegen, werden hier die Eingabemöglichkeiten für Ihre
          Szenarien ergänzt.
        </p>
        <div class="principles">
          <div>
            <span class="principle-number">01</span>
            <h3>Offizielle Berechnung</h3>
            <p>Keine eigene Steuerlogik. Die Berechnung kommt vom Kanton Zürich.</p>
          </div>
          <div>
            <span class="principle-number">02</span>
            <h3>Direkt in Ihrem Browser</h3>
            <p>Kein Benutzerkonto und keine Speicherung Ihrer Steuerdaten.</p>
          </div>
        </div>
      </section>
    </main>

    <footer>
      <p>Keine Steuerberatung. Keine rechtsverbindliche Steuerveranlagung.</p>
    </footer>
  `;
}
