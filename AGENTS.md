# Hinweise für AI-Agents

## Verbindliche Quellen

- Anforderungen und offene fachliche Entscheidungen: [docs/requirements/](docs/requirements/README.md).
- Projektüberblick, Entwicklung und Deployment: [README.md](README.md).
- Abhängigkeiten und ausführbare Skripte: [package.json](package.json).

## Arbeitsweise

Vor einer Änderung die einschlägigen Anforderungen lesen und auf Konflikte prüfen. Anforderungen in ihrer verbindlichen Quelle aktualisieren, nicht an anderen Stellen duplizieren. Unklare fachliche Entscheidungen beim Benutzer erfragen, statt sie anzunehmen.

Die Anwendung bleibt eine rein statische Client-Anwendung. Keine eigene Steuerberechnung implementieren und keine API-Details erfinden; die verfügbaren Informationen zur offiziellen Schnittstelle stehen in den Anforderungen.

Nach Änderungen am Anwendungscode die in der README beschriebenen Prüfungen ausführen. Änderungen an dieser Datei nur vornehmen, wenn neue, nicht anderweitig dokumentierte Agent-Hinweise erforderlich sind.
