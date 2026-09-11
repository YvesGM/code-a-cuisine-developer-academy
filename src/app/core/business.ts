import { DIFFICULTIES, LIMITS, OPTIONS, SCHEMA_VERSION } from './config';
import {
  GenerationRequest,
  Ingredient,
  IngredientInput,
  Preferences,
  Recipe,
  Direction,
  RecipePage,
} from './models';
/** Prüft einen benannten Vorrat mit endlicher positiver Menge und konfigurierter Einheit. */
export function validIngredient(input: IngredientInput): boolean {
  return (
    input.name.trim().length > 0 &&
    Number.isFinite(input.amount) &&
    input.amount > 0 &&
    OPTIONS.units.includes(input.unit)
  );
}
/** Akzeptiert ausschließlich die zentralen Academy-Optionskeys. */
export function validPreferences(value: Preferences): boolean {
  return (
    OPTIONS.difficulties.includes(value.difficulty) &&
    OPTIONS.cuisines.includes(value.cuisine) &&
    OPTIONS.diets.includes(value.diet)
  );
}
/** Kopiert gültige Workflow-Eingaben in den inkompatibel versionierten n8n-Vertrag. */
export function createRequest(
  ingredients: readonly Ingredient[],
  preferences: Preferences,
  servings: number = LIMITS.servings.default,
  cookCount: number = LIMITS.cookCount.default,
  id: string = crypto.randomUUID(),
): GenerationRequest {
  if (
    !ingredients.length ||
    ingredients.some((i) => !validIngredient(i)) ||
    !validPreferences(preferences) ||
    !validCount(servings, LIMITS.servings) ||
    !validCount(cookCount, LIMITS.cookCount) ||
    !id.trim() ||
    ingredients.some((i) => !i.id.trim()) ||
    new Set(ingredients.map((i) => i.id)).size !== ingredients.length
  )
    throw new Error('Zutaten oder Preferences ungültig.');
  return {
    schemaVersion: SCHEMA_VERSION,
    clientRequestId: id,
    ingredients: ingredients.map((i) => ({ ...i })),
    preferences: { ...preferences },
    servings,
    cookCount,
  };
}
/** Sortiert ohne Mutation nach aufsteigendem Rang, bei Gleichstand nach ID. */
export function ranked(recipes: readonly Recipe[]): Recipe[] {
  return [...recipes].sort((a, b) => a.rank - b.rank || a.id.localeCompare(b.id));
}
/** Results enthalten den vollständig validierten Drei-Rezepte-Satz, ohne weitere Auswahl. */
export function topRecipes(recipes: readonly Recipe[]): Recipe[] {
  return ranked(recipes);
}
/** Ganzzahlige Portions- und Helferzahlen müssen innerhalb ihrer jeweiligen Grenzen liegen. */
export function validCount(value: number, limits: { min: number; max: number }): boolean {
  return Number.isInteger(value) && value >= limits.min && value <= limits.max;
}
/** Die Academy-Grenzen 20 und 45 sind in beiden angrenzenden Kategorien eingeschlossen. */
export function validCookingTime(minutes: number, difficulty: Preferences['difficulty']): boolean {
  const range = DIFFICULTIES[difficulty];
  return Number.isFinite(minutes) && minutes > 0 && minutes >= range.min && minutes <= range.max;
}
/** Zählt ausschließlich eindeutige vorhandene User-IDs, niemals zusätzliche Zutaten. */
export function ingredientCoverage(
  ids: readonly string[],
  ingredients: readonly Ingredient[],
): number {
  const known = new Set(ingredients.map((i) => i.id));
  return known.size ? new Set(ids.filter((id) => known.has(id))).size / known.size : 0;
}
/** Leitet die Arbeitsaufteilung direkt aus chronologischen Directions ab. */
export function cookAssignments(
  directions: readonly Direction[],
  cookCount: number,
): { cook: number; steps: readonly Direction[] }[] {
  return Array.from({ length: cookCount }, (_, index) => ({
    cook: index + 1,
    steps: directions.filter((d) => d.assignedCooks.includes(index + 1)),
  }));
}
/** Begrenzt eine ganzzahlige Seitennummer und liefert maximal die zentrale Page Size. */
export function paginate(recipes: readonly Recipe[], requestedPage = 1): RecipePage {
  const pages = Math.max(1, Math.ceil(recipes.length / LIMITS.libraryPageSize));
  const page = Math.min(pages, Math.max(1, Number.isInteger(requestedPage) ? requestedPage : 1));
  return {
    items: recipes.slice((page - 1) * LIMITS.libraryPageSize, page * LIMITS.libraryPageSize),
    total: recipes.length,
    page,
    pages,
  };
}
