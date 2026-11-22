# Anforderungen an die Steuerberechnung

## CALC-001: Offizielle Datenquelle

Steuerberechnungen werden vom offiziellen Steuerrechner des Kantons Zürich bezogen. Die Anwendung implementiert keine eigene Nachbildung der kantonalen Steuerberechnungslogik.

## CALC-002: Eigene Logik

Eigene Fachlogik ist auf das für die Szenariobedienung, die Anfrage und die Darstellung der Ergebnisse notwendige Minimum zu beschränken. Abweichungen zwischen einer eigenen Darstellung und der offiziellen Berechnung sind nicht zulässig.

## CALC-003: Schnittstellenintegration

Die Schnittstelle wird direkt aus dem Browser aufgerufen. Der Betreiber stellt laut Ausgangslage den CORS-Header `access-control-allow-origin: *` bereit. Konkrete Endpunkte, HTTP-Methoden, Authentifizierung, Anfrage- und Antwortschemata sowie Fehlerfälle werden erst nach Bereitstellung der offiziellen API-Details festgelegt und implementiert.
