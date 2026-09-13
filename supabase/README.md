# Supabase

Code-a-Cuisine nutzt die bestehende Supabase-Datenbank für Quota, Throttling, Workflow-Audit und den dynamischen Ingredient-Catalog. Recipe-Persistenz erfolgt gemäß Academy-Checkliste weiterhin in Firebase.

## Code-a-Cuisine-Migrationen

Historisch wurde zunächst `code_a_cuisine.recipes` vorbereitet. Die Folgemigration `20260911150000_remove_code_a_cuisine_recipe_library.sql` entfernt diese Tabelle wieder. Die Migration History bleibt unverändert und nachvollziehbar.

Weiter bestehen:

- `generation_quota_claims`
- `workflow_runs`
- `ingredient_catalog`
- Quota-RPCs für Claim, Release, Complete und Status
- Catalog-RPCs `list_ingredient_catalog` und `register_ingredient`

## Remote anwenden

```powershell
npx supabase migration list
npx supabase db push
```

`code_a_cuisine` muss als Exposed Schema verfügbar bleiben, weil n8n die Quota-/Audit-/Catalog-RPCs und Tabellen über die Supabase Data API anspricht.

Angular enthält keine Supabase-URL und keinen Supabase-Publishable-Key mehr.
