# 06 – Open Decisions

Für den aktuellen Abgabestand bestehen keine offenen Architekturentscheidungen.

## Fest entschieden

- Firebase Realtime Database ist die einzige persistente Datenbank.
- Angular kommuniziert ausschließlich mit n8n.
- Externe Requests liegen in Angular-Services, nicht in UI-Komponenten.
- Es gibt keinen zusätzlichen Repository-, Provider- oder InjectionToken-Layer.
- Seitenkomponenten liegen unter `src/app/components/` jeweils in einem eigenen Ordner.
- Wiederverwendbare UI-Bausteine liegen unter `src/app/shared/`.
- Bestehendes Figma-Styling und Responsive-Verhalten bleiben unverändert, sofern keine explizite UI-Aufgabe vorliegt.
- Die n8n-Workflows übernehmen Validierung, Gemini-Aufruf, Firebase-Zugriffe, Quota und technische Fehlerbehandlung.

## Abschluss

Der Hauptflow wurde nach dem Firebase-only-Umbau erneut geprüft. Weitere Architektur-Erweiterungen sind für die Academy-Abgabe nicht vorgesehen.
