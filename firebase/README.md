# Firebase Realtime Database

Firebase Realtime Database is the only persistent database used by Code-a-Cuisine. Angular does not access it directly; all reads and writes are handled through n8n.

## Database

```text
https://code-a-cuisine-2be14-default-rtdb.europe-west1.firebasedatabase.app
```

## Data Paths

```text
/code-a-cuisine/recipes/<recipe-id>
/code-a-cuisine/favorites/<recipe-id>/count
/code-a-cuisine/ingredient-catalog/<ingredient-key>
/code-a-cuisine/quota/<YYYY-MM-DD>/globalUsedRecipes
/code-a-cuisine/quota/<YYYY-MM-DD>/byIp/<ip-key>/usedRecipes
/code-a-cuisine/workflow-runs/<execution-id>/<stage>
```

## Service Account

The Firebase Admin service-account JSON must never be committed. n8n uses a Google/Firebase credential with these scopes:

```text
https://www.googleapis.com/auth/userinfo.email
https://www.googleapis.com/auth/firebase.database
```

## Security Rules

Because only the n8n service account accesses the database, the public rules can remain closed:

```json
{
  "rules": {
    ".read": false,
    ".write": false
  }
}
```
