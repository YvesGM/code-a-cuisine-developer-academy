# 03 – Datenverträge

Verbindliche Quelle: `src/app/core/models.ts`. Zentrale Regeln: `config.ts` und `response-validation.ts`.

## Versionierung

Angular↔n8n verwendet `schemaVersion: 2`. Der Request enthält `clientRequestId`, Zutaten, `servings`, `cookCount` und Preferences. Der Response enthält exakt drei vollständige Recipes; n8n ergänzt nach erfolgreicher Firebase-Persistenz `persisted: true`.

## Request

```json
{
  "schemaVersion": 2,
  "clientRequestId": "unique-request-id",
  "ingredients": [{ "id": "ingredient-123", "name": "Pasta", "amount": 120, "unit": "g" }],
  "servings": 2,
  "cookCount": 1,
  "preferences": { "difficulty": "quick", "cuisine": "italian", "diet": "none" }
}
```

## Recipe-Regeln

- exakt drei eindeutige Recipes mit Rängen 1–3
- Preference-Match für Cuisine, Difficulty und Diet
- quick 1–20, medium 20–45, complex ab 45 Minuten
- mindestens 70 % eindeutige User-Ingredient-IDs
- keine unbekannten oder doppelten `sourceIngredientId`
- max. drei getrennte `additionalIngredients`
- Nutrition pro Portion + Gesamtrezept, mathematisch konsistent zu `servings`
- Directions lückenlos, anfängertauglich, Cook IDs innerhalb `1..cookCount`
- bei mehreren Helfern mindestens eine konfliktfreie Parallelgruppe und Aufgaben für jede Person

## Firebase-Persistenzvertrag

n8n schreibt nach vollständiger Validierung atomar per PATCH nach:

```text
/code-a-cuisine/recipes/<recipe-id>
```

Record:

```json
{
  "schemaVersion": 2,
  "createdAt": "2026-09-11T12:00:00.000Z",
  "payload": {
    "id": "request-id-1",
    "title": "...",
    "cuisine": "italian",
    "difficulty": "quick",
    "diet": "none",
    "cookingTimeMinutes": 18,
    "servings": 2,
    "cookCount": 1,
    "nutrition": {},
    "ingredients": [],
    "additionalIngredients": [],
    "directions": [],
    "rank": 1
  }
}
```

`payload.id` entspricht dem Firebase-Key. Angular liest Firebase nicht direkt, sondern über `code-a-cuisine-library`; n8n sortiert nach `createdAt`, filtert Cuisine und paginiert mit Page Size 20. Angular validiert den zurückgegebenen Payload erneut. Der Library-Owner ergänzt optional `favoriteCount` als nichtnegativen Integer; dieses Engagement-Feld gehört nicht zum Generation-Request. Listen-Antworten enthalten zusätzlich `topLiked` mit maximal sechs Rezepten aus der gesamten Firebase-Library, ausschließlich mit `favoriteCount > 0` und absteigend nach Favorite-Zahl sortiert.

Öffentliche Favorites werden getrennt vom Recipe-Payload gespeichert:

```text
/code-a-cuisine/favorites/<recipe-id>/count
```

`POST /webhook/code-a-cuisine-favorite` akzeptiert ausschließlich eine stabile Recipe-ID und inkrementiert den Zähler serverseitig.

## Quota-/Audit-Vertrag

Supabase bleibt für `generation_quota_claims`, `workflow_runs`, `ingredient_catalog` sowie die Quota-/Catalog-RPCs zuständig. Diese Daten sind keine Recipe-Persistenz. Catalog-List liefert `{ items: [{ name, usageCount }] }`; Register liefert `{ item: { name, usageCount } }`.
