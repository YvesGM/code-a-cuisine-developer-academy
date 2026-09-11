# 05 – Validierungsprotokoll

Stand: 11.09.2026.

## Bereits bestätigte Basis

Der vorherige Angular-Stand wurde lokal mit `npm run check` grün bestätigt.

## Nach Firebase-Umbau prüfen

```sh
npm ci
npm run lint
npm test -- --watch=false
npm run build
npm run check
npm run format:check
```

Danach:

1. Supabase-Cleanup-Migration pushen.
2. Generation-Workflow aktualisiert importieren/veröffentlichen.
3. neuen Recipe-Library-Workflow importieren/veröffentlichen.
4. bestehende Quota- und Error-Workflows veröffentlicht lassen.
5. Quota-GET testen.
6. reale Generierung testen.
7. drei Records unter `/code-a-cuisine/recipes` in Firebase prüfen.
8. Library und Recipe Detail prüfen.
9. zweiten Request derselben IP auf Quota-Fehler prüfen.
10. kontrollierten Persistence-/Library-Fehlerpfad prüfen.

## Erfolgsfall

- Request Schema 2 akzeptiert.
- genau drei Recipes generiert und validiert.
- drei Recipes in Firebase gespeichert.
- Quota in Supabase als `completed` markiert.
- `workflow_runs` enthält Erfolg.
- Angular erhält `persisted: true`.
- Results, Library und Detail funktionieren.

## Fehlerfälle

- ungültiger Angular-Request → 400
- IP-/Global-Quota → 429
- Quota-Backendfehler → 503 + Supabase-Log/Mail
- Gemini-Providerfehler → 502 + Quota Release + Log/Mail
- ungültige AI-Ausgabe → 422 + Quota Release + Log/Mail
- Firebase-Persistenzfehler → 502 + Quota Release + Supabase-Log/Mail
- Firebase-Libraryfehler → 502 + Supabase-Log/Mail

## Strukturprüfung

`npm run lint` prüft zusätzlich die vereinbarten Source-Grenzen:

- handgeschriebene TypeScript-Dateien: maximal 400 Zeilen,
- eigene Produktionsfunktionen/-methoden: maximal 14 Codezeilen,
- `any` bleibt verboten.

Die Refactor-Regel lautet weiterhin: bestehende Owner zerlegen, nicht durch parallele Services oder zweite
Datenflüsse ersetzen. Test-Callbacks sind deklarative Specs und von der Funktionslängenregel ausgenommen;
die Testdateien selbst unterliegen weiterhin der 400-Zeilen-Grenze.
