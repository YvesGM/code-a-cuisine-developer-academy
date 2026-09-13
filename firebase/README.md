# Firebase Realtime Database

Code-a-Cuisine verwendet eine eigene Firebase Realtime Database. Angular greift nicht direkt auf Firebase zu; Lesen und Schreiben laufen serverseitig über n8n.

## Datenbank

```text
https://code-a-cuisine-2be14-default-rtdb.europe-west1.firebasedatabase.app
```

## Datenpfad

```text
/code-a-cuisine/recipes/<recipe-id>
/code-a-cuisine/favorites/<recipe-id>/count
```

Die Pfade werden beim ersten erfolgreichen n8n-Write automatisch erzeugt.

## Service Account

Das Firebase-Admin-Service-Account-JSON darf **nicht** in dieses Repository kopiert oder committed werden. Es wird ausschließlich verwendet, um in n8n ein Credential mit dem Namen

```text
Code-a-Cuisine Firebase Service Account
```

anzulegen.

Benötigte OAuth-Scopes für die Realtime Database REST API:

```text
https://www.googleapis.com/auth/userinfo.email
https://www.googleapis.com/auth/firebase.database
```

Die Workflow-Nodes `Persist 3 Recipes in Firebase`, `Read Recipes from Firebase`, `Read Favorite Counts` und `Increment Favorite in Firebase` müssen dieses Credential verwenden.

## Initialimport

`code-a-cuisine.initial.json` kann optional am Root der leeren Code-a-Cuisine-Realtime-Database importiert werden. Der Import erzeugt nur den `code-a-cuisine`-Metadatenknoten. Die Recipe-Daten werden ausschließlich von n8n geschrieben.

## Security Rules

Da Angular Firebase nicht direkt aufruft, können die Datenbankregeln geschlossen bleiben:

```json
{
  "rules": {
    ".read": false,
    ".write": false
  }
}
```

Der Service Account greift serverseitig über OAuth2 zu.
