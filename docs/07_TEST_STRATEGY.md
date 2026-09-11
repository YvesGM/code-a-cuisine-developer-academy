# 07 – Teststrategie

Das bestehende Angular/Vitest-/jsdom-System bleibt erhalten. TestBed prüft DI und Signals; RouterTestingHarness verwendet die realen Routes. Provider und Repository werden ausschließlich über ihre bestehenden DI-Verträge kontrolliert ersetzt.

| Tests                       | Verantwortung                                                                                                                                                                                                    |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| business.spec.ts            | Bestehende Ingredient-Validierung, Request-Mapping Schema 2, Ranking, exakt drei Results und Preference-Match                                                                 |
| response-validation.spec.ts | Bestehende Envelope-/ID-/Pflichtfeld-/Zutaten-/Directions-Fehler; negative Recipe-Tests behalten drei Einträge, damit sie nicht nur am Count scheitern                                                           |
| recipe-repository.spec.ts  | Supabase-Data-API-Mapping mit gemocktem fetch, idempotenter Save-Pfad, persistierte Payload-Validierung sowie Count/Pagination/Filter                                                                     |
| flow-state.spec.ts          | Bestehendes CRUD, stabile IDs, Preferences, Doppelstart, späte Antworten, Retry; zusätzlich ungültige Daten nicht speichern und Speicherfehler kontrollieren                                                     |
| academy.spec.ts             | Portionen/Helfer inklusive Grenzen und Defaults; Difficulty-Grenzen, exakt drei, Diversity, 70-%-Schwelle, zusätzliche Zutaten, Nutrition-Skalierung, Parallelgruppen, Repository, Pagination mit 45 Datensätzen |
| pages/flow.spec.ts          | Erweitertes Zutaten-/Preferences-/Loading-/Results-/Detail-/Library-/Impressum-Szenario; alte Recipe-ID bleibt nach Workflow-Invalidierung erreichbar                                                            |
| pages/library.spec.ts       | Öffentliche Direktaufrufe, tatsächliche Pagination-Buttons und Filterwechsel, leere Liste, Repository-Lesefehler und Retry                                                                                       |
| app.spec.ts                 | Bestehender Shell-Smoke-Test                                                                                                                                                                                     |

## Prüfbefehle

npm run lint → npm test -- --watch=false → npm run build → npm run check → npm run format:check. Zusätzliche Compilerprüfung bei Umgebungsblockaden ersetzt keinen erfolgreichen Testlauf.

## Fachliche Schwerpunkte

Grenzwerttests akzeptieren genau 7 von 10 User-Zutaten und lehnen 6 ab; zusätzliche Zutaten erhöhen die Coverage nicht. Nutrition prüft alle Grammwerte und Kalorien proportional zur Portionszahl, Prozent bleibt unverändert. Directions testen Schrittfolge, gültige Helfer, Gruppen und Konflikte. Repository-Tests prüfen Speicherung mehrerer Generierungen und Details unabhängig vom aktuellen Flow.

## Grenzen

RouterTestingHarness ist ein Component-Integrationstest, kein echter Browser-E2E-Test. Der vollständige manuelle Bedienpfad muss nach erfolgreichem Bundling zusätzlich geprüft werden. JSDoc dokumentiert fachliche Anwendungsmethoden und eigene Testhelfer; banale Framework-Callbacks bekommen keine künstlichen Wrapper.

Reale n8n-Contract-Tests, serverseitige Quota-/IP-Tests, ein Integrationstest gegen ein initialisiertes/gelinktes Supabase-Projekt und finale Design-/Cross-Browser-Prüfungen folgen in ihren Phasen. Der tatsächliche aktuelle Prüfstand steht in 05_VALIDATION_PROTOCOL.md.
