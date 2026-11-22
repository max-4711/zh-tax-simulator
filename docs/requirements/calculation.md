# Anforderungen an die Steuerberechnung

## CALC-001: Offizielle Datenquelle

Steuerberechnungen werden vom offiziellen Steuerrechner des Kantons Zürich bezogen. Die Anwendung implementiert keine eigene Nachbildung der kantonalen Steuerberechnungslogik.

## CALC-002: Eigene Logik

Eigene Fachlogik ist auf das für die Szenariobedienung, die Anfrage und die Darstellung der Ergebnisse notwendige Minimum zu beschränken. Abweichungen zwischen einer eigenen Darstellung und der offiziellen Berechnung sind nicht zulässig.

## CALC-003: Schnittstellenintegration

Die Schnittstelle wird direkt aus dem Browser ohne Authentifizierung aufgerufen. Der Betreiber stellt den CORS-Header `access-control-allow-origin: *` bereit.

Für die Grundangaben liefert `GET https://webcalc.services.zh.ch/ZH-Web-Calculators/calculators/INCOME_ASSETS` die Konfiguration des Rechners. Die Anwendung liest die Auswahllisten aus `maritalStatus`, `taxYear`, `taxScale`, `religionP1` und `municipality` sowie die Bezeichnungen, Hinweise und Betragsvorgaben aus `taxableIncome` und `taxableAssets`. Platzhalter mit dem Text «Bitte wählen» sind keine auswählbaren Werte. Während des Ladens sind die Auswahlfelder deaktiviert. Bei einem Abruffehler wird eine verständliche Fehlermeldung angezeigt; die Anwendung verwendet keine erfundenen Ersatzlisten.

## CALC-004: Basisrechnung

Beim Öffnen der Basisrechnung wird mit den vollständigen gespeicherten Basisangaben automatisch `POST https://webcalc.services.zh.ch/ZH-Web-Calculators/calculators/INCOME_ASSETS/calculate` aufgerufen. Die Anfrage enthält Steuerjahr, Zivilstand, Tarif, Konfession und Gemeinde als Codes sowie steuerbares und satzbestimmendes Einkommen und Vermögen als Zahlen. Bei Änderungen von Steuerjahr oder Zivilstand wird die Metadatenquelle per POST mit diesen beiden Werten aufgerufen. Ist `religionP2` nicht `null`, wird die zweite Konfession mit Bezeichnung und Auswahlliste aus der Antwort im Basis- und Vergleichsformular abgefragt und als `religionP2` übermittelt. Andernfalls bleibt das Feld verborgen und wird nicht gesendet. Veraltete Metadaten-Antworten werden verworfen.

Die Berechnungsseite zeigt die Bezeichnungen, Werte, Währungen und Einheiten aus der Antwort. Sie unterscheidet die kantonale einfache Steuer als nicht direkt geschuldetes Zwischenergebnis von Staats-, Gemeinde-, Kirchen- und Personalsteuer. Bei Einkommens- und Vermögenssteuer ist erkennbar, dass der satzbestimmende Betrag den Steuersatz bestimmt und der Steuersatz mit dem steuerbaren Betrag zum Steuerbetrag führt. Bei den übrigen prozentualen Steuern ist die Multiplikation der einfachen Steuer mit dem Steuerfuss dargestellt; die Personalsteuer wird als Pauschale ausgewiesen.

`totalCantonalTax` wird als Zwischensumme der kantonalen Schnittstelle gelesen. Während der Berechnung erscheint ein Ladestatus; bei Fehlern werden keine veralteten Ergebnisse angezeigt und ein erneuter Versuch ist möglich.

## CALC-006: Korrektur bekannter Schnittstellenfehler

