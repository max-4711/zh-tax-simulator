# Anforderungen an die Steuerberechnung

## CALC-001: Offizielle Datenquelle

Steuerberechnungen werden vom offiziellen Steuerrechner des Kantons Zürich bezogen. Die Anwendung implementiert keine eigene Nachbildung der kantonalen Steuerberechnungslogik.

## CALC-002: Eigene Logik

Eigene Fachlogik ist auf das für die Szenariobedienung, die Anfrage und die Darstellung der Ergebnisse notwendige Minimum zu beschränken. Abweichungen zwischen einer eigenen Darstellung und der offiziellen Berechnung sind nicht zulässig.

## CALC-003: Schnittstellenintegration

Die Schnittstelle wird direkt aus dem Browser ohne Authentifizierung aufgerufen. Der Betreiber stellt den CORS-Header `access-control-allow-origin: *` bereit.

Für die Grundangaben liefert `GET https://webcalc.services.zh.ch/ZH-Web-Calculators/calculators/INCOME_ASSETS` die Konfiguration des Rechners. Die Anwendung liest die Auswahllisten aus `maritalStatus`, `taxYear`, `taxScale`, `religionP1` und `municipality` sowie die Bezeichnungen, Hinweise und Betragsvorgaben aus `taxableIncome` und `taxableAssets`. Platzhalter mit dem Text «Bitte wählen» sind keine auswählbaren Werte. Während des Ladens sind die Auswahlfelder deaktiviert. Bei einem Abruffehler wird eine verständliche Fehlermeldung angezeigt; die Anwendung verwendet keine erfundenen Ersatzlisten.

## CALC-004: Basisrechnung

Beim Öffnen der Basisrechnung wird mit den vollständigen gespeicherten Basisangaben automatisch `POST https://webcalc.services.zh.ch/ZH-Web-Calculators/calculators/INCOME_ASSETS/calculate` aufgerufen. Die Anfrage enthält Steuerjahr, Zivilstand, Tarif, Konfession und Gemeinde als Codes sowie steuerbares und satzbestimmendes Einkommen und Vermögen als Zahlen.

Die Berechnungsseite zeigt die Bezeichnungen, Werte, Währungen und Einheiten aus der Antwort. Sie unterscheidet die kantonale einfache Steuer als nicht direkt geschuldetes Zwischenergebnis von Staats-, Gemeinde-, Kirchen- und Personalsteuer. Bei Einkommens- und Vermögenssteuer ist erkennbar, dass der satzbestimmende Betrag den Steuersatz bestimmt und der Steuersatz mit dem steuerbaren Betrag zum Steuerbetrag führt. Bei den übrigen prozentualen Steuern ist die Multiplikation der einfachen Steuer mit dem Steuerfuss dargestellt; die Personalsteuer wird als Pauschale ausgewiesen.

Als Gesamtbetrag wird `totalCantonalTax` der offiziellen Antwort angezeigt, ohne eigene Summenberechnung. Die noch nicht angebundene Bundessteuer ist als spätere Erweiterung gekennzeichnet und nicht in diesem Betrag enthalten. Während der Berechnung erscheint ein Ladestatus; bei Fehlern werden keine veralteten Ergebnisse angezeigt und ein erneuter Versuch ist möglich.
