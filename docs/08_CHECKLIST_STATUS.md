# 08 – Academy-Checkliste: aktueller Implementierungsstand

Stand: 11.09.2026. Grundlage ist der aktuelle Repository-Stand nach der strukturellen Figma-/Responsive-Umsetzung; finale Browser-/Device-QA bleibt offen.

Legende: `[x]` implementiert · `[~]` implementiert, reale E2E-/Abschlussprüfung noch offen · `[ ]` offen · `[-]` optional.

## Allgemeine Anforderungen

| Anforderung                                                 | Status | Nachweis / Restarbeit                                                                                                           |
| ----------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------- |
| GitHub Repository + README-Link                             | [ ]    | README vorhanden; finalen GitHub-Link vor Abgabe ergänzen.                                                                      |
| Semantisches HTML                                           | [x]    | Header, Nav, Main, Footer, Form, Fieldset, Article, Section, Listen und Definition Lists werden fachlich eingesetzt.            |
| Font-Size mindestens 16px / Kleingedrucktes mindestens 14px | [x]    | Normaler und interaktiver Text bleibt mindestens 16px; `.fine-print`/`small` mindestens 14px. |
| Angular Frontend                                            | [x]    | Angular 22, Standalone Components, Router, Reactive Forms, Signals.                                                             |
| JSDoc für Funktionen                                        | [x]    | Eigene fachliche Produktionsfunktionen/-methoden sind dokumentiert; ESLint-Strukturregeln schützen den Refactor-Stand.          |
| Alle generierten Rezepte in Firebase                        | [~]    | n8n Generation persistiert die drei validierten Recipes in Firebase RTDB; realen E2E-Write noch einmal vor Figma/Abgabe prüfen. |

## n8n-Anforderungen

| Anforderung                           | Status | Nachweis / Restarbeit                                                                                                   |
| ------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------- |
| n8n-Projekt in Git                    | [x]    | Vier aktuelle Workflow-Exporte liegen unter `n8n/workflows/`; alle vier sind aktiv exportiert.                         |
| Aussagekräftige Node-Namen            | [x]    | Generation, Library, Quota und Error Notification verwenden fachliche Node-Namen.                                       |
| Beschreibungstexte                    | [x]    | Alle exportierten Nodes besitzen aussagekräftige englische Notes.                                                       |
| Error Handling + Logging + E-Mail     | [~]    | Kontrollierte Fehlerbranches, Supabase-Audit, SMTP und Error-Workflow-Zuordnung sind vorhanden; realen Fehler-Smoke-Test noch durchführen. |
| Quota / Rate Limiting / Kostenairbag  | [~]    | IP-/Global-Quota, Throttling und Quota-Status-Error-Logging sind vorhanden; realen 429-Test noch durchführen.            |
| n8n validiert Angular-Eingaben erneut | [x]    | Request Validation findet vor Quota/KI statt.                                                                           |
| Klare JSON-Strukturen Angular ↔ n8n   | [x]    | Schema Version 2 ist in Models, Frontend-Validator und n8n festgelegt.                                                  |

## Responsive / UX

| Anforderung                                       | Status | Nachweis / Restarbeit                                               |
| ------------------------------------------------- | ------ | ------------------------------------------------------------------- |
| Desktop, Tablet, Smartphone                       | [~]    | Standard + Mobile bis 768px + Widescreen ab 1440px umgesetzt; finales reales Viewport-QA offen. |
| Touch optimiert                                   | [~]    | Zentrale Controls besitzen mindestens 44px Touch-Ziele; finales Device-QA offen. |
| Recipe-/Nutrition-Darstellung auf kleinen Screens | [~]    | Recipe Detail, Nutrition, Zutaten und Directions wechseln mobil auf lesbare einspaltige Layouts; visuelles QA offen. |
| Generierungswartezeit ansprechend überbrückt      | [x]    | Figma-Loading-GIF integriert; statisches Asset bei `prefers-reduced-motion`. |

## Git-Workflow

| Anforderung                     | Status | Nachweis / Restarbeit                                                                    |
| ------------------------------- | ------ | ---------------------------------------------------------------------------------------- |
| GitHub von Anfang an            | [?]    | Aus ZIP nicht prüfbar.                                                                   |
| Commit nach jeder Session       | [?]    | Aus ZIP nicht prüfbar.                                                                   |
| Aussagekräftige Commit-Messages | [?]    | Aus ZIP nicht prüfbar.                                                                   |
| `.gitignore`                    | [x]    | Runtime Config, Supabase Temp und Firebase Admin SDK Keys sind ausgeschlossen.           |
| Repository aktuell/gepflegt     | [~]    | Technischer und Figma-Stand dokumentiert; finalen geprüften Abgabestand committen/pushen. |

## User Stories 1–10

