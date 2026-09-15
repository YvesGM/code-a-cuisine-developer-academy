# n8n Workflows

Code-a-Cuisine verwendet n8n als einzigen Backend-Gateway. Persistente Daten werden ausschließlich in Firebase Realtime Database gespeichert.

## Benötigte Credentials

Nach dem Import der Workflows zuordnen:

- Google API / Firebase Service Account: alle Firebase HTTP Request Nodes.
- Gemini / Google AI: `Generate 3 Recipes with Gemini`.
- SMTP: alle `Email ... Error` Nodes.

Die Exporte enthalten absichtlich keine account-spezifischen Credential-IDs oder Secrets.

## Firebase

Datenbank:

```text
https://code-a-cuisine-2be14-default-rtdb.europe-west1.firebasedatabase.app
```

Verwendete Bereiche:

```text
/code-a-cuisine/recipes
/code-a-cuisine/favorites
/code-a-cuisine/ingredient-catalog
/code-a-cuisine/quota
/code-a-cuisine/workflow-runs
```

## Workflows

- Recipe Generation: validiert Request und IP, prüft Firebase-Quota, erzeugt exakt drei Rezepte, validiert die AI-Antwort, schreibt Rezepte und Quota nach Firebase und gibt die Response zurück.
- Recipe Library: liest Rezepte/Favorites aus Firebase und verarbeitet Favorite-Increments.
- Ingredient Catalog: liest den Firebase-Katalog und erhöht Usage-Zähler.
- Quota Status: liest die Tageszähler aus Firebase und liefert den öffentlichen Status.
- Error Notification: schreibt unhandled Workflow-Fehler nach Firebase und verschickt eine SMTP-Meldung.
