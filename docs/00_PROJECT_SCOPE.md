# 00 – Project Scope

## Verbindlicher Funktionsumfang

Code-a-Cuisine generiert aus vorhandenen Zutaten exakt drei unterschiedliche Rezepte. Der Request enthält Zutaten, Portionen, Kochhelfer, Difficulty, Cuisine und Diet.

Jedes valide Rezept nutzt mindestens 70 % der eindeutigen User-Zutaten, besitzt maximal drei getrennte zusätzliche Basiszutaten, respektiert den Difficulty-Zeitrahmen, enthält Nutrition pro Portion/Gesamtrezept und unterstützt Helferzuordnung, Parallelgruppen sowie Wartezeiten.

Die öffentliche Rezeptebibliothek zeigt alle dauerhaft in Firebase gespeicherten Rezepte ohne Account und paginiert ab mehr als 20 Einträgen.

## Produktiver Ablauf

```text
Angular
→ n8n
→ Request Validation
→ IP-/Global-Quota in Supabase
→ Gemini
→ AI Output Validation
→ Firebase Realtime Database Persistenz
→ Angular Response Validation
→ Results

Library / Recipe Detail
→ n8n Library API
→ Firebase Realtime Database
```

n8n persistiert produktive Rezepte serverseitig. Angular führt bei `persisted: true` keinen zweiten Insert aus.

## Development

Ohne n8n-Konfiguration bleiben deterministischer Mock-Provider und In-Memory-Repository für lokale Tests erhalten. Mock-Daten sind technische Fixtures.

## Nicht Teil der aktuellen Funktionsphase

- optionales Ingredient-Autocomplete
- Login/User-Accounts
- Likes / Most-Liked
- externe Nutrition-Datenbank
- finales Figma-Styling
- finale Responsive-/Touch-Optimierung
- Cross-Browser-Abschlussprüfung
