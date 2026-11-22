# Architekturanforderungen

## ARCH-001: Client-seitige Anwendung

Sämtliche Anwendungslogik wird client-seitig im Browser ausgeführt. Es wird kein eigener Anwendungs-Backend-Dienst benötigt.

## ARCH-002: Statische Auslieferung

Die Anwendung wird als statische HTML-, CSS- und JavaScript-Dateien gebaut. Ein Webserver dient ausschließlich der Auslieferung dieser Dateien.

## ARCH-003: Technischer Stack

Der technische Stack ist TypeScript mit Vite. Die Benutzeroberfläche verwendet HTML und CSS ohne zusätzliches UI-Framework. Vitest wird für Unit-Tests verwendet. Die Wahl berücksichtigt einen verbreiteten Stack, geringe Komplexität und eine kleine statische Anwendung.

## ARCH-004: Lokale Speicherung ohne Benutzerverwaltung

Es gibt keine serverseitige Datenpersistenz, kein Benutzerkonto und keine Benutzerverwaltung. Die Grundangaben werden ausschließlich im Local Storage des jeweiligen Browsers gespeichert und bei jeder Eingabeänderung aktualisiert. Beim erneuten Besuch werden gespeicherte Werte in den Eingabefeldern wiederhergestellt. Ungültige oder nicht mehr angebotene Auswahlen werden nicht übernommen; beschädigte Speicherinhalte werden ignoriert. Bei nicht verfügbarem Local Storage bleibt die Erfassung für die laufende Sitzung nutzbar und die fehlende dauerhafte Speicherung wird angezeigt.

## ARCH-005: Quellcode-Struktur

Anwendungscode und seine Tests liegen unter `src/`. Statische, nicht verarbeitete Dateien liegen unter `public/`. Die verbindlichen Anforderungen liegen unter `docs/requirements/`.
