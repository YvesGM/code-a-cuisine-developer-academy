# n8n Workflows

## Firebase-Verbindung

Die Firebase-nutzenden Workflows zeigen auf:

```text
https://code-a-cuisine-2be14-default-rtdb.europe-west1.firebasedatabase.app
```

Firebase-Credential in n8n:

```text
Code-a-Cuisine Firebase Service Account
```

Das Credential wird aus dem Firebase-Admin-Service-Account-JSON angelegt. Das private JSON bleibt außerhalb des Git-Repositories. Falls n8n die Credential-Referenz nach dem Workflow-Import nicht automatisch zuordnet, muss dieses Credential einmal in den folgenden zwei Nodes ausgewählt werden:

- `Code-a-Cuisine - Recipe Generation` → `Persist 3 Recipes in Firebase`
- `Code-a-Cuisine - Recipe Library` → `Read Recipes from Firebase`

## Workflows

- `Code-a-Cuisine - Recipe Generation.json`
- `Code-a-Cuisine - Recipe Library.json`
- `Code-a-Cuisine - Ingredient Catalog.json`
- `Code-a-Cuisine - Quota Status.json`
- `Code-a-Cuisine - Error Notification.json`

Quota, Audit und der dynamische Ingredient-Catalog liegen in Supabase. Recipes werden ausschließlich in Firebase gespeichert.
