# 09 – n8n Final Steps

## 1. Workflows importieren

Alle fünf JSON-Dateien aus `n8n/workflows/` importieren.

## 2. Credentials zuordnen

Firebase Service Account an alle Firebase HTTP Request Nodes binden.

Gemini-Credential an:

```text
Generate 3 Recipes with Gemini
```

SMTP-Credential an alle `Email ... Error` Nodes binden.

## 3. Firebase prüfen

Erwartete Pfade nach Tests:

```text
/code-a-cuisine/recipes
/code-a-cuisine/favorites
/code-a-cuisine/ingredient-catalog
/code-a-cuisine/quota
/code-a-cuisine/workflow-runs
```

## 4. Webhooks aktivieren

Erwartete öffentliche Pfade:

```text
/webhook/code-a-cuisine-generate
/webhook/code-a-cuisine-library
/webhook/code-a-cuisine-favorite
/webhook/code-a-cuisine-ingredients
/webhook/code-a-cuisine-quota
```

## 5. Smoke-Test

Generate → drei Firebase-Rezepte → Results → Cookbook → Detail → Favorite → Quota → Ingredient Catalog.

Danach mindestens einen kontrollierten Fehlerpfad prüfen, damit Log + SMTP bestätigt sind.
