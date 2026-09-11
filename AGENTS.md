# Code-a-Cuisine: verbindliche Arbeitsregeln

- Existing-System-First: zuerst vorhandene Owner, Datenverträge und vollständigen Flow nachvollziehen.
- Root Cause vor Änderung; kleinste passende Änderung, keine Quickfixes oder Parallelimplementierungen.
- Ein State-Owner, zentrale Models und API Contracts; bestehende Lösungen erweitern.
- Keine erfundenen Anforderungen, versteckten Fallbacks oder unbestätigten n8n-/Supabase-Strukturen.
- Strict TypeScript, kein `any`, kleine fokussierte Funktionen, Dateien möglichst unter 400 Zeilen.
- Keine externe Kommunikation in Components, keine Businesslogik in Templates.
- Nach Änderungen passende Tests ausführen und Dokumentation aktualisieren.
- Nach Architekturblöcken und vor Abschluss: Lint, Tests und Production Build.
- Phasenstatus: `[ ]` nicht begonnen, `[~]` in Arbeit, `[x]` validiert, `[!]` blockiert.
- Keine Phase gilt vor erfolgreichen Tests, Lint und Build als abgeschlossen.
- Offene Anforderungen zentral konfigurieren und in docs/06_OPEN_DECISIONS.md dokumentieren.
- Aktueller Stand: Academy-Schema 2 ist vorbereitet. Supabase ist die verbindliche Persistenzentscheidung; Migration und öffentlicher Repository-Adapter sind vorbereitet. Echter n8n-Workflow, Quota und finales Figma-Styling folgen separat.
- FlowState besitzt den aktuellen Workflow; RecipeRepository besitzt gespeicherte Rezepte. Öffentliche Library und Details lesen das Repository, nicht den aktuellen Generation-State.
- Generierung liefert exakt drei Preference-konforme Rezepte. Neue Contract-Regeln und Versionierung stehen in docs/03_DATA_CONTRACTS.md.
- Eigene fachliche Funktionen und Methoden mit sinnvoller JSDoc dokumentieren; keine künstlichen Framework-Wrapper.
- Textdateien als UTF-8 erhalten und beschädigte Sonderzeichen nach Änderungen prüfen.

- Die Academy-Checkliste nennt Firebase; im Projekt wird bewusst Supabase verwendet. Keine Firebase-SDKs, Firestore-Modelle oder parallelen Persistenzpfade einführen.
