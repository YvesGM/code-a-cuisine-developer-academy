# 06 – Offene Entscheidungen

## Lokaler Figma-Export – Zugriff hergestellt

Die bereitgestellte Datei `Code à Cuisine.fig` (Export 11.09.2026, 18:51:45 UTC)
konnte lokal vollständig dekodiert werden: 2.745 Knoten, Seiten TN, Design und
Components sowie interne Bibliotheksdefinitionen. Die folgenden MCP-Blocker bleiben
historisch dokumentiert, verhindern die lokale Designanalyse aber nicht mehr.

- Widescreen: 1440px ausdrücklich in Figma-Notiz `14396:2786` vorgegeben.
- Mobile: Referenz 375px; Umschaltung bei 768px aus 721px breitem Preferences-Inhalt
  plus 48px Außenabstand abgeleitet, kein explizit beschrifteter Figma-Breakpoint.
- Fonts Ubuntu, Quicksand und Kreon liegen lokal unter `public/assets/fonts/` und werden über `src/styles/_fonts.scss` eingebunden.
- Recipe-Favorites sind entschieden und laufen über RecipeRepository → n8n → Firebase.
- Most-liked Recipes sind umgesetzt und werden aus den Firebase-Favorite-Zählern abgeleitet.
- Weiter offen bleiben Login/Logout, Prüfung ausreichender Portionsmengen und ein neuer Ingredient-Sortiermodus. Bestehende Validierung und Reihenfolge bleiben Owner.
- Die originale Loading-GIF sowie ein statischer Reduced-Motion-Fallback sind im Projekt eingebunden.
- Lokaler Headless-Browserstart durch Ausführungsrichtlinie abgewiesen;
  Browser-/Screenshot-Validierung bleibt dadurch offen.

## Figma-Zugriff – blockiert am 11.09.2026

Aktuelle Referenz ersetzt den ursprünglichen Link: Datei `Q1BfHvaUUZM1hoPKCE4dyC`,
Node `1:16`. Der Design-Context-Aufruf liefert jetzt
“You've reached the Figma MCP tool call limit on the Starter plan.”
Damit sind die Dateiberechtigungen des neuen Links noch nicht verifiziert.
Auch dessen direkter Webabruf liefert kein Design. Zur Fortsetzung werden wieder
verfügbare MCP-Aufrufe oder ein lokaler Figma-Export mit Designwerten benötigt.

Die Figma-MCP-Verbindung verwendet `der.schnief@gmail.com` (Handle `schnief`,
View-Seat im Starter-Team). `get_design_context` und `get_metadata` für
Datei `sWW9yR4JmAzb3h5hu0hSrz`, Node `1:16`, verweigern den Zugriff:
“Looks like you don't have edit access to this file. The file owner can share it
with you and make you an editor.” Auch der direkte Webabruf liefert kein Design.
Erforderlich ist ein für die Verbindung zugängliches Figma-Dokument; laut
Toolmeldung muss der Owner Editor-Zugriff freigeben. Keine Designwerte oder
Breakpoints aus unbestätigten Annahmen ableiten.
Die Übergabe steht in [04_PHASE_PLAN.md](04_PHASE_PLAN.md#figma-implementation-status).

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
| Figma                 | strukturell umgesetzt; finaler Browser-/Screenshot-Abgleich offen |
| Responsive / Touch    | umgesetzt; finales Device-/Browser-QA offen         |
| Loading Animation     | Figma-GIF + Reduced-Motion-Fallback eingebunden      |
| Impressum             | reale Angaben vor Veröffentlichung einsetzen        |
| GitHub-Link           | nach Repository-Veröffentlichung in README ergänzen |
| Cross-Browser         | Abschlussprüfung                                    |
