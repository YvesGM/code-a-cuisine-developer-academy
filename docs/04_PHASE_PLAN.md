# 04 – Phasenplan

Status: `[ ]` nicht begonnen · `[~]` in Arbeit · `[x]` validiert · `[!]` blockiert.

| Phase                             | Status | Stand                                                                                                  |
| --------------------------------- | ------ | ------------------------------------------------------------------------------------------------------ |
| 0 Foundation                      | [x]    | Angular-/Tooling-Grundlage vorhanden und lokal grün validiert                                          |
| 1 Core Angular / Academy-Funktion | [~]    | Funktionalität und Schema-2-Contract implementiert; nach Firebase/n8n-Integration erneut prüfen        |
| 2 n8n + echte KI                  | [~]    | Generation, Library, Quota, Validation, Logging und Fehleralarm implementiert; E2E-Test ausstehend     |
| 3 Persistenz                      | [~]    | Recipe-Persistenz auf Firebase umgestellt; Supabase bleibt für Quota/Audit; Cleanup-Migration anwenden |
| 4 Figma / Styling / Responsive    | [ ]    | Finales Design, Responsive-/Touch-Optimierung und Loading-Animation                                    |
| 5 Hardening / Abgabe              | [ ]    | Impressum, Cross-Browser, Accessibility, Code-Review, GitHub und finale Academy-Abgabe                 |

## Übergang vor Figma

1. Firebase-/Supabase-Änderungen übernehmen.
2. Supabase-Cleanup-Migration pushen.
3. aktualisierten Generation-Workflow und neuen Library-Workflow importieren/veröffentlichen.
4. Quota, Generation, Firebase-Persistenz, Library und Recipe Detail real testen.
5. `npm run check` und `npm run format:check` ausführen.
6. Academy-Checkliste erneut abgleichen.
