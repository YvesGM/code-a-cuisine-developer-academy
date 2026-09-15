# Code-a-Cuisine: verbindliche Arbeitsregeln

- Existing-System-First: vorhandene Komponenten, Services, Datenverträge und n8n-Flows zuerst nachvollziehen.
- Root Cause vor Änderung; bestehende Owner direkt anpassen statt parallele Lösungen einzubauen.
- Angular bleibt bewusst einfach: Components für UI, Services für State und externe Kommunikation, Models für Typen, Guards für Navigation.
- Keine zusätzlichen Architektur- oder Abstraktionsschichten ohne konkreten Bedarf.
- Externe Kommunikation findet ausschließlich in Angular-Services statt, nicht in Components.
- Persistente Daten liegen ausschließlich in Firebase Realtime Database und werden ausschließlich serverseitig über n8n gelesen/geschrieben.
- Keine Firebase-Service-Credentials, AI-Secrets oder SMTP-Secrets ins Angular-Bundle oder Repository einführen.
- n8n ist der einzige Backend-Gateway des Frontends und validiert Requests serverseitig erneut.
- Bestehendes Figma-/Responsive-Styling nicht nebenbei verändern. HTML/SCSS nur anfassen, wenn die Aufgabe ausdrücklich UI betrifft.
- Eigene fachliche Funktionen und Methoden kurz und eindeutig halten; Ziel sind maximal 14 Zeilen pro Funktionskörper.
- JSDoc für eigene fachliche Funktionen, Methoden und zentrale Klassen verwenden, wenn es die Verantwortung erklärt.
- Handgeschriebene Anwendungscode-Dateien bleiben überschaubar und fachlich eindeutig.
- Nach Änderungen: TypeScript/Lint, Tests soweit vorhanden und Production Build prüfen.
- Textdateien als UTF-8 erhalten und Sonderzeichen nach Änderungen prüfen.
