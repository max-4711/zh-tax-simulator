# Produktanforderungen

## PROD-001: Zweck

Die Anwendung ist ein Szenariorechner für Steuern im Kanton Zürich in der Schweiz. Sie ermöglicht die Nutzung der offiziellen Steuerberechnung des Kantons über eine schlanke Weboberfläche.

## PROD-002: Sprache

Alle für Benutzer sichtbaren Texte und Angaben sind auf Deutsch zu formulieren. Spracheinstellungen oder weitere Übersetzungen sind nicht erforderlich.

## PROD-003: Anwendungsform

Die Anwendung ist eine im Webbrowser nutzbare, persönliche Hilfsanwendung ohne behördlichen oder sonstigen offiziellen Auftritt. Die schlichte, deutschsprachige Einstiegsseite enthält die Erfassung der Grundangaben für spätere Szenarien sowie eine Basisrechnung und einen interaktiven 1:1 Vergleich.

## PROD-005: Grundangaben

Die Benutzer erfassen Zivilstand, Steuerjahr, Tarif, Konfession, Gemeinde, steuerbares Einkommen, satzbestimmendes Einkommen, steuerbares Vermögen und satzbestimmendes Vermögen. Für die Bundessteuer wird zusätzlich die Anzahl eigener Kinder im gleichen Haushalt erfasst, sofern der gewählte Tarif dies vorsieht; der Wert ist standardmässig 0. Optional können abweichende steuerbare und satzbestimmende Einkommensbeträge für die Bundessteuer erfasst werden. Standardmässig gelten die gemeinsamen Einkommensbeträge. Beim Aktivieren werden diese zunächst in die Bundessteuerfelder übernommen; beim Deaktivieren bleiben die abweichenden Werte für eine spätere erneute Aktivierung gespeichert. Alle sichtbaren Angaben sind für spätere Berechnungen erforderlich. Auswahlfelder und Betragsangaben verwenden die Bezeichnungen beziehungsweise Vorgaben der offiziellen Schnittstelle; für Einkommen und Vermögen steht keine Auswahl zur Verfügung.

Zivilstand, Tarif, Konfession und Gemeinde haben keinen vorbelegten Wert. Das Steuerjahr wird bei erstmaliger Nutzung auf das aktuelle Kalenderjahr gesetzt, sofern dieses vom Rechner unterstützt wird. Die satzbestimmenden Beträge entsprechen zunächst den jeweiligen steuerbaren Beträgen. Bei einer Änderung des steuerbaren Betrags folgt der satzbestimmende Betrag, solange keine abweichende Eingabe dafür erfolgt ist. Nach einer abweichenden Eingabe bleibt der eigene Wert erhalten; eine erneute Gleichsetzung stellt die Verknüpfung wieder her.

## PROD-006: Navigation und Freischaltung

Die zentrale Navigation ist ein anfangs geöffnetes, linksseitiges Menü. Unter „Basisszenario“ führt „Basisangaben“ zum Formular gemäss PROD-005 und „Basisrechnung“ zur Berechnungsseite. „Basisangaben“ ist die Startseite. Die Basisrechnung bleibt gesperrt, bis alle Basisangaben gültig ausgefüllt sind; die Freischaltung erfolgt ohne Bestätigungsschaltfläche. Beim erstmaligen Erreichen der Vollständigkeit erscheint ein dezenter, schliessbarer Hinweis, über den direkt zur Basisrechnung gewechselt werden kann. Nach dem Verlassen des Formulars wird der Hinweis ausgeblendet. Das Menü bietet Platz für weitere Szenarien. Unter dem eigenen Hauptmenüpunkt „Vergleichsszenarien“ führt „1:1 Vergleich“ direkt zu Eingaben und Ergebnissen auf derselben Seite.

## PROD-007: 1:1 Vergleich

Das Vergleichsszenario wird mit einer Kopie der aktuellen Basisangaben initialisiert und bietet dieselben Eingabefelder und Verknüpfungen wie das Basisszenario. Seine Eingaben dienen dem Ausprobieren und werden nicht gespeichert. Nach gültigen Änderungen werden die Ergebnisse ohne zusätzlichen Navigations- oder Bestätigungsschritt aktualisiert.

Die Ergebnisse des Basisszenarios und des Vergleichsszenarios werden gegenübergestellt. Das Gesamttotal ist visuell hervorgehoben; auch Zwischenergebnisse, Steuerbeträge und Steuersätze werden verglichen. Jede numerische Position zeigt die absolute Differenz „Vergleich minus Basis“ und die relative Veränderung gegenüber dem Basiswert. Bei einem Basiswert von 0 oder nicht numerischen Werten wird keine Prozentangabe dargestellt.

## PROD-004: Fachliche Grenzen

Die Anwendung ersetzt keine Steuerberatung oder rechtsverbindliche Steuerveranlagung. Maßgeblich für Berechnungsergebnisse ist die offizielle Schnittstelle des Kantons Zürich.
