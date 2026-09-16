# 01 – Architecture

## Angular

| Area | Responsibility |
| --- | --- |
| `components/` | Page components, each in its own folder |
| `shared/` | Reusable UI components and UI assets |
| `services/app-state.service.ts` | Current generation flow |
| `services/recipe.service.ts` | Generate, Library, Detail, Favorite |
| `services/ingredient.service.ts` | Ingredient Catalog |
| `services/quota.service.ts` | Quota status |
| `models/app.models.ts` | Shared data contracts |
| `config/app.constants.ts` | Options, limits, and webhook paths |
| `guards/flow.guards.ts` | Navigation within the generation flow |

The Angular structure intentionally stays direct: UI belongs in components, while state and external communication belong in services.

## Data Flow

```text
Component
→ Angular Service
→ n8n Webhook
→ Firebase / Gemini
```

## Generation

```text
PreferencesComponent
→ AppStateService.generate()
→ RecipeService.generate()
→ n8n Request Validation
→ Firebase Quota Read
→ Gemini
→ AI Validation
→ Firebase Recipe Write
→ Firebase Quota Update
→ ResultsComponent
```

## Library

```text
Cookbook / Cuisine / Recipe Detail
→ RecipeService
→ n8n
→ Firebase recipes + favorites
```

## Ingredient Catalog

`IngredientService` loads the catalog once and then filters it locally. New usages are stored through n8n as Firebase increments.

## Error Handling

Expected errors receive controlled HTTP responses. Technical workflow errors are logged in Firebase under `workflow-runs`; relevant errors can also trigger SMTP notifications.
