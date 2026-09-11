# Supabase

Dieses Projekt ist mit einer bereits bestehenden, gemeinsam genutzten Supabase-Datenbank verknüpft. Die bereits vorhandenen Migrationen für andere Projekte bleiben unverändert im Repository. Code-a-Cuisine besitzt ausschließlich das eigene PostgreSQL-Schema `code_a_cuisine`.

## Migrationen

Die neue Code-a-Cuisine-Migration ist:

```text
supabase/migrations/20260911124500_create_code_a_cuisine_recipe_library.sql
```

Sie erstellt:

```text
code_a_cuisine.recipes
```

inklusive Constraints, Indizes, Grants und RLS. Poll-App-/Issue-Collector-Migrationen werden nicht verändert.

Nach dem Prüfen der Migrationsliste kann die neue Migration regulär auf das bereits verknüpfte Remote-Projekt angewendet werden:

```powershell
npx supabase migration list
npx supabase db push
```

## Data API für das Custom Schema

Das Remote-Supabase-Projekt muss `code_a_cuisine` zusätzlich als **Exposed schema** für die Data API freigeben. Vorhandene Exposed Schemas anderer Projekte nicht entfernen.

Im Dashboard unter den Data-API-Einstellungen die bestehende Liste um folgenden Eintrag ergänzen:

```text
code_a_cuisine
```

Der Angular-Adapter setzt bei Reads `Accept-Profile: code_a_cuisine` und bei Writes `Content-Profile: code_a_cuisine`.

## Keine Credentials im Repository

Project URL und Publishable Key werden **nicht** in TypeScript, JSON, `.env` oder andere versionierte Projektdateien geschrieben.

Vor `npm start` beziehungsweise einem Build werden die öffentlichen Werte ausschließlich aus Prozess-Umgebungsvariablen gelesen:

```text
CODE_A_CUISINE_SUPABASE_URL
CODE_A_CUISINE_SUPABASE_PUBLISHABLE_KEY
CODE_A_CUISINE_SUPABASE_SCHEMA
```

`CODE_A_CUISINE_SUPABASE_SCHEMA` ist optional und fällt auf `code_a_cuisine` zurück.

Das npm-Script erzeugt daraus lokal `public/runtime-config.js`. Diese Datei ist in `.gitignore` ausgeschlossen und darf nicht committed werden. Fehlen URL oder Publishable Key, verwendet Development weiterhin das In-Memory-Repository. Production besitzt keinen stillen In-Memory-Fallback.

Secret-/Service-Role-Keys und das Datenbankpasswort gehören niemals in Angular. Spätere privilegierte Schreibvorgänge über n8n erhalten ihre Server-Credentials ausschließlich in n8n.
