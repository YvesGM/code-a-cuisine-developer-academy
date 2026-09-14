# n8n Workflows

## Credential policy

The workflow exports in `n8n/workflows/` intentionally contain **no bound n8n credential IDs or credential names**. This keeps account-specific references out of Git while preserving every node, parameter, connection, note, webhook path and workflow branch.

After importing the workflows into n8n, assign the required credentials again in the affected nodes:

- **Supabase API credential**: quota claims/status, workflow audit logging and ingredient-catalog RPC nodes.
- **SMTP credential**: all `Email ... Error` nodes and the unhandled-error notification node.
- **Google API / Firebase service-account credential**: Firebase recipe reads/writes and favorite reads/increments.
- **Gemini / Google AI credential**: `Generate 3 Recipes with Gemini`.

No private key, API key, database password, access token or SMTP password belongs in the repository.

## Firebase connection

The Firebase nodes target:

```text
https://code-a-cuisine-2be14-default-rtdb.europe-west1.firebasedatabase.app
```

The Firebase Admin service-account JSON stays outside the Git repository and is configured only as an n8n credential.

Firebase credential assignment is required in:

- `Code-a-Cuisine - Recipe Generation` → `Persist 3 Recipes in Firebase`
- `Code-a-Cuisine - Recipe Library` → `Read Recipes from Firebase`
- `Code-a-Cuisine - Recipe Library` → `Read Favorite Counts`
- `Code-a-Cuisine - Recipe Library` → `Increment Favorite in Firebase`

## Workflows

- `Code-a-Cuisine - Recipe Generation.json`
- `Code-a-Cuisine - Recipe Library.json`
- `Code-a-Cuisine - Ingredient Catalog.json`
- `Code-a-Cuisine - Quota Status.json`
- `Code-a-Cuisine - Error Notification.json`

All exported nodes use descriptive English names and English notes. Quota, audit logging and the dynamic ingredient catalog remain in Supabase. Recipes and favorite counters are stored in Firebase.

The public generation and favorite webhooks define the currently approved browser origins. If the deployment domains change, update the corresponding `Allowed Origins (CORS)` option in n8n before publishing the workflow.
