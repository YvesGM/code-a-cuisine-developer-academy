# Firebase Realtime Database

Firebase Realtime Database ist die einzige persistente Datenbank von Code-a-Cuisine. Angular greift nicht direkt darauf zu; Lesen und Schreiben erfolgen ausschließlich über n8n.

## Datenbank

```text
https://code-a-cuisine-2be14-default-rtdb.europe-west1.firebasedatabase.app
```

## Datenpfade

```text
/code-a-cuisine/recipes/<recipe-id>
/code-a-cuisine/favorites/<recipe-id>/count
/code-a-cuisine/ingredient-catalog/<ingredient-key>
/code-a-cuisine/quota/<YYYY-MM-DD>/globalUsedRecipes
/code-a-cuisine/quota/<YYYY-MM-DD>/byIp/<ip-key>/usedRecipes
/code-a-cuisine/workflow-runs/<execution-id>/<stage>
```

## Service Account

Das Firebase-Admin-Service-Account-JSON darf nicht committed werden. In n8n wird ein Google/Firebase-Credential mit diesen Scopes benötigt:

```text
https://www.googleapis.com/auth/userinfo.email
https://www.googleapis.com/auth/firebase.database
```

## Security Rules

Da nur der n8n-Service-Account zugreift, können die öffentlichen Regeln geschlossen bleiben:

```json
{
  "rules": {
    ".read": false,
    ".write": false
  }
}
```
