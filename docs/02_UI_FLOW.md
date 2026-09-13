# 02 – UI Flow

| Route              | Verhalten                                                                                            |
| ------------------ | ---------------------------------------------------------------------------------------------------- |
| /                  | Landing, Get started → /generate                                                                     |
| /generate          | Bestehendes Zutaten-CRUD; mindestens eine gültige gespeicherte Zutat                                 |
| /preferences       | Portionen, Kochhelfer und alle drei Preferences; benötigt Zutaten                                    |
| /generating        | Loading bis Generierung und Speicherung beendet sind; Error/Retry                                    |
| /results           | Exakt drei gerankte aktuelle Ergebnisse; benötigt erfolgreichen aktuellen Satz                       |
| /recipe/:id        | Öffentlicher Repository-Lookup; Loading, Lesefehler mit Retry oder Nicht-gefunden                    |
| /cookbook          | Öffentliche Rezeptebibliothek mit allen gespeicherten Datensätzen, Cuisine-Navigation und Pagination |
| /cookbook/:cuisine | Dieselbe Repository-Liste gefiltert nach zentralem Cuisine-Key                                       |
| /impressum         | Semantische Platzhalterseite, jederzeit über Footer erreichbar                                       |

Unbekannte Routes führen zur Landing Page. Zutaten fehlen: geschützter Flow geht zu /generate. Ohne gestartete Generierung geht /generating zu /preferences. Results ohne aktuelle Daten gehen je nach Status zu /generating oder zum passenden Eingabeschritt. Bibliothek, Details und Impressum benötigen weder aktuellen Workflow noch Account.

## Formular

Ingredient-CRUD und stabile IDs bleiben unverändert. Mengen- und Einheitenänderungen erfolgen inline in der bestehenden Zutatenzeile; das Add-Formular bleibt dabei unberührt. Preferences enthalten explizite Auswahlfelder; vorhandene Auswahl wird beim erneuten Öffnen übernommen. Portionen müssen ganzzahlig 1–12 sein, Default 2. Kochhelfer müssen ganzzahlig 1–3 sein, Default 1. Ungültige Formulare können keine Generierung starten.

Die Preference-Oberfläche verwendet die zentralen englischen Labels Quick, Medium, Complex sowie German, Italian, Japanese, Indian, Gourmet, Fusion und die englischen Diet-Labels. Die Zeitbereiche bleiben fachlich unverändert und werden in der UI englisch dargestellt.

## Ergebnisse und Details

Generate a Recipe übernimmt die gültigen Entwürfe in FlowState, erstellt Schema 2 und startet den bestehenden Provider-Flow. Der Mock erzeugt genau drei Verfahren der gewählten Preferences. Nach Validierung und Speicherung öffnet die Generating-Seite Results.

Details zeigen Portionen, Kochhelfer, vorhandene Gesamtmengen und getrennte zusätzliche Gesamtmengen. Nutrition hat Abschnitte Pro Portion und Gesamtrezept. Directions bleiben chronologisch; Parallelgruppen und Wartezeiten sind sichtbar. Die Liste Person → Steps wird ausschließlich aus assignedCooks derselben Directions abgeleitet.

## Bibliothek

Alle gespeicherten Rezepte werden in Seiten zu 20 dargestellt. Bei maximal 20 erscheint keine Seitennavigation, darüber Previous/Next. Cuisine-Filter werden vor Pagination angewendet. German, Italian, Japanese, Indian und Gourmet sind vertreten; Fusion bleibt zusätzlich verfügbar. Unbekannte Cuisine zeigt einen kontrollierten Fehler, eine bekannte ohne Daten zeigt eine leere Liste.

## Reload und Veröffentlichung

Der In-Memory-Development-Adapter verliert gespeicherte Daten beim Reload. Eine alte URL zeigt dann Nicht-gefunden, keine kaputte Seite. Mit veröffentlichter n8n-Library-API verwendet dieselbe UI die dauerhafte Firebase-Bibliothek und direkte Detail-URLs bleiben erhalten. SPA-Hosting benötigt index.html-Fallback. Impressumsplatzhalter müssen vor Veröffentlichung durch reale Angaben ersetzt werden.
