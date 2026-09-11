# 00 – Project Scope

## Verbindlicher Pre-n8n-Umfang

Die vorhandene App wurde anhand der im Auftrag gelieferten Academy-Checkliste erweitert. Der aktuelle Workflow erfasst Vorräte, Portionen (1–12, Default 2), Kochhelfer (1–3, Default 1) und drei Preferences. Eine Generierung liefert exakt drei verschiedene Rezepte. Die bisherige Modellannahme eines größeren Generation-Pools entfällt.

Jedes Rezept nutzt mindestens 70 % der eindeutig eingegebenen Ingredient-IDs. Zusätzliche Basiszutaten sind getrennt und auf drei Einträge begrenzt. Nutrition wird pro Portion und Gesamt dargestellt. Directions enthalten Reihenfolge, Helferzuordnung, optionale Parallelgruppen und Wartezeiten.

Die Rezeptebibliothek bedeutet fachlich alle gespeicherten generierten Rezepte aller Nutzer ohne Account. Ohne Credentials simuliert ein In-Memory-Repository diese Schnittstelle innerhalb einer App-Sitzung. Sobald Project URL und Publishable Key als Runtime-Umgebungsvariablen gesetzt und die Migration angewendet ist, liest und schreibt derselbe Repository-Vertrag über die öffentliche Supabase Data API. Results sind dagegen ausschließlich der aktuelle Drei-Rezepte-Satz.

## Demo-Grenzen

Der Mock klassifiziert keine frei eingegebenen Lebensmittel und zertifiziert keine Diet-Verträglichkeit. Die Daten tragen die gewählte Diet, ohne semantische Filterung vorzutäuschen. Auch Zubereitungshinweise, Zeit und Nutrition sind Demo-Daten. Die unterschiedlichen Verfahren Pfanne, Dämpfen und Ofen und die Cuisine-bezogene Präsentation sind kontrollierte Fixtures, keine kulinarische KI.

User-Mengen sind vorhandene Gesamtvorräte. Die technische Demo-Aufteilung verwendet amount × servings / 12; sie garantiert lineare Skalierung und keine Vorratsüberschreitung. Sie garantiert keine ausreichenden Mahlzeiten. Bruchteile von piece bleiben zulässig wie bisher; es gibt keine neue Rundungs- oder Lebensmitteldatenbank.

## Nicht im Auftrag

Kein echter n8n-Workflow, kein AI-Provider, keine Quota-Implementierung, noch keine eingetragenen Supabase-Credentials/Remote-Verknüpfung, kein Login, kein Autocomplete, keine externen Nutrition-Dienste, kein finales Figma-Design und kein Cross-Browser-Abschlussaudit. Likes und Most-Liked sind weiterhin nicht implementiert.

## Abnahme

Lint, Tests, Production Build, check und format:check müssen erfolgreich sein. Zusätzlich ist der vollständige Formular-/Navigationsflow einschließlich öffentlicher Bibliothek, Detail, Pagination und Impressum zu prüfen. Implementierung und erfolgreiche Laufzeitvalidierung werden getrennt dokumentiert.

## Persistenzentscheidung

Die Academy-Checkliste nennt Firebase. Die Projektentscheidung ist bewusst Supabase. Funktional bleibt die Anforderung unverändert: jede erfolgreiche Generierung wird dauerhaft gespeichert und ist öffentlich in der Bibliothek lesbar. Diese Technologieabweichung ist vor der finalen Academy-Abgabe formal abzustimmen.
