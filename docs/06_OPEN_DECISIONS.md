# 06 – Offene Entscheidungen

Zentrale Entscheidungsliste; docs/OPEN_DECISIONS.md verweist hierher.

## Durch die Academy jetzt geklärt

- Exakt drei unterschiedliche Rezepte je Generation, Schema 2.
- Cuisine-Keys german, italian, japanese, indian, gourmet, fusion und zentrale deutsche Labels.
- Diet-Keys vegetarian, vegan, keto, none und zentrale deutsche Labels.
- Difficulty: Schnell bis 20, Mittel 20–45, Aufwendig ab 45 Minuten; Grenzwerte inklusive.
- Portionen 1–12, Default 2. Kochhelfer 1–3, Default 1.
- Mindestens 70 % eindeutig verwendete User-Zutaten und maximal drei separat ausgewiesene Basiszutaten.
- Nutrition pro Portion und Gesamtrezept mit Gramm und Prozent.
- Öffentliche Rezeptebibliothek aller gespeicherten Generierungen; Pagination 20; Supabase ist als Persistenzziel festgelegt und vorbereitet.
- Kein Account für Library oder Rezeptdetails.

## Weiterhin offen oder für spätere Phasen

| Thema                      | Stand / Klärung                                                                                                                                                                      |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Echte Portionsbemessung    | Mock teilt Vorräte proportional mit servings / 12 auf, ohne Sättigung oder Lebensmittelbedarf zu behaupten. n8n muss fachlich sinnvolle Mengen innerhalb vorhandener Vorräte finden. |
| Nutrition-Quelle           | Demo-Werte; echte Quelle, Berechnung und Makroenergieanteile mit AI-Workflow abstimmen                                                                                               |
| Diätkonflikte              | Mock trägt den Diet-Key, führt keine semantische Lebensmittelanalyse durch; echtes Ausschließen unpassender Zutaten folgt mit n8n/AI                                                 |
| Basiszutaten               | Maximal drei erlaubt; Demo Wasser/Öl, keine umfangreiche Datenbank. Reale semantische Definition und Freitexte im Workflow prüfen                                                    |
| Freitext-Anleitungen       | Semantische Zutatenregel und sichere passende Zubereitung mit echter KI prüfen                                                                                                       |
| Genaue KI / AI Provider    | Noch nicht gewählt oder integriert                                                                                                                                                   |
| n8n-Workflow               | Nächster Auftrag auf Basis des vorhandenen n8n-/Join-Issue-Collector-Projekts                                                                                                        |
| Webhook-Betrieb            | URL, CORS, Auth, Timeout, Fehlermapping und Betrieb abstimmen                                                                                                                        |
| Supabase-Produktionsmodell | `code_a_cuisine.recipes`, Data-API-Adapter, Migration, Indizes und RLS stehen; Bestandsmigrationen sind gezogen. Offen sind Migration-Push, Remote-Exposed-Schema sowie Runtime-URL/Publishable-Key                                      |
| Supabase Auth              | Kein Nutzerlogin vorgesehen. Öffentliche Library liest per Publishable Key/RLS. Aktuell darf der Client auch validierte Generierungen inserten; n8n-Hardening kann Writes später serverseitig übernehmen |
| Persistente User-Daten     | Kein Nutzerprofilmodell; ohne Runtime-Konfiguration Development In-Memory, mit Supabase-Runtimekonfiguration globale persistente Recipe-Library                                                                            |
| Likes / Most-Liked Recipes | Keine Implementierung; weiterhin nicht Teil dieses Auftrags                                                                                                                          |
| Einheiten / Bruchteile     | Zentrale bisherige Einheiten; keine automatische Umrechnung oder Rundung von piece                                                                                                   |
| Impressum                  | Name/Verantwortlicher, Anschrift und Kontakt sind explizite Platzhalter. Vor Veröffentlichung und Abgabe durch reale Angaben ersetzen                                                |
| Figma-Design               | Finales Styling folgt; nur technisches Layout                                                                                                                                        |
| Responsive / Cross-Browser | Finale Optimierung und Abschlussprüfung folgen                                                                                                                                       |
| Loading Animation          | Weiterhin einfacher Textstatus                                                                                                                                                       |
| Finale Texte               | Deutsche Labels vorhanden, finale redaktionelle/Figma-Abstimmung später                                                                                                              |

## Quota: ausdrücklich nicht implementiert

Die spätere Checkliste nennt 3 Rezepte pro IP/Tag, 12 Rezepte systemweit/Tag, IPv4 und IPv6, n8n-Throttling und eine Frontend-Fehlermeldung. Eine Generation erzeugt exakt drei Rezepte. Deshalb könnte „3 Rezepte pro IP pro Tag“ **eine Generation pro IP pro Tag** bedeuten. Das wird beim n8n-Aufbau geklärt und nicht eigenmächtig als drei Generierungen interpretiert. Ebenso sind systemweite Zählung, Zeitfenster und Fehlervertrag im n8n-Schritt festzulegen.

Keine Quota-Counter, IP-Erkennung, Throttling-Mechanismen oder erfundenen n8n-Nodes wurden im Frontend hinzugefügt.

## Academy-Technologieabweichung

Die Checkliste nennt explizit Firebase. Das Projekt verwendet auf ausdrückliche Entscheidung Supabase. Die fachliche Speicheranforderung wird vollständig abgebildet; die Technologieabweichung muss vor der finalen Abgabe mit der Academy abgestimmt werden.
