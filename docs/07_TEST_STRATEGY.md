# 07 – Teststrategie

Das bestehende Angular/Vitest-/jsdom-System bleibt erhalten.

| Tests                         | Verantwortung                                                                                          |
| ----------------------------- | ------------------------------------------------------------------------------------------------------ |
| `business.spec.ts`            | Ingredient-Validierung, Request-Mapping, Ranking, Preference-Match                                     |
| `response-validation.spec.ts` | Envelope, IDs, Zutaten, Nutrition, Directions und Schema-Fehler                                        |
| `recipe-repository.spec.ts`   | n8n-Library-Vertrag, kein Browser-Write, persistierte Payload-Validierung, Pagination/Filter           |
| `flow-state.spec.ts`          | CRUD, Preferences, Doppelstart, Retry, Persistenz-Flag                                                 |
| `academy.spec.ts`             | Portionen/Helfer, Difficulty, exakt drei, Diversity, 70 %, Extras, Nutrition, Parallelität, Pagination |
| `pages/flow.spec.ts`          | kompletter Angular-Flow inklusive Library/Impressum                                                    |
| `pages/library.spec.ts`       | öffentliche Direktaufrufe, Pagination, Filter, Fehler/Retry                                            |
| `app.spec.ts`                 | Shell-Smoke-Test                                                                                       |

Zusätzlich sind reale n8n-/Firebase-Integrationstests notwendig: Generation schreibt drei Firebase-Records; Library liest sie über n8n; Quota/Audit bleiben Supabase-basiert.
