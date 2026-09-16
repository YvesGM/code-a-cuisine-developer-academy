# Code-a-Cuisine

Code-a-Cuisine is an Angular application for AI-assisted recipe generation based on available ingredients. The frontend communicates exclusively with n8n. n8n handles server-side validation, the Gemini request, and all access to the Firebase Realtime Database.

## Architecture

```text
Angular Components
        ↓
Angular Services
        ↓
       n8n
   ├─ Gemini
   └─ Firebase Realtime Database
```

There is exactly one persistent database: Firebase Realtime Database. Angular does not access Firebase directly.

## Angular Structure

```text
src/app/
├─ components/   Page components, each in its own folder
├─ shared/       Reusable UI components and UI assets
├─ services/     Application state and all n8n requests
├─ models/       Shared interfaces and types
├─ guards/       Route guards
├─ constants/    Central UI and domain constants
├─ app.routes.ts
└─ app.ts
```

Each page component keeps its TypeScript, HTML, and SCSS files together in its own folder. Data flows are intentionally kept direct and easy to follow.

## Services

- `AppStateService`: manages ingredients, preferences, and the current generation state.
- `RecipeService`: handles generation, library access, recipe details, and favorites through n8n.
- `IngredientService`: loads the ingredient catalog and updates usage counters through n8n and Firebase.
- `QuotaService`: loads the visible status of the daily usage limit through n8n and Firebase.

## Firebase

Persistent paths:

```text
/code-a-cuisine/recipes/<recipe-id>
/code-a-cuisine/favorites/<recipe-id>/count
/code-a-cuisine/ingredient-catalog/<ingredient-key>
/code-a-cuisine/quota/<YYYY-MM-DD>/...
/code-a-cuisine/workflow-runs/<execution-id>/...
```

Angular contains no Firebase credentials. All access is handled through n8n using the Firebase service account.

## n8n Workflows

The following workflows are stored under `n8n/workflows/`:

- `Code-a-Cuisine - Recipe Generation.json`
- `Code-a-Cuisine - Recipe Library.json`
- `Code-a-Cuisine - Ingredient Catalog.json`
- `Code-a-Cuisine - Quota Status.json`
- `Code-a-Cuisine - Error Notification.json`

## Development

Install dependencies and start the local development environment:

```bash
npm ci
npm start
```

## Final Check

```bash
npm run lint
npm test -- --watch=false
npm run build
```
