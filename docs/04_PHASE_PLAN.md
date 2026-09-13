

# 04 – Phasenplan

Status: `[ ]` nicht begonnen · `[~]` in Arbeit · `[x]` validiert · `[!]` blockiert.

| Phase                             | Status | Stand                                                                                                  |
| --------------------------------- | ------ | ------------------------------------------------------------------------------------------------------ |
| 0 Foundation                      | [x]    | Angular-/Tooling-Grundlage vorhanden und lokal grün validiert                                          |
| 1 Core Angular / Academy-Funktion | [~]    | Funktionalität und Schema-2-Contract implementiert; nach Firebase/n8n-Integration erneut prüfen        |
| 2 n8n + echte KI                  | [~]    | Generation, Library, Quota, Validation, Logging und Fehleralarm implementiert; E2E-Test ausstehend     |
| 3 Persistenz                      | [~]    | Recipe-Persistenz auf Firebase; Supabase für Quota/Audit/Ingredient-Catalog; Migrationen anwenden |
| 4 Figma / Styling / Responsive    | [~]    | Figma-Styles, Assets, Mobile/Standard/Widescreen und Loading-Animation umgesetzt; visueller Browser-Abgleich offen |
| 5 Hardening / Abgabe              | [ ]    | Impressum, Cross-Browser, Accessibility, Code-Review, GitHub und finale Academy-Abgabe                 |

## Übergang vor Figma

1. Firebase-/Supabase-Änderungen übernehmen.
2. Supabase-Cleanup-Migration pushen.
3. aktualisierten Generation-Workflow und neuen Library-Workflow importieren/veröffentlichen.
4. Quota, Generation, Firebase-Persistenz, Library und Recipe Detail real testen.
5. `npm run check` und `npm run format:check` ausführen.
6. Academy-Checkliste erneut abgleichen.

# Figma Implementation Status

Stand: 11.09.2026. Der lokale Figma-Export wurde ausgewertet und die bestehende Angular-UI innerhalb der vorhandenen Owner umgesetzt. Keine Backend-, Contract-, n8n- oder Persistenzlogik wurde für das Design parallel neu aufgebaut.

## Completed

- globale Figma-Typografie mit lokalen Quicksand-, Ubuntu- und Kreon-Assets
- zentrale Farb-, Breiten-, Radius- und Breakpoint-Werte
- Shell mit Header, Navigation, Footer und Dark-Varianten
- Landing, Ingredients, Preferences, Generating, Results, Cookbook, Cuisine und Recipe Detail
- lokale Figma-Bilder und Icons aus `public/assets/` eingebunden
- Loading-GIF plus Reduced-Motion-Fallback
- Mobile-Regeln als Abweichungen vom Standard; Widescreen-Regeln nur dort, wo das Figma tatsächlich abweicht
- keine `rem`-Deklarationen im Anwendungstyling
- Touch-Ziele der zentralen Controls mindestens 44px hoch
- normale interaktive Texte mindestens 16px; Kleingedrucktes mindestens 14px

## Partially completed

Der strukturelle Figma-Stand ist umgesetzt. Offen bleibt der finale visuelle Browser-/Screenshot-Abgleich gegen die Figma-Frames sowie echtes Device-/Cross-Browser-QA. Ohne diesen letzten Abgleich wird keine Pixelperfektion behauptet.

## Not started

Keine zusätzliche Designfunktionalität. Likes, Most-liked, Login/Logout und andere im Figma angedeutete, aber nicht durch die Academy-User-Stories gedeckte Features werden bewusst nicht ergänzt.

## Responsive status

| Bestehende Seite / Owner         | Standard | Mobile | Widescreen |
| -------------------------------- | -------- | ------ | ---------- |
| Shell / app.html                 | done     | done   | done       |
| Landing / landing                | done     | done   | done       |
| Ingredients / ingredients        | done     | done   | done       |
| Preferences / preferences        | done     | done   | done       |
| Generating / generating          | done     | done   | done       |
| Results / results                | done     | done   | done       |
| Cookbook / cookbook              | done     | done   | done       |
| Cuisine / cuisine                | done     | done   | done       |
| Recipe Detail / recipe-detail    | done     | done   | done       |
| Impressum / impressum            | done     | done   | done       |

Breakpoints: Standard ist die Basis. Mobile-Abweichungen greifen bis `768px`; Widescreen-Abweichungen ab `1440px`. Wo ein Owner auf Widescreen keine abweichenden Werte benötigt, existiert bewusst kein redundanter Media-Query-Block.

## Assets

Verwendet werden ausschließlich lokale Projektassets unter `public/assets/`, darunter Logo-Varianten, Cuisine-Bilder, Hero-Visuals, Recipe-/Clock-/Cook-Icons, Pagination-Icons, die Figma-Loading-GIF und deren statischer Reduced-Motion-Fallback.

## Figma discrepancies

Figma-Inhalte ohne bestehenden fachlichen Owner werden nicht als neue Funktionalität erfunden. Insbesondere Likes, Most-liked, Login/Logout, eine zusätzliche Ingredient-Sortierung und eine neue Portionsmengen-Prüfung bleiben außerhalb dieses Designblocks.

## Validation

- Der vom vorherigen Agenten dokumentierte Stand hatte `npm.cmd run check` erfolgreich mit 109 Tests und Production Build.
- Für diesen Nachaudit konnte die lokale Sandbox wegen abweichender Node-/npm-Engine und unvollständiger Dependency-Installation keinen erneuten vollständigen Angular-Run liefern.
- Statische Prüfung: keine `rem`-Werte im Anwendungstyling, Source-Dateien unter 400 Zeilen, Standard/Mobile/Widescreen ohne unnötige identische Overrides.
- Finaler Browser-/Screenshot-Abgleich bleibt Abschlussarbeit.

## Last touched

- `src/styles.scss`: Back-Link als normaler interaktiver Text auf 16px vereinheitlicht.
- `src/app/app.scss`: redundanten/zu kleinen mobilen 14px-Navigations-Override entfernt; mobile Navigation erbt den 16px-Standard.
- Projektstatus-Dokumentation an den tatsächlich vorhandenen Figma-Stand angepasst.

## Next step

Projekt lokal mit der in `package.json` geforderten Node-/npm-Version starten und Landing, Ingredients, Preferences, Generating, Results, Cookbook, Cuisine und Recipe Detail bei Standard-, 375px-Mobile- und Widescreen-Viewport direkt gegen die Figma-Frames vergleichen. Nur bestätigte Abweichungen in den bestehenden Ownern korrigieren; keine parallelen Klassen oder Style-Pfade hinzufügen.
