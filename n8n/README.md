# n8n Workflows

Code-a-Cuisine uses n8n as its only backend gateway. Persistent data is stored exclusively in Firebase Realtime Database.

## Required Credentials

Assign these credentials after importing the workflows:

- Google API / Firebase Service Account: all Firebase HTTP Request nodes.
- Gemini / Google AI: `Google Gemini Chat Model`.
- SMTP: all `Email ... Error` nodes.

The exports intentionally contain no account-specific credential IDs or secrets.

## Firebase

Database:

```text
https://code-a-cuisine-2be14-default-rtdb.europe-west1.firebasedatabase.app
```

Used paths:

```text
/code-a-cuisine/recipes
/code-a-cuisine/favorites
/code-a-cuisine/ingredient-catalog
/code-a-cuisine/quota
/code-a-cuisine/workflow-runs
```

## Workflows

- Recipe Generation: validates the request and client IP, checks the Firebase quota, generates exactly three recipes, validates the AI response, writes recipes and quota usage to Firebase, and returns the response.
- Recipe Library: reads recipes and favorites from Firebase and processes favorite increments.
- Ingredient Catalog: reads the Firebase catalog and increments usage counters.
- Quota Status: reads the daily counters from Firebase and returns the public quota status.
- Error Notification: writes unhandled workflow errors to Firebase and sends an SMTP notification.
