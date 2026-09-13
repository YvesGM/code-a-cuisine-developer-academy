# 01 – Architektur

## Owner

| Owner                         | Verantwortung                                                            |
| ----------------------------- | ------------------------------------------------------------------------ |
| `core/models.ts`              | Domain-Models, Schema-2-Request/Response, Quota-Status                   |
| `core/config.ts`              | zentrale Optionskeys, Limits, Difficulty-Zeiten, n8n-Pfade               |
| `core/business.ts`            | Eingabeprüfung, Request-Mapping, Coverage, Arbeitsaufteilung, Pagination |
| `core/flow-state.ts`          | aktueller Workflow-State, Results und kontrollierte UI-Fehler            |
| `core/generation.ts`          | Mock-/n8n-Provider und validierender GenerationService                   |
| `core/quota.ts`               | read-only Quota-Status für transparente Frontend-Anzeige                 |
| `core/ingredient-catalog.ts`  | einmalig geladener n8n/Supabase-Catalog + Usage-Registrierung            |
| `core/response-validation.ts` | letzte Vertrauensgrenze vor Angular-State/Library                        |
| `core/recipe-repository.ts`   | n8n-basierte öffentliche Firebase-Library + Development-InMemory         |
| `n8n/workflows/`              | Validation, Quota, KI, Firebase-Persistenz/Library, Logging, Fehleralarm |
| `supabase/migrations/`        | Quota-/Audit-/Ingredient-Catalog-Tabellen und RPCs                       |

## Produktiver Datenfluss

```text
Angular Form
→ FlowState
→ GenerationService
→ N8nGenerationProvider
→ POST /webhook/code-a-cuisine-generate
→ n8n Request Validation
→ Supabase claim_generation_quota
→ Gemini
→ n8n AI Output Validation
→ Firebase /code-a-cuisine/recipes PATCH
→ complete_generation_quota
→ Supabase Workflow Log
→ GenerationResponse { persisted: true }
→ Angular Response Validation
→ FlowState / Results
```

Produktive Rezepte werden genau einmal geschrieben: serverseitig im n8n-Workflow.

## Öffentliche Library

```text
Cookbook / Recipe Detail
→ RecipeRepository
→ GET /webhook/code-a-cuisine-library
→ n8n Google Service Account
→ Firebase Realtime Database
```

Angular erhält keine Firebase-Credentials. Jeder zurückgegebene Recipe-Payload wird erneut durch `validateStoredRecipe` geprüft.

## Development

Ohne konfigurierte n8n-Basis verwendet Development `MockGenerationProvider` + `InMemoryRecipeRepository`. Eine deployte App fällt nicht still auf Demo-Daten zurück.

## Quota und Audit

Supabase bleibt serverseitig für atomare Quota-Claims, Throttling, `workflow_runs` und den dynamischen Ingredient-Catalog verantwortlich. Angular lädt den Catalog über n8n einmal pro App-Sitzung und filtert Prefix-Treffer anschließend lokal; neue Ingredient-Verwendungen werden über eine atomare RPC hochgezählt.

## Fehlerbehandlung

Erwartete Fehler besitzen kontrollierte Branches: Request, Quota, Quota-Backend, AI-Provider, AI-Validation, Firebase-Persistenz und Firebase-Library. Interne Fehler werden in Supabase geloggt; technische Fehler senden SMTP-Benachrichtigungen. Der Error-Trigger-Workflow bleibt Last Resort.

## Runtime-Konfiguration

Der Browser erhält ausschließlich die öffentliche n8n Webhook Base URL aus `public/runtime-config.js`. Persistenz-Credentials bleiben in n8n.


## Ingredient-Catalog

```text
Ingredients Page
→ IngredientCatalogService
→ POST /webhook/code-a-cuisine-ingredients { action: list | register }
→ n8n
→ Supabase list_ingredient_catalog / register_ingredient
```

Der Browser besitzt keinen Supabase-Key. Der vollständige Catalog wird einmalig geladen; Tastatureingaben erzeugen keine weiteren Backend-Requests.
