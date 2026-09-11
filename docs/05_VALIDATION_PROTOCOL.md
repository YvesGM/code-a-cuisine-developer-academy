# 05 – Validierungsprotokoll

Stand: 11.09.2026, Academy-Pre-n8n-Anpassung. Windows/PowerShell, Node 24.16.0 und npm 11.13.0.

## Ausgangslage und Ergebnis

Die bestehende Basis wurde vom Auftraggeber als grün bestätigt. Innerhalb dieser Agent-Umgebung scheitert allerdings bereits die Ausgangsprüfung und erneut der Abschlusslauf an der bekannten Bundler-Dateizugriffsblockade. Das ist getrennt von der erfolgreichen lokalen Basis und der Implementierung zu betrachten.

| Prüfung auf dem neuen Stand           | Ergebnis                                                                                            |
| ------------------------------------- | --------------------------------------------------------------------------------------------------- |
| npm.cmd run lint                      | Erfolgreich                                                                                         |
| npm.cmd test -- --watch=false         | Fehlgeschlagen vor Vitest-Ausführung: Bundler-Dateizugriff                                          |
| npm.cmd run build                     | Fehlgeschlagen: derselbe Bundler-Dateizugriff                                                       |
| npm.cmd run check                     | Lint erfolgreich; stoppt beim Test-Bundling, Build in der Kette nicht erreicht                      |
| npm.cmd run format:check              | Erfolgreich                                                                                         |
| Angular Compiler Anwendung --noEmit   | Erfolgreich mit strict TypeScript und strictTemplates                                               |
| Angular Compiler Testquellen --noEmit | Erfolgreich                                                                                         |
| JSDoc-Audit                           | Keine undokumentierten benannten eigenen Anwendungsfunktionen, Methoden oder Konstruktoren gefunden |
| Source-Dateilängen                    | Alle Source-Dateien unter 400 Zeilen                                                                |
| Browserflow                           | Nicht ausgeführt, lauffähiges Bundle hier nicht verfügbar                                           |

## Reproduzierbare Blockade

```text
Cannot read directory "../../..": Access is denied.
Could not resolve "C:\\Users\\LocalAdmin\\Desktop\\AC\\code-a-cuisine\\src\\main.ts"
Could not resolve "src/styles.scss"
```

Beim Test-Bundling sind entsprechend die Spec-Dateien und Angular-Imports betroffen. Die Quellen und Dependencies existieren und lassen sich direkt mit dem Angular-Compiler prüfen. Es wurde keine Build-Architektur verändert, kein Import als external markiert, kein alternativer Runner installiert und keine Sandbox-Umgehung vorgenommen. Die genaue Windows-/Sandbox-Regel kann hier nicht geändert werden.

PowerShell-Aufrufe verwenden npm.cmd, weil npm.ps1 durch die bestehende Execution Policy blockiert wird. Das ändert weder npm-Scripts noch Projektarchitektur.

## Vorhandene funktionale Prüfungen

Die bestehenden Testdateien wurden erhalten und für Schema 2 angepasst. Ergänzt sind Academy-Grenzwerte und öffentliche Repository-/Library-Prüfungen. Der erweiterte Routertest umfasst:

1. Landing und Get started.
2. Zutat hinzufügen, bearbeiten, entfernen und mehrere Zutaten neu hinzufügen.
3. Portionen 4, alle Preferences und zwei Kochhelfer.
4. Generierung/Loading/Results mit exakt drei Rezepten.
5. Detail mit Portionen, zusätzlichen Zutaten, Nutrition pro Portion/Gesamt, Directions und Arbeitsaufteilung.
6. Öffentliche Bibliothek, Cuisine-Route und gespeichertes Rezept nach Invalidierung des aktuellen Workflows.
7. Impressum.

Zusätzliche Tests prüfen 70-%-Coverage, 0–3 zusätzliche Zutaten, Reihenfolge/Parallelgruppen, Mengen-/Nutrition-Skalierung, Repository-Speicherung, Fehler/Retry und Pagination mit 45 Datensätzen. Library-Component-Tests bedienen Previous/Next und prüfen Filterwechsel.

Diese Tests sind vorhanden und kompilieren, wurden hier aber nicht durch Vitest ausgeführt. Weder ein bestandener Lauf noch ein manueller Browserdurchlauf wird behauptet.

## Erforderliche Wiederholung

```sh
npm run lint
npm test -- --watch=false
npm run build
npm run check
npm run format:check
npm start
```

Danach den oben genannten Flow manuell im Browser bedienen und zusätzlich 1/12 Portionen, 1/3 Helfer, leere Library, unbekannte IDs, erneute Generierung, Pagination und Direktaufrufe prüfen. Im Development-Adapter ist ein Rezept nach Reload erwartungsgemäß nicht mehr gespeichert.

Erst nach erfolgreichen Qualitätschecks und funktionaler Validierung den neuen Pre-n8n-Frontend-Stand als validiert markieren. Echte Supabase-/n8n- und Cross-Browser-Prüfungen bleiben getrennte Folgephasen.


## Supabase-Vorbereitung nach dem Academy-Audit

Nach dem Codex-Stand wurden alle Firebase-spezifischen Implementierungs- und Persistenzvorbereitungen entfernt und Supabase als verbindliche Persistenzentscheidung vorbereitet. `SupabaseRecipeRepository` nutzt das dedizierte Schema `code_a_cuisine`; die Bestandsmigrationen der gemeinsam genutzten Datenbank liegen lokal und `supabase/migrations/20260911124500_create_code_a_cuisine_recipe_library.sql` legt ausschließlich die Code-a-Cuisine-Tabelle an. Die öffentlichen Clientwerte werden nicht versioniert, sondern zur Laufzeit aus Prozess-Umgebungsvariablen gelesen. Persistierte Payloads werden beim Lesen erneut validiert; Production fällt ohne Konfiguration nicht still auf In-Memory zurück.

Zusätzlich wurde der Response-Vertrag enger geprüft: Ränge müssen eindeutig 1..3 sein; bei mehreren Kochhelfern muss jeder Helfer mindestens einen Schritt erhalten und mindestens eine echte Parallelgruppe vorhanden sein. Nach diesen Änderungen müssen `lint`, Tests, Build, `check` und `format:check` lokal erneut ausgeführt werden. Ein erfolgreicher Lauf wird hier nicht vorweggenommen.
