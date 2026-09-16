# 02 – UI Flow

| Route | Purpose |
| --- | --- |
| `/` | Landing |
| `/generate` | Add, edit, and remove ingredients |
| `/preferences` | Select servings, time, cuisine, diet, and cooks |
| `/generating` | Loading and error state |
| `/results` | Three generated recipes |
| `/recipe/:id` | Recipe Detail |
| `/cookbook` | Most Liked and cuisine categories |
| `/cookbook/:cuisine` | Paginated cuisine library |

`AppStateService` stores only the current generation flow. Stored recipes are loaded from the Firebase library through `RecipeService`. Current results can be used directly in the detail view to avoid an unnecessary loading state.
