# Zürcher Steuer-Szenariorechner

Eine schlanke, deutschsprachige Webanwendung für persönliche Steuer-Szenarien im Kanton Zürich. Die Steuerberechnung soll direkt im Browser über den offiziellen Rechner des Kantons erfolgen; die Anwendung enthält keine eigene Steuerberechnung und kein Backend.

Der aktuelle Stand erfasst die Grundangaben und speichert sie ausschließlich lokal im Browser. Die Auswahllisten werden vom offiziellen Rechner des Kantons geladen. Ein linksseitiges Menü führt zu den Basisangaben und – sobald alle Angaben gültig ausgefüllt sind – zur Basisrechnung. Die konkrete Berechnungsintegration folgt nach Bereitstellung der weiteren API-Details.

## Dokumentation

- [Anforderungen und offene Punkte](docs/requirements/README.md)
- [Hinweise für AI-Agents](AGENTS.md)
- [Lizenz](LICENSE)

## Technik

TypeScript, Vite und Vitest ohne UI-Framework. Der Produktions-Build enthält nur statische Dateien. Die Website wird für GitHub Pages unter `/zh-tax-simulator/` erzeugt.

## Entwicklung

Voraussetzung: Node.js 24 oder neuer und npm.

```sh
npm ci
npm run dev
```

Für eine Neuinstallation ohne vorhandene `package-lock.json` wird einmalig `npm install` verwendet. Die Entwicklungsseite wird standardmäßig unter `http://localhost:5173` angezeigt.

### Prüfungen

```sh
npm run test
npm run typecheck
npm run build
```

Der Build wird in `dist/` erzeugt und kann mit `npm run preview` lokal geprüft werden.

## Docker

Für den lokalen Betrieb wird das Image gebaut und der integrierte nginx-Webserver auf Port 8080 gestartet:

```sh
docker build -t zh-tax-simulator .
docker run --rm -p 8080:80 zh-tax-simulator
```

Anschließend ist die Anwendung unter `http://localhost:8080/zh-tax-simulator/` erreichbar. Der Container liefert ausschließlich statische Dateien aus.

Der Dockerfile unterstützt die Plattformen `linux/amd64` und `linux/arm64`. Ein ARM64-Image auf einem AMD64-Rechner kann beispielsweise mit Docker Buildx gebaut werden:

```sh
docker buildx build --platform linux/arm64 --load -t zh-tax-simulator:arm64 .
```

Zum Übertragen auf einen Raspberry Pi wird das Image exportiert beziehungsweise über eine Registry bereitgestellt. Eine Registry-Veröffentlichung ist noch nicht konfiguriert.

## GitHub Pages

Der Workflow [.github/workflows/ci-pages.yml](.github/workflows/ci-pages.yml) prüft Pushes und Pull Requests. Nach erfolgreicher Prüfung eines Pushes auf `main` wird die Website auf GitHub Pages veröffentlicht.

Im GitHub-Repository muss unter **Settings → Pages → Build and deployment** die Quelle **GitHub Actions** ausgewählt sein. Die veröffentlichte Adresse lautet `https://max-4711.github.io/zh-tax-simulator/`.
