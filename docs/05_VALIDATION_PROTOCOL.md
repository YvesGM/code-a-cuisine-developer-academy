# 05 – Validation Protocol

## Vor Abgabe

1. Firebase-Credential in allen Firebase HTTP Nodes zuordnen.
2. Gemini-Credential im Generation-Workflow zuordnen.
3. SMTP-Credential in Error-Mail-Nodes zuordnen.
4. Alle fünf Workflows aktivieren.
5. Quota-Status testen.
6. Generation mit gültiger IP ausführen.
7. Prüfen, dass exakt drei Rezepte unter `/code-a-cuisine/recipes` landen.
8. Cookbook und Recipe Detail gegen Firebase testen.
9. Favorite-Increment prüfen.
10. Ingredient-Catalog-Usage prüfen.
11. Tagesquota und verständliche 429-Antwort testen.

## Erwartete Fehlerpfade

- ungültiger Request → 400
- IP-/Global-Quota → 429
- Firebase-Quota-Fehler → 503 + Mail
- Gemini-Providerfehler → kontrollierter 5xx-Fehler + Log/Mail
- ungültige AI-Ausgabe → 422 + Log/Mail
- Firebase-Persistenzfehler → kontrollierter 5xx-Fehler + Log/Mail
- Firebase-Libraryfehler → kontrollierter 5xx-Fehler + Log/Mail

## Codeprüfung

```bash
npm run lint
npm test -- --watch=false
npm run build
```
