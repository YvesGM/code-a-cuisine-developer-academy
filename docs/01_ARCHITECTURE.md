# 01 – Architektur

## Angular

| Bereich | Verantwortung |
| --- | --- |
| `components/` | Seitenkomponenten, jeweils mit eigenem Ordner |
| `shared/` | wiederverwendete UI-Komponenten und UI-Assets |
| `services/app-state.service.ts` | aktueller Generierungsflow |
| `services/recipe.service.ts` | Generate, Library, Detail, Favorite |
| `services/ingredient.service.ts` | Ingredient Catalog |
| `services/quota.service.ts` | Quota-Status |
| `models/app.models.ts` | gemeinsame Datenverträge |
| `config/app.constants.ts` | Optionen, Limits und Webhook-Pfade |
| `guards/flow.guards.ts` | Navigation im Generierungsflow |

Die Angular-Struktur bleibt bewusst direkt: UI in Components, Zustand und externe Kommunikation in Services.

## Datenfluss

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

Der Catalog wird über `IngredientService` einmal geladen und anschließend lokal gefiltert. Neue Verwendungen werden über n8n als Firebase-Increment gespeichert.

## Fehlerhandling

Erwartete Fehler erhalten kontrollierte HTTP-Antworten. Technische Workflow-Fehler werden in Firebase unter `workflow-runs` protokolliert; relevante Fehler können zusätzlich per SMTP gemeldet werden.
