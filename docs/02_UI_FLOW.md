# 02 – UI Flow

| Route | Aufgabe |
| --- | --- |
| `/` | Landing |
| `/generate` | Zutaten hinzufügen, bearbeiten und entfernen |
| `/preferences` | Portionen, Zeit, Cuisine, Diet und Helfer wählen |
| `/generating` | Loading- und Fehlerstatus |
| `/results` | drei generierte Rezepte |
| `/recipe/:id` | Recipe Detail |
| `/cookbook` | Most Liked und Cuisine-Kategorien |
| `/cookbook/:cuisine` | paginierte Cuisine-Library |

`AppStateService` hält nur den aktuellen Generierungsflow. Gespeicherte Rezepte werden über `RecipeService` aus der Firebase-Library geladen. Aktuelle Results können in der Detailansicht direkt aus dem State verwendet werden, damit kein unnötiger Ladezustand entsteht.