Die fehlerhaften API-Bezeichnungen von `incomeTax` und `assetsTax` werden durch «Einkommenssteuer» beziehungsweise «Vermögenssteuer» ersetzt. Da die kantonale Schnittstelle abweichende satzbestimmende Beträge nicht korrekt verarbeitet, enthält die Anfrage als `taxableIncome` und `taxableAssets` jeweils den satzbestimmenden Betrag. Die so ermittelten offiziellen Steuersätze werden mit den tatsächlich steuerbaren Beträgen multipliziert und auf ganze Franken abgerundet. Einfache Steuer, davon abhängige Steuerbeträge und das kantonale Total werden aus diesen korrigierten Werten und den offiziellen Steuerfüssen neu gebildet; die Rundung auf fünf Rappen bleibt erhalten.

Für die Bundessteuer werden steuerbares und satzbestimmendes Einkommen an die Schnittstelle gesendet. Sämtliche Bundessteuerbeträge werden unverändert aus der API-Antwort übernommen; eine eigene Berechnung oder Begrenzung findet nicht statt. `taxableAscertainedFederalIncome` wird verwendet, sofern die Schnittstelle es liefert; bei `null` dient `taxableFederalIncome` als Darstellungsersatz. Das separate satzbestimmende Bundes-Einkommen ist im Formular deaktiviert und entspricht immer dem steuerbaren Bundes-Einkommen. Die begrenzten kantonalen Korrekturen sind ausdrücklich von der sonstigen Beschränkung auf die offizielle Berechnung ausgenommen.

## CALC-005: Bundessteuer und Gesamttotal

Für die Anwendbarkeit und Bezeichnung der Kinderanzahl wird `POST https://webcalc.services.zh.ch/ZH-Web-Calculators/calculators/FEDERAL` mit Steuerjahr und Tarifcode aufgerufen. Ist `childrenNo` in der Antwort `null`, bleibt das Eingabefeld verborgen. Andernfalls wird es mit der gelieferten Bezeichnung und Obergrenze angezeigt; der gespeicherte Standardwert ist 0. Änderungen von Steuerjahr oder Tarif aktualisieren die Konfiguration, ohne dass veraltete Antworten übernommen werden.

Beim Öffnen der Basisrechnung wird parallel zur kantonalen Berechnung `POST https://webcalc.services.zh.ch/ZH-Web-Calculators/calculators/FEDERAL/calculate` aufgerufen. Die Anfrage enthält Steuerjahr, den auf den offiziellen Bundessteuercode abgebildeten Tarif (`BASIC` zu `SINGLE`), Kinderanzahl sowie steuerbares und satzbestimmendes Einkommen. Standardmässig werden die gemeinsamen Einkommensbeträge verwendet; bei aktivierter Option gelten stattdessen die separat erfassten Bundessteuerbeträge. Die Behandlung des satzbestimmenden Einkommens ist unter CALC-006 beschrieben.

Die Darstellung zeigt den Zusammenhang zwischen satzbestimmendem Einkommen und Steuersatz, die Multiplikation mit dem steuerbaren Einkommen und – sofern vorhanden – den Kinderabzug bis zu `totalAfterChildrenDeduction`. Dieser Endbetrag ist der geschuldete Bundessteuerbetrag. Das hervorgehobene Gesamttotal ist die Summe aus `cantonalBaseTax`, `municipalityTax`, `religionTaxP1`, `personalTax` und `totalAfterChildrenDeduction`.

## CALC-007: Vergleichsberechnung

Für den 1:1 Vergleich werden sowohl die aktuellen Basisangaben als auch die Vergleichsangaben mit den Schnittstellen aus CALC-004 und CALC-005 berechnet. Eine Änderung der Vergleichswerte löst nach einer kurzen Wartezeit eine erneute Berechnung aus; veraltete Antworten werden verworfen. Während der Aktualisierung ist der Ladestatus sichtbar, bei einem Fehler werden keine veralteten Ergebnisse angezeigt und ein erneuter Versuch ist möglich.

Differenzen und Prozentangaben sind ausschliesslich Vergleichsdarstellungen der offiziellen Ergebnisse und keine eigene Steuerberechnung.
