# Code-a-Cuisine

Code-a-Cuisine unterstützt die Resteverwertung: Nutzer erfassen vorhandene Lebensmittel und erhalten exakt drei Rezeptvorschläge nach Portionen, Aufwand, Cuisine, Diet und Anzahl der Kochhelfer. Alle erfolgreich generierten Rezepte werden dauerhaft in **Firebase Realtime Database** gespeichert und über eine öffentliche Bibliothek ohne Account bereitgestellt.

## Aktueller Stand

Die funktionale Angular-Basis sowie die n8n-Automation sind vorbereitet. Vier importierbare Code-a-Cuisine-Workflows liegen unter `n8n/workflows/` und verwenden die bestehenden n8n-Credentials für Supabase, Gemini, SMTP und den Google Service Account.

Produktiver Datenfluss:

```text
Angular
→ n8n Request Validation
→ IP-/Global-Quota in Supabase
→ Gemini
→ n8n AI Validation
→ Firebase Recipe Persistenz
→ Angular Response Validation
→ Results

Public Library / Recipe Detail
→ n8n Library API
→ Firebase Realtime Database
```

Supabase bleibt ausschließlich für Quota, Throttling und Workflow-Audit-Logs bestehen. Die Academy-Vorgabe zur Rezeptpersistenz wird wörtlich mit Firebase erfüllt.

## Features

- Ingredient-CRUD mit stabilen IDs, positiven Mengen und zentralen Einheiten.
- Portionen 1–12, Default 2.
- Kochhelfer 1–3, Default 1.
- Difficulty: Schnell bis 20, Mittel 20–45, Aufwendig ab 45 Minuten.
- Cuisine: Deutsch, Italienisch, Japanisch, Indisch, Gourmet/Fine Dining, Fusion.
- Diet: Vegetarisch, Vegan, Keto, Keine Einschränkung.
- Exakt drei unterschiedliche Rezeptvorschläge je Generierung.
- Mindestens 70 % eindeutige User-Zutaten pro Rezept.
- Maximal drei klar getrennte zusätzliche Basiszutaten.
- Nutrition pro Portion und Gesamtrezept mit kcal sowie Makros in Gramm und Prozent.
- Chronologische Directions mit Helferzuordnung, Parallelgruppen und optionalen Wartezeiten.
- Öffentliche Rezeptbibliothek mit Cuisine-Filter und Pagination ab mehr als 20 Einträgen.
- Recipe-Detail unabhängig von der letzten Generierung.
- IP-Quota: 3 Rezepte pro IP/Tag.
- Globales Tageslimit: 12 Rezepte/Tag.
- Kurzes serverseitiges Throttling vor KI-Aufrufen.
- n8n-Logging und SMTP-Fehlerbenachrichtigung.
- Impressum mit gekennzeichneten Platzhaltern.

## Architektur

`FlowState` besitzt ausschließlich den aktuellen Generierungsflow. Persistente Recipes werden durch n8n nach erfolgreicher Validierung in Firebase geschrieben. Die öffentliche Library liest Firebase ebenfalls über n8n; dadurch befinden sich keinerlei Firebase-Service-Credentials oder Supabase-Keys im Angular-Bundle.

Im Development ohne n8n-Konfiguration liefert `MockGenerationProvider` deterministische Testdaten und `InMemoryRecipeRepository` hält diese nur für die laufende Sitzung.

## n8n Workflows

Unter `n8n/workflows/`:

- `Code-a-Cuisine - Recipe Generation.json`
- `Code-a-Cuisine - Recipe Library.json`
- `Code-a-Cuisine - Quota Status.json`
- `Code-a-Cuisine - Error Notification.json`

Der Generation-Workflow übernimmt Request-/IP-Validierung, Quota, Gemini, zweite Business-Validierung, Firebase-Persistenz, Audit-Logging und kontrollierte Fehlerantworten.

Der Library-Workflow liefert Recipe-Detail und paginierte/filterbare öffentliche Bibliotheksdaten aus Firebase, ohne Firebase-Credentials an Angular auszugeben.

## Firebase

Code-a-Cuisine verwendet die bestehende Firebase Realtime Database und legt Daten unter folgendem Pfad ab:

```text
/code-a-cuisine/recipes/<recipe-id>
```

Ein Record enthält `schemaVersion`, `createdAt` und den vollständigen validierten Recipe-Payload.

Unter `firebase/` liegen:

- `code-a-cuisine.initial.json` – optionaler Initialimport unter dem Node `/code-a-cuisine`
- `README.md` – genaue Firebase-Schritte

Produktive Writes und Reads erfolgen serverseitig über das bestehende Google-Service-Account-Credential in n8n.

## Supabase

Supabase wird weiterhin für folgende serverseitige Infrastruktur genutzt:

- `code_a_cuisine.generation_quota_claims`
- `code_a_cuisine.workflow_runs`
- Quota-RPCs

Die frühere `code_a_cuisine.recipes`-Tabelle wird durch eine Folgemigration entfernt, weil Recipes nun verbindlich in Firebase liegen.

## Runtime-Konfiguration für SFTP

`public/runtime-config.js` ist absichtlich in `.gitignore` und wird auf dem SFTP mit ausgeliefert. Sie enthält nur die öffentliche n8n-Basis-URL:

```js
window.__CODE_A_CUISINE_CONFIG__ = {
  n8nWebhookBaseUrl: 'https://<deine-n8n-domain>/webhook',
};
```

Firebase-/Supabase-Service-Credentials, Datenbankpasswörter, AI-Secrets und SMTP-Secrets gehören ausschließlich in n8n-Credentials.

## Stack

- Angular 22
- Standalone Components
- Angular Router
- Reactive Forms
- Signals
- TypeScript strict
- SCSS
- Vitest
- ESLint
- n8n
- Gemini
- Firebase Realtime Database – Recipe Persistenz
- Supabase – Quota und Workflow-Audit

## Projektstruktur

```text
src/app/core/       Domain-Models, Config, FlowState, Provider, Validation, Quota, Repository
src/app/pages/      Userflow, öffentliche Library, Recipe Detail, Impressum
src/app/shared/     Wiederverwendete Recipe-/Library-Darstellung
public/assets/      Figma-Assets
public/runtime-config.js
firebase/           Firebase-Initialisierung/Dokumentation
docs/               Projektdokumentation
n8n/workflows/      Importierbare n8n-Workflows
supabase/           CLI-Konfiguration und Quota-/Audit-Migrationen
AGENTS.md           Verbindliche Arbeitsregeln
```

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

## Noch offen

- realer Firebase/n8n E2E-Smoke-Test
- finale Figma-Umsetzung
- finale Responsive-/Touch-Optimierung
- Loading-Animation aus Figma
- Cross-Browser-Abschlussprüfung
- reale Impressumsdaten
- GitHub-Link und finale Academy-Abgabe
