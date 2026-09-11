# Code-a-Cuisine

Code-a-Cuisine unterstützt die Resteverwertung: Nutzer erfassen vorhandene Lebensmittel und erhalten exakt drei Rezeptvorschläge nach Portionen, Aufwand, Cuisine und Diet. Die öffentliche Rezeptebibliothek zeigt gespeicherte Rezepte unabhängig von der aktuellen Generierung.

## Status

Die bestehende Angular-Grundlage wurde für die Academy-Anforderungen erweitert, nicht neu aufgebaut. Der Pre-n8n-Vertrag ist **Schema 2**. Mock-Provider und Development-Repository funktionieren ohne Credentials und ohne Netzwerk. Für die dauerhafte öffentliche Bibliothek ist jetzt ein Supabase-Data-API-Adapter samt versionierter SQL-Migration vorbereitet. Ohne Supabase-Konfiguration bleibt `ng serve` bewusst im In-Memory-Development-Modus; Production verlangt eine konfigurierte Supabase-Verbindung. Der aktuelle Prüfstand steht in [05_VALIDATION_PROTOCOL.md](docs/05_VALIDATION_PROTOCOL.md).

Mock-Anleitungen und Nutrition sind ausdrücklich technische Demo-Daten, keine geprüften Kochanleitungen oder Ernährungsanalysen. Eine globale Bibliothek aller Nutzer ist das Produktionsziel; der aktuelle In-Memory-Adapter enthält nur die Rezepte dieser App-Sitzung.


> **Academy-Abweichung:** Die bereitgestellte Checkliste nennt Firebase. Dieses Projekt verwendet auf ausdrückliche Projektentscheidung stattdessen Supabase für dieselbe fachliche Anforderung „alle generierten Rezepte dauerhaft und öffentlich speichern“. Diese Technologieabweichung sollte vor der finalen Abgabe mit der Academy abgestimmt werden.

## Features

- Bestehendes Ingredient-CRUD mit stabilen IDs, positiven Mengen und zentralen Einheiten.
- Portionen 1–12 (Default 2), Kochhelfer 1–3 (Default 1).
- Zentrale deutsche Labels für Difficulty, Cuisine und Diet; überprüfte Zeitbereiche.
- Exakt drei unterschiedliche deterministische Rezeptvorschläge der ausgewählten Preferences.
- Mindestens 70 % eindeutige User-Zutaten pro Rezept; getrennt maximal drei zusätzliche Basiszutaten.
- Skalierte Demo-Mengen ohne Überschreiten des vorhandenen Vorrats.
- Nutrition pro Portion und Gesamt mit Gramm- und Prozentwerten.
- Chronologische Directions mit Helferzuordnung, Parallelgruppen und optionalen Wartezeiten; daraus abgeleitete Arbeitsaufteilung.
- Öffentliche Bibliothek mit Cuisine-Filter und Pagination ab mehr als 20 Einträgen.
- Recipe-Detail per Repository-ID, unabhängig von der letzten Generierung.
- Loading, Retry und kontrollierte Fehler; Impressum mit ausdrücklich gekennzeichneten Platzhaltern.

## Architektur

UI → FlowState → GenerationService → GenerationProvider → Response Validation → FlowState → RecipeRepository.saveMany → Results.

FlowState bleibt der Owner des aktuellen Workflows. Das Repository besitzt die gespeicherte Historie. Bibliothek und Detail lesen ausschließlich das Repository. Die aktuellen Results halten den validierten Satz; im Development-Adapter sind es dieselben unveränderten Recipe-Referenzen. FormGroups und Ladezustände sind lokale UI-Entwürfe beziehungsweise Abfragezustände, keine zusätzliche Domain-State-Lösung.

Generation Provider heute: lokaler Mock, später n8n. Recipe Repository: In-Memory ohne Supabase-Runtimekonfiguration im Development; automatisch Supabase, sobald Project URL und Publishable Key als Prozess-Umgebungsvariablen gesetzt sind. Credentials werden nicht im Repository gespeichert. In Production fehlende Supabase-Konfiguration ist ein harter Fehler, kein stiller Fallback.

