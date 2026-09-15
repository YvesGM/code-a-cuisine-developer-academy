# 03 – Datenverträge

Verbindliche TypeScript-Quelle ist `src/app/models/app.models.ts`.

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

n8n validiert Request und AI-Ausgabe serverseitig. Erfolgreiche Generierungen liefern exakt drei Rezepte und werden vor der erfolgreichen Browser-Antwort in Firebase gespeichert.

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

Mit `id=<recipe-id>` liefert derselbe Endpunkt `{ "recipe": ... }`.

## Ingredient Catalog

List: `{ "action": "list" }` → `{ "items": [{ "name": "Pasta", "usageCount": 4 }] }`

Register: `{ "action": "register", "name": "Pasta" }` → `{ "ok": true }`

## Quota

Quota wird ausschließlich in Firebase gespeichert. Pro erfolgreicher Generierung werden drei Recipe-Einheiten gezählt: maximal 3 pro IP/Tag und 12 systemweit/Tag.
