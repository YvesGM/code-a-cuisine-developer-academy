# Code-a-Cuisine: verbindliche Arbeitsregeln

- Existing-System-First: zuerst vorhandene Owner, Datenverträge und vollständigen Flow nachvollziehen.
- Root Cause vor Änderung; kleinste passende Änderung, keine Quickfixes oder Parallelimplementierungen.
- Ein State-Owner, zentrale Models und API Contracts; bestehende Lösungen erweitern.
- Keine erfundenen Anforderungen, versteckten Fallbacks oder unbestätigten n8n-/Persistenzstrukturen.
- Strict TypeScript, kein `any`, kleine fokussierte Funktionen, Dateien möglichst unter 400 Zeilen.
- Keine externe Kommunikation in Components, keine Businesslogik in Templates.
- Nach Änderungen passende Tests ausführen und Dokumentation aktualisieren.
- Nach Architekturblöcken und vor Abschluss: Lint, Tests und Production Build.
- Phasenstatus: `[ ]` nicht begonnen, `[~]` in Arbeit, `[x]` validiert, `[!]` blockiert.
- Keine Phase gilt vor erfolgreichen Tests, Lint und Build als abgeschlossen.
- Offene Anforderungen zentral konfigurieren und in `docs/06_OPEN_DECISIONS.md` dokumentieren.
- Aktueller Stand: Academy-Schema 2, Firebase-Rezeptpersistenz sowie n8n Generation, Library, Quota und Error Notification sind vorbereitet. E2E-Validierung und finales Figma-Styling folgen separat.
- `FlowState` besitzt den aktuellen Workflow. `RecipeRepository` kapselt Library-Zugriffe; Angular spricht dafür ausschließlich den n8n-Library-Endpunkt an.
- Rezeptwrites und -reads laufen produktiv serverseitig über n8n und Firebase Realtime Database. Keine Firebase-Service-Credentials oder Supabase-Keys ins Angular-Bundle einführen.
- Supabase bleibt ausschließlich Owner für Quota, Throttling und Workflow-Audit-Logs.
- Generierung liefert exakt drei Preference-konforme Rezepte. Contract-Regeln stehen in `docs/03_DATA_CONTRACTS.md`.
- Eigene fachliche Funktionen und Methoden mit sinnvoller JSDoc dokumentieren; keine künstlichen Framework-Wrapper.
- Textdateien als UTF-8 erhalten und beschädigte Sonderzeichen nach Änderungen prüfen.
