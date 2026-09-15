# Code-a-Cuisine

Code-a-Cuisine ist eine Angular-Anwendung zur KI-gestützten Rezeptgenerierung aus vorhandenen Zutaten. Das Frontend kommuniziert ausschließlich mit n8n. n8n übernimmt Validierung, Gemini-Aufruf und alle Zugriffe auf Firebase Realtime Database.

## Architektur

```text
Angular Components
        ↓
Angular Services
        ↓
       n8n
   ├─ Gemini
   └─ Firebase Realtime Database
```

Es gibt eine persistente Datenbank: Firebase Realtime Database. Angular greift nicht direkt auf Firebase zu.

## Angular-Struktur

```text
src/app/
├─ components/   Seitenkomponenten, jeweils im eigenen Ordner
├─ shared/       wiederverwendete UI-Komponenten und UI-Assets
├─ services/     State und alle n8n-Aufrufe
├─ models/       gemeinsame Interfaces und Types
├─ guards/       Route Guards
├─ config/       zentrale UI-/Domain-Konstanten
├─ app.routes.ts
└─ app.ts
```

Jede Seitenkomponente enthält TypeScript, HTML und SCSS gemeinsam in ihrem eigenen Ordner. Die Datenflüsse bleiben direkt und nachvollziehbar.

## Services

- `AppStateService`: aktueller Zutaten-, Preference- und Generation-State.
- `RecipeService`: Generate, Library, Detail und Favorites über n8n.
- `IngredientService`: Zutatenkatalog und Usage-Zähler über n8n/Firebase.
- `QuotaService`: sichtbarer Tagesquota-Status über n8n/Firebase.

## Firebase

Persistente Pfade:

```text
/code-a-cuisine/recipes/<recipe-id>
/code-a-cuisine/favorites/<recipe-id>/count
/code-a-cuisine/ingredient-catalog/<ingredient-key>
/code-a-cuisine/quota/<YYYY-MM-DD>/...
/code-a-cuisine/workflow-runs/<execution-id>/...
```

Angular kennt keine Firebase-Credentials. Alle Zugriffe laufen über n8n mit dem Firebase-Service-Account.

## n8n Workflows

Unter `n8n/workflows/` liegen:

- `Code-a-Cuisine - Recipe Generation.json`
- `Code-a-Cuisine - Recipe Library.json`
- `Code-a-Cuisine - Ingredient Catalog.json`
- `Code-a-Cuisine - Quota Status.json`
- `Code-a-Cuisine - Error Notification.json`

## Entwicklung

```bash
npm ci
npm start
```

Abschlussprüfung:

```bash
npm run lint
npm test -- --watch=false
npm run build
```
