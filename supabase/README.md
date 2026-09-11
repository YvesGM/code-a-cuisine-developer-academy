# Supabase

Code-a-Cuisine nutzt die bestehende Supabase-Datenbank weiterhin ausschließlich für Quota, Throttling und Workflow-Audit. Recipe-Persistenz erfolgt gemäß Academy-Checkliste in Firebase.

## Code-a-Cuisine-Migrationen

Historisch wurde zunächst `code_a_cuisine.recipes` vorbereitet. Die Folgemigration `20260911150000_remove_code_a_cuisine_recipe_library.sql` entfernt diese Tabelle wieder. Die Migration History bleibt unverändert und nachvollziehbar.

Weiter bestehen:

- `generation_quota_claims`
- `workflow_runs`
- Quota-RPCs für Claim, Release, Complete und Status

## Remote anwenden

```powershell
npx supabase migration list
npx supabase db push
```

`code_a_cuisine` muss als Exposed Schema verfügbar bleiben, weil n8n die Quota-/Audit-RPCs und Tabellen über die Supabase Data API anspricht.

Angular enthält keine Supabase-URL und keinen Supabase-Publishable-Key mehr.
