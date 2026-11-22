# Qualitätsanforderungen

## QUAL-001: Automatisierte Prüfung

Jede Änderung am Hauptbranch und jeder Pull Request werden durch GitHub Actions geprüft. Die Pipeline führt die Unit-Tests, die TypeScript-Typprüfung und den Produktions-Build aus.

## QUAL-002: Tests

Unit-Tests prüfen das eigene Verhalten der Anwendung. Die korrekte Berechnung kantonaler Steuern wird nicht durch eigene Testregeln nachgebaut. Sobald die API bekannt ist, werden deren Antworten in Tests durch kontrollierte Testdaten ersetzt; externe Systeme sind nicht Bestandteil der Unit-Tests.

## QUAL-003: Abhängigkeiten

Abhängigkeiten werden über `package.json` und die eingecheckte `package-lock.json` reproduzierbar installiert. Die Pipeline verwendet `npm ci`.

## QUAL-004: Veröffentlichung

Eine Veröffentlichung auf GitHub Pages erfolgt nur nach erfolgreicher Prüfung. Parallele Veröffentlichungen desselben Branches werden serialisiert; bereits laufende Veröffentlichungen werden nicht abgebrochen.
