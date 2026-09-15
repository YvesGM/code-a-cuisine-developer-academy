# 04 – Phase Plan

| Phase | Status | Inhalt |
| --- | --- | --- |
| 1 Angular UI | [x] | Seiten, Formulare, Responsive/Figma abgeschlossen |
| 2 n8n + Gemini | [x] | Generation, Validierung und kontrollierte Fehlerpfade implementiert |
| 3 Firebase | [x] | Recipes, Favorites, Catalog, Quota und Workflow-Logs laufen über Firebase Realtime Database |
| 4 Abschluss | [x] | Architektur bereinigt, Hauptflow geprüft und Abgabestand hergestellt |

## Finaler technischer Stand

- Angular verwendet eine einfache Components-/Services-Struktur.
- Angular kommuniziert ausschließlich mit n8n.
- Firebase Realtime Database ist die einzige persistente Datenbank.
- Die öffentlichen Webhook-Pfade bleiben stabil.
- Design und Responsive-Verhalten bleiben auf dem final geprüften Stand.

Vor dem finalen Push lokal einmal die bestehende Projektprüfung ausführen:

```bash
npm run check
```
