# Architekturanforderungen

## ARCH-001: Client-seitige Anwendung

Sämtliche Anwendungslogik wird client-seitig im Browser ausgeführt. Es wird kein eigener Anwendungs-Backend-Dienst benötigt.

## ARCH-002: Statische Auslieferung

Die Anwendung wird als statische HTML-, CSS- und JavaScript-Dateien gebaut. Ein Webserver dient ausschließlich der Auslieferung dieser Dateien.

## ARCH-003: Technischer Stack

Der technische Stack ist TypeScript mit Vite. Die Benutzeroberfläche verwendet HTML und CSS ohne zusätzliches UI-Framework. Vitest wird für Unit-Tests verwendet. Die Wahl berücksichtigt einen verbreiteten Stack, geringe Komplexität und eine kleine statische Anwendung.

## ARCH-004: Keine Persistenz oder Benutzerverwaltung

Es gibt keine serverseitige Datenpersistenz, kein Benutzerkonto und keine Benutzerverwaltung. Bis zu einer abweichenden Anforderung speichert die Anwendung keine Steuerdaten dauerhaft im Browser.

## ARCH-005: Quellcode-Struktur

Anwendungscode und seine Tests liegen unter `src/`. Statische, nicht verarbeitete Dateien liegen unter `public/`. Die verbindlichen Anforderungen liegen unter `docs/requirements/`.