## Stack und Struktur

Angular 22, Standalone Components, Router, Reactive Forms, Signals, TypeScript 6 strict, SCSS, Vitest/jsdom, ESLint/typescript-eslint. Keine neue Library, kein SSR, keine Authentifizierung und keine zusätzliche State-Library.

```text
src/app/core/    Zentrale Models, Config, Businessfunktionen, FlowState, Provider,
                Response Validation, Guards und RecipeRepository
src/app/pages/   Bestehender Flow, öffentliche Bibliothek/Details und Impressum
src/app/shared/  Recipe Card und gemeinsame paginierte Bibliotheksliste
src/styles.scss Minimales technisches Layout, Text mindestens 16px, small 14px
docs/           Bestehende technische Dokumentation
n8n/workflows/  Ablage späterer echter Workflow-Exporte
supabase/       Gezogene Bestandsmigrationen plus eigenes Schema `code_a_cuisine`; CLI-Konfiguration vorhanden
AGENTS.md       Verbindliche Arbeitsregeln
```

Tests liegen neben dem Code. Node 24.16.0 und npm 11.13.0 wurden verwendet; package-lock.json hält die installierten Versionen fest. Voraussetzung laut package.json: Node >=24.15.0 <25, npm >=11 <12.

## Commands

```sh
npm ci
npm start
npm run lint
npm test -- --watch=false
npm run build
npm run check
npm run format:check
```

Supabase-Werte werden nicht committed. Für einen lokalen PowerShell-Lauf werden sie nur in der aktuellen Shell gesetzt:

```powershell
$env:CODE_A_CUISINE_SUPABASE_URL="https://<project-ref>.supabase.co"
$env:CODE_A_CUISINE_SUPABASE_PUBLISHABLE_KEY="<publishable-key>"
$env:CODE_A_CUISINE_SUPABASE_SCHEMA="code_a_cuisine"
npm start
```

`prestart` und `prebuild` erzeugen daraus die ignorierte Datei `public/runtime-config.js`; der Schlüssel wird nicht in Source-Dateien geschrieben.

Unter PowerShell mit gesperrtem npm.ps1 kann regulär npm.cmd verwendet werden. check führt Lint → Tests → Production Build aus. npm run format formatiert die Projektdateien. Development läuft standardmäßig unter http://localhost:4200. SPA-Hosting muss Routen auf index.html zurückführen. Build-Ausgabe: dist/code-a-cuisine/browser.

## Dokumentation und nächste Schritte

[Scope](docs/00_PROJECT_SCOPE.md) · [Architektur](docs/01_ARCHITECTURE.md) · [UI-Flow](docs/02_UI_FLOW.md) · [Contracts](docs/03_DATA_CONTRACTS.md) · [Phasen](docs/04_PHASE_PLAN.md) · [Validierung](docs/05_VALIDATION_PROTOCOL.md) · [Offene Entscheidungen](docs/06_OPEN_DECISIONS.md) · [Tests](docs/07_TEST_STRATEGY.md).

Nächster fachlicher Auftrag: **ECHTEN N8N-WORKFLOW FÜR CODE-A-CUISINE BAUEN**, auf Basis des vorhandenen n8n-/Join-Issue-Collector-Projekts und Schema 2. Quota-Auslegung ist dabei zu klären. Das bestehende Supabase-Projekt ist migrationsseitig synchronisiert; für Code-a-Cuisine wird die neue `code_a_cuisine`-Migration gepusht, das Schema in der Remote Data API exponiert und URL/Publishable Key ausschließlich über Runtime-Umgebungsvariablen bereitgestellt. Finales Figma-Styling, Responsive-Optimierung, Loading-Animation und Cross-Browser-Abschlussprüfung folgen separat. Vor Veröffentlichung müssen reale Impressumsdaten eingesetzt werden.