| Story                  | Status          | Umsetzung                                                                                                         |
| ---------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------- |
| 1 Zutaten-Eingabe      | [x]             | Add/Edit/Delete/List, Menge, Einheit, mindestens eine Zutat; Autocomplete ist optional und nicht implementiert.   |
| 2 Portionen            | [x]             | 1–12, Default 2; Request/Recipe tragen `servings`, Mock skaliert deterministisch, n8n/KI erhält die Portionszahl. |
| 3 Zeitangabe           | [x]             | Quick ≤20, Medium 20–45, Complex ≥45; Frontend und n8n validieren den Bereich.                                    |
| 4 Kochstil             | [x]             | Deutsch, Italienisch, Japanisch, Indisch, Gourmet, Fusion; KI-Prompt bindet Cuisine ein.                          |
| 5 Diät                 | [x]             | Vegetarisch, Vegan, Keto, Keine Einschränkung; KI-Prompt verlangt Diet-Kompatibilität.                            |
| 6 Kochhelfer           | [x]             | 1–3; Directions tragen `assignedCooks` und Parallelgruppen.                                                       |
| 7 drei Vorschläge      | [x]             | Exakt 3, eindeutige Titel/Ränge, ≥70 % User-Zutaten, max. 3 getrennte Basiszutaten.                               |
| 8 optimierte Anleitung | [x] strukturell | Chronologische Steps, Parallelgruppen, Wartezeiten und beginner-friendly Prompt-Regel vorhanden.                  |
| 9 Arbeitsaufteilung    | [x]             | ToDo-Listen werden direkt aus `assignedCooks` abgeleitet; kein paralleler zweiter State.                          |
| 10 Nährwerte           | [x]             | kcal + Protein/Carbs/Fat in g/% pro Portion und Gesamt; KI-Werte bleiben Schätzwerte.                             |

## User Story 11 – Quota

| Anforderung                           | Status          | Umsetzung                                                                                                          |
| ------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------ |
| 3 Rezepte / IP / Tag                  | [~]             | Quota-RPC implementiert; bei exakt 3 Recipes entspricht das einer erfolgreichen Generation pro IP/Tag. E2E testen. |
| 12 Rezepte systemweit / Tag           | [~]             | Globales Limit implementiert; E2E testen.                                                                          |
| IP erfassen/validieren                | [~]             | Workflow verarbeitet Proxy-IP und IPv4/IPv6; reale n8n-Cloud-Header im Execution-Log prüfen.                       |
| Frontend-Validierung + n8n Throttling | [x]             | Quota-Status deaktiviert Generate; n8n bleibt serverseitige Autorität.                                             |
| geteilte IP teilt Limit               | [x]             | Quota-Key basiert auf IP + Datum.                                                                                  |
| IPv4 und IPv6                         | [x] strukturell | Validator unterstützt beide Formen.                                                                                |
| verständliche Quota-Fehlermeldung     | [x]             | 429 wird als kontrollierter Providerfehler an die UI gegeben.                                                      |

## User Stories 12–14 – Rezeptbibliothek

| Anforderung                        | Status | Umsetzung                                                                            |
| ---------------------------------- | ------ | ------------------------------------------------------------------------------------ |
| Alle jemals generierten Rezepte    | [~]    | Firebase RTDB ist persistenter Owner; realen Generate→Library-Test noch durchführen. |
| Titel, Kochzeit, Kochstil sichtbar | [x]    | Recipe Card zeigt die Grundinformationen.                                            |
| Klick öffnet Detail                | [x]    | `/recipe/:id` lädt unabhängig vom aktuellen Generation-State über das Repository.    |
| ohne Account                       | [x]    | Frontend benötigt keine Auth; Firebase bleibt serverseitig hinter n8n.               |
| Pagination >20                     | [x]    | Page Size 20; Library API paginiert und Frontend navigiert.                          |
| Cuisine-Kategorien                 | [x]    | Zentral definierte Cuisine-Filter.                                                   |
| vollständige Detailansicht         | [x]    | Nutrition, Zutaten, Extras, Directions und Arbeitsaufteilung verfügbar.              |

## Weitere Seite und finale QA

| Anforderung                | Status | Restarbeit                                                                  |
| -------------------------- | ------ | --------------------------------------------------------------------------- |
| Impressum                  | [~]    | Route und Platzhalter vorhanden; reale Pflichtangaben vor Abgabe einsetzen. |
| Cross-Browser-Test         | [ ]    | Nach Figma in Chrome/Firefox/Edge durchführen.                              |
| Responsive-Test            | [ ]    | Implementierung vorhanden; final auf Desktop/Tablet/Mobile real prüfen.      |
| Code-Review                | [~]    | Struktur- und Figma-Nachaudit durchgeführt; finaler Review nach Browser-QA/n8n-E2E. |
| GitHub Repository + README | [ ]    | Finalen Repo-Link ergänzen und Abgabestand pushen.                          |
