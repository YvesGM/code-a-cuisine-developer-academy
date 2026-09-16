# 03 – Data Contracts

The authoritative TypeScript source is `src/app/models/app.models.ts`.

## Generation Request

```json
{
  "schemaVersion": 2,
  "clientRequestId": "uuid",
  "ingredients": [],
  "preferences": {
    "difficulty": "quick|medium|complex",
    "cuisine": "german|italian|indian|japanese|gourmet|fusion",
    "diet": "vegetarian|vegan|keto|none"
  },
  "servings": 2,
  "cookCount": 1
}
```

## Generation Response

```json
{
  "schemaVersion": 2,
  "clientRequestId": "uuid",
  "recipes": [],
  "persisted": true
}
```

n8n validates both the request and the AI output server-side. Successful generations return exactly three recipes and are stored in Firebase before the browser receives a successful response.

## Library

`GET code-a-cuisine-library?page=1&cuisine=italian`

```json
{
  "items": [],
  "topLiked": [],
  "total": 0,
  "page": 1,
  "pages": 1
}
```

With `id=<recipe-id>`, the same endpoint returns `{ "recipe": ... }`.

## Ingredient Catalog

List: `{ "action": "list" }` → `{ "items": [{ "name": "Pasta", "usageCount": 4 }] }`

Register: `{ "action": "register", "name": "Pasta" }` → `{ "ok": true }`

## Quota

Quota data is stored exclusively in Firebase. Each successful generation counts as three recipe units: a maximum of 3 per IP/day and 12 globally/day.
