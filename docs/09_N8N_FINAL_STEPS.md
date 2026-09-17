# 09 – n8n Final Steps

## 1. Import Workflows

Import all five JSON files from `n8n/workflows/`.

## 2. Assign Credentials

Assign the Firebase Service Account to every Firebase HTTP Request node.

Assign the Gemini credential to:

```text
Google Gemini Chat Model
```

Assign the SMTP credential to every `Email ... Error` node.

## 3. Verify Firebase

Expected paths after testing:

```text
/code-a-cuisine/recipes
/code-a-cuisine/favorites
/code-a-cuisine/ingredient-catalog
/code-a-cuisine/quota
/code-a-cuisine/workflow-runs
```

## 4. Activate Webhooks

Expected public paths:

```text
/webhook/code-a-cuisine-generate
/webhook/code-a-cuisine-library
/webhook/code-a-cuisine-favorite
/webhook/code-a-cuisine-ingredients
/webhook/code-a-cuisine-quota
```

## 5. Smoke Test

Generate → three Firebase recipes → Results → Cookbook → Detail → Favorite → Quota → Ingredient Catalog.

Then verify at least one controlled error path so that both logging and SMTP notification are confirmed.
