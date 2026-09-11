# 01 – Architektur

## Bestehende Owner und gezielte Erweiterungen

| Owner                       | Verantwortung                                                                                             |
| --------------------------- | --------------------------------------------------------------------------------------------------------- |
| core/models.ts              | Einzige Domain-Models, Schema-2-Request/Response, RecipeQuery und RecipePage                              |
| core/config.ts              | Optionskeys, deutsche Labels, Difficulty-Zeiträume, Mengen-/Helfergrenzen, Recipe-Count und Page Size     |
| core/business.ts            | Eingabeprüfung, Request-Mapping, Ranking, Coverage, Arbeitsaufteilung und Pagination                      |
| core/flow-state.ts          | Aktueller Workflow, Portionen, Helfer, Status, Request-ID, Results und Fehler                             |
| core/generation.ts          | Bestehender Provider-Token, deterministischer Mock und validierender GenerationService                    |
| core/response-validation.ts | Untrusted Responses vollständig gegen Schema und Request prüfen                                           |
| core/recipe-repository.ts   | Ein Repository-Vertrag und ein Development-Adapter für gespeicherte Rezepte                               |
| core/guards.ts              | Flow-Schutz für Preferences, Generating und Results                                                       |
| shared/library-list.ts      | Gemeinsame öffentliche Repository-Abfrage mit Pagination, Loading und Fehlern                             |
| pages/recipe-detail.ts      | Repository-Lookup und abgeleitete Nutrition-/Helferansicht                                                |

## Datenfluss

UI → FlowState → GenerationService → GENERATION_PROVIDER → Response Validation → FlowState → RECIPE_REPOSITORY.saveMany → Erfolg/Results.

Ein Generation-Response muss zunächst vollständig gültig sein. Anschließend speichert der Owner alle drei Rezepte. Erst nach erfolgreicher Speicherung wird der aktuelle Workflow erfolgreich. Repository-Fehler erscheinen kontrolliert als Fehler; es gibt keinen stillen Mock-Fallback. Retry startet aktuell eine neue Generierung mit neuer Request-ID.

Die öffentliche Library und Details lesen ausschließlich das Repository. Der aktuelle Workflow besitzt keine Library-Gruppierung mehr. Aktuelle Recipe-Referenzen in Results sind keine zweite gespeicherte Historie. Im Development-Adapter werden dieselben readonly Recipe-Objekte aufbewahrt. Local UI Signals halten Abfrageergebnisse und Loading-/Fehlerzustände, keinen zweiten Generation-State.

## Nebenläufigkeit

Eingabeänderungen invalidieren aktuelle Ergebnisse und Request-ID, nicht gespeicherte Rezepte. Doppelstarts während generating werden ignoriert. Ein später eintreffender gültiger Generation-Satz wird gemäß Speicherpflicht ins Repository geschrieben, aktualisiert aber einen inzwischen geänderten Workflow nicht. Nach gestarteter Speicherung kann eine Eingabeänderung die Speicherung nicht rückgängig machen.

Repository-Listen und Detail-Lookups verwerfen verspätete Abfrageantworten bei Filter-/ID-Wechsel oder Component-Zerstörung. Cuisine-Wechsel setzt die Listen-Seite auf 1 zurück.

## Repository-Vertrag und Supabase-Vorbereitung

RecipeRepository bietet genau:

- saveMany(readonly Recipe[]): Promise<void>: geprüften Satz idempotent nach ID speichern; Fehler ablehnen.
- getById(id): Promise<Recipe | undefined>: gespeicherte ID oder fehlender Datensatz.
- list({ page?, cuisine? }): Promise<RecipePage>: Filter vor Pagination; items, total, page und pages.

`InMemoryRecipeRepository` bleibt der explizite Development-Adapter, solange keine Supabase-Konfiguration eingetragen ist. `SupabaseRecipeRepository` verwendet ohne zusätzliche SDK-Abhängigkeit die Supabase Data API. Project URL und browsergeeigneter Publishable Key werden ausschließlich zur Laufzeit aus Prozess-Umgebungsvariablen in eine ignorierte Runtime-Konfiguration geschrieben; sie stehen nicht in versionierten Source-Dateien. Secret-/Service-Role-Keys sind im Angular-Bundle verboten.

Die Persistenz liegt im dedizierten Custom Schema `code_a_cuisine.recipes`. Filter-/Sortierspalten sind normalisiert, während der vollständige Schema-2-Recipe-Datensatz als `jsonb`-Payload gespeichert wird. Persistierte Payloads werden beim Lesen erneut strukturell validiert, bevor sie die öffentliche UI erreichen. Pagination und Cuisine-Filter laufen serverseitig. Bestehende IDs werden beim Speichern nicht überschrieben.

Die versionierte Migration liegt unter `supabase/migrations/`. Sie erzeugt Tabelle, Constraints, Indizes, Grants und RLS. Öffentlich sind SELECT und INSERT mit Publishable Key erlaubt; UPDATE/DELETE werden nicht freigegeben. Das hält den aktuellen Angular-Flow funktionsfähig. Im n8n-Hardening kann der Schreibpfad später bewusst serverseitig verschoben und die öffentliche INSERT-Policy per Folgemigration geschlossen werden, ohne Library-Reads zu ändern.

Ohne Credentials verwendet Development In-Memory. Ein Production-Runtime ohne Supabase-Konfiguration bricht bewusst ab statt still auf temporäre Speicherung zurückzufallen. Sind Project URL und Publishable Key in der Runtime-Konfiguration vorhanden, wird automatisch Supabase verwendet.

Die Academy-Checkliste nennt Firebase; das Projekt verwendet auf ausdrückliche Entscheidung Supabase für dieselbe persistente öffentliche Bibliotheksfunktion. Es existiert kein Firebase-/Firestore-Codepfad.

## Gestaltung und Wartung

Standalone-Routes, Reactive Forms, Signals, ESLint und Vitest bleiben erhalten. JSDoc dokumentiert eigene fachliche Funktionen/Methoden; Framework-Konfiguration und einfache Callback-Ausdrücke werden nicht in zusätzliche Wrapper umgebaut. Semantische Formulare, fieldsets, sections, articles, nav und footer tragen das minimale Layout. Keine Figma-Annahmen.
