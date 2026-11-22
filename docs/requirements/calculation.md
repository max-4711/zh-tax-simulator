# Anforderungen an die Steuerberechnung

## CALC-001: Offizielle Datenquelle

Steuerberechnungen werden vom offiziellen Steuerrechner des Kantons Zürich bezogen. Die Anwendung implementiert keine eigene Nachbildung der kantonalen Steuerberechnungslogik.

## CALC-002: Eigene Logik

Eigene Fachlogik ist auf das für die Szenariobedienung, die Anfrage und die Darstellung der Ergebnisse notwendige Minimum zu beschränken. Abweichungen zwischen einer eigenen Darstellung und der offiziellen Berechnung sind nicht zulässig.

## CALC-003: Schnittstellenintegration

Die Schnittstelle wird direkt aus dem Browser ohne Authentifizierung aufgerufen. Der Betreiber stellt den CORS-Header `access-control-allow-origin: *` bereit.

Für die Grundangaben liefert `GET https://webcalc.services.zh.ch/ZH-Web-Calculators/calculators/INCOME_ASSETS` die Konfiguration des Rechners. Die Anwendung liest die Auswahllisten aus `maritalStatus`, `taxYear`, `taxScale`, `religionP1` und `municipality` sowie die Bezeichnungen, Hinweise und Betragsvorgaben aus `taxableIncome` und `taxableAssets`. Platzhalter mit dem Text «Bitte wählen» sind keine auswählbaren Werte. Die eigentlichen Berechnungsendpunkte und Anfrage- und Antwortschemata bleiben für die nächste Ausbaustufe offen.

Während des Ladens sind die Auswahlfelder deaktiviert. Bei einem Abruffehler wird eine verständliche Fehlermeldung angezeigt; die Anwendung verwendet keine erfundenen Ersatzlisten.
