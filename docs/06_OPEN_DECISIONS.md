# 06 – Offene Entscheidungen

## Geklärt

- exakt drei Recipes je Generierung
- Schema 2
- Portionen 1–12, Default 2
- Kochhelfer 1–3, Default 1
- mindestens 70 % User-Zutaten
- maximal drei zusätzliche Basiszutaten
- Nutrition pro Portion und Gesamtrezept
- öffentliche Library ohne Account
- **Firebase Realtime Database als Recipe-Persistenz gemäß Academy-Checkliste**
- Supabase nur für Quota, Throttling und Workflow-Audit
- Pagination 20
- IP-Quota 3 Recipes/Tag
- globales Tageslimit 12 Recipes/Tag
- IPv4/IPv6-Prüfung in n8n
- produktive Recipe-Writes/Reads serverseitig über n8n

## Quota-Auslegung

Eine Generation erzeugt exakt drei Rezepte. IP-Limit 3 entspricht einer erfolgreichen Generierung pro IP/Tag; Systemlimit 12 maximal vier erfolgreichen Generierungen. Fehler geben Claims frei. Dieselbe `clientRequestId` kann keinen zweiten KI-Aufruf auslösen.

## Weiterhin offen / Abschlussphase

| Thema                 | Stand                                               |
| --------------------- | --------------------------------------------------- |
| Finale KI-Qualität    | realer E2E-Test erforderlich                        |
| Nutrition-Genauigkeit | Modellschätzung; keine externe Nährwertdatenbank    |
| Figma                 | finale visuelle Umsetzung folgt                     |
| Responsive / Touch    | finale Designphase                                  |
| Loading Animation     | Figma-Asset/Animation folgt                         |
| Impressum             | reale Angaben vor Veröffentlichung einsetzen        |
| GitHub-Link           | nach Repository-Veröffentlichung in README ergänzen |
| Cross-Browser         | Abschlussprüfung                                    |
