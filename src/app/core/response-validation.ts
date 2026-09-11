import { LIMITS, OPTIONS, SCHEMA_VERSION } from './config';
import { ingredientCoverage, validCookingTime, validCount } from './business';
import { GenerationRequest, GenerationResponse, Preferences, Recipe } from './models';

type RecordValue = Record<string, unknown>;

/** Erzwingt ein JSON-Objekt statt null oder Array. */
function record(value: unknown): asserts value is RecordValue {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail();
}

/** Verwirft externe Daten kontrolliert; keine stillschweigende Reparatur. */
function fail(): never {
  throw new Error('Die Rezeptdaten sind ungültig. Bitte erneut versuchen.');
}

/** Pflichttexte dürfen nicht ausschließlich Leerzeichen enthalten. */
function text(value: unknown): asserts value is string {
  if (typeof value !== 'string' || !value.trim()) fail();
}

/** Akzeptiert nur endliche nichtnegative beziehungsweise positive Zahlen. */
function number(value: unknown, positive = false): asserts value is number {
  if (typeof value !== 'number' || !Number.isFinite(value) || (positive ? value <= 0 : value < 0))
    fail();
}

/** Pflichtlisten benötigen mindestens ein Element. */
function list(value: unknown): asserts value is unknown[] {
  if (!Array.isArray(value) || !value.length) fail();
}

/** Prüft externe Optionskeys vor deren Verwendung im Fachmodell. */
function option(value: unknown, options: readonly string[]): void {
  if (typeof value !== 'string' || !options.includes(value)) fail();
}

/** Toleriert nur übliche Gleitkomma-Rundungsdifferenzen bei multiplizierten Nutrition-Werten. */
function equalNumber(actual: number, expected: number): boolean {
  return Math.abs(actual - expected) <= 1e-6 * Math.max(1, Math.abs(expected));
}

/** Prüft beide Nutrition-Bezugsgrößen und ihre mathematische Konsistenz zur Portionszahl. */
function validateNutrition(value: unknown, servings: number): void {
  record(value);
  const per = value['perServing'];
  const total = value['total'];
  record(per);
  record(total);
  number(per['energyKcal']);
  number(total['energyKcal']);
  if (!equalNumber(total['energyKcal'], per['energyKcal'] * servings)) fail();
  for (const key of ['protein', 'carbs', 'fat']) {
    const single = per[key];
    const all = total[key];
    record(single);
    record(all);
    number(single['grams']);
    number(all['grams']);
    number(single['percent']);
    number(all['percent']);
    if (
      single['percent'] > 100 ||
      all['percent'] > 100 ||
      !equalNumber(all['grams'], single['grams'] * servings) ||
      !equalNumber(all['percent'], single['percent'])
    )
      fail();
  }
}

/** Prüft die persistierbare Struktur vorhandener Recipe-Zutaten und liefert eindeutige Source-IDs. */
function validateStoredIngredients(value: unknown): Set<string> {
  list(value);
  const seen = new Set<string>();
  for (const ingredient of value) {
    record(ingredient);
    text(ingredient['sourceIngredientId']);
    text(ingredient['name']);
    number(ingredient['amount'], true);
    option(ingredient['unit'], OPTIONS.units);
    if (seen.has(ingredient['sourceIngredientId'])) fail();
    seen.add(ingredient['sourceIngredientId']);
  }
  return seen;
}

/** Bindet User-Zutaten an den konkreten Request und erzwingt Vorratsgrenzen sowie 70-%-Coverage. */
function validateRequestIngredients(value: unknown, request: GenerationRequest): void {
  const seen = validateStoredIngredients(value);
  for (const ingredient of value as unknown[]) {
    record(ingredient);
    const source = request.ingredients.find((i) => i.id === ingredient['sourceIngredientId']);
    if (
      !source ||
      ingredient['name'] !== source.name ||
      ingredient['unit'] !== source.unit ||
      typeof ingredient['amount'] !== 'number' ||
      ingredient['amount'] > source.amount
    )
      fail();
  }
  if (ingredientCoverage([...seen], request.ingredients) < LIMITS.ingredientCoverage) fail();
}

/** Zusätzliche Basiszutaten bleiben eine getrennte Liste ohne User-Referenz, auch nicht null. */
function validateAdditional(value: unknown): void {
  if (!Array.isArray(value) || value.length > LIMITS.additionalIngredients) fail();
  for (const ingredient of value) {
    record(ingredient);
    if ('sourceIngredientId' in ingredient) fail();
    text(ingredient['name']);
    number(ingredient['amount'], true);
    option(ingredient['unit'], OPTIONS.units);
  }
}

/** Erzwingt Reihenfolge, Helferabdeckung und konfliktfreie Parallelgruppen für mehrere Köche. */
function validateDirections(value: unknown, cookCount: number, cookingTime: number): void {
  list(value);
  const groups = new Map<string, { lastIndex: number; cooks: Set<number>; count: number }>();
  const assigned = new Set<number>();
  value.forEach((direction, index) => {
    record(direction);
    if (direction['step'] !== index + 1) fail();
    text(direction['title']);
    text(direction['instruction']);
    const cooks = direction['assignedCooks'];
    list(cooks);
    const seen = new Set<number>();
    for (const cook of cooks) {
      number(cook, true);
      if (!Number.isInteger(cook) || cook > cookCount || seen.has(cook)) fail();
      seen.add(cook);
      assigned.add(cook);
    }
    if ('waitingTimeMinutes' in direction) {
      number(direction['waitingTimeMinutes']);
      if (direction['waitingTimeMinutes'] > cookingTime) fail();
    }
    if ('parallelGroup' in direction) {
      const name = direction['parallelGroup'];
      text(name);
      const group = groups.get(name);
      if (group) {
        if (group.lastIndex !== index - 1 || [...seen].some((cook) => group.cooks.has(cook)))
          fail();
        seen.forEach((cook) => group.cooks.add(cook));
        group.lastIndex = index;
        group.count++;
      } else groups.set(name, { lastIndex: index, cooks: seen, count: 1 });
    }
  });
  if ([...groups.values()].some((group) => group.count < 2)) fail();
  if (Array.from({ length: cookCount }, (_, index) => index + 1).some((cook) => !assigned.has(cook)))
    fail();
  if (cookCount > 1 && groups.size === 0) fail();
}

/** Prüft ein gespeichertes Recipe unabhängig von seinem ursprünglichen GenerationRequest. */
function validateRecipeStructure(value: unknown): void {
  record(value);
  text(value['id']);
  text(value['title']);
  option(value['cuisine'], OPTIONS.cuisines);
  option(value['difficulty'], OPTIONS.difficulties);
  option(value['diet'], OPTIONS.diets);
  const servings = value['servings'];
  const cookCount = value['cookCount'];
  const cookingTime = value['cookingTimeMinutes'];
  const rank = value['rank'];
  number(servings, true);
  number(cookCount, true);
  number(cookingTime, true);
  number(rank, true);
  if (
    !Number.isInteger(servings) ||
    !Number.isInteger(cookCount) ||
    !validCount(servings, LIMITS.servings) ||
    !validCount(cookCount, LIMITS.cookCount) ||
    !Number.isInteger(rank) ||
    !validCookingTime(cookingTime, value['difficulty'] as Preferences['difficulty'])
  )
    fail();
  validateNutrition(value['nutrition'], servings);
  validateStoredIngredients(value['ingredients']);
  validateAdditional(value['additionalIngredients']);
  validateDirections(value['directions'], cookCount, cookingTime);
}

/** Prüft ein Recipe vollständig gegen den zugehörigen Request vor State- oder Repository-Übernahme. */
function validateRecipe(value: unknown, request: GenerationRequest): void {
  validateRecipeStructure(value);
  record(value);
  for (const key of ['cuisine', 'difficulty', 'diet'] as const)
    if (value[key] !== request.preferences[key]) fail();
  if (value['servings'] !== request.servings || value['cookCount'] !== request.cookCount) fail();
  validateRequestIngredients(value['ingredients'], request);
}

/** Validiert persistierte Firebase-Daten erneut, bevor sie in der öffentlichen Library erscheinen. */
export function validateStoredRecipe(value: unknown): Recipe {
  validateRecipeStructure(value);
  return structuredClone(value) as unknown as Recipe;
}

/** Schema 2 verlangt exakt drei eindeutige, Preference-konforme Rezepte mit den Rängen 1..3. */
export function validateResponse(value: unknown, request: GenerationRequest): GenerationResponse {
  record(value);
  if (
    value['schemaVersion'] !== SCHEMA_VERSION ||
    value['clientRequestId'] !== request.clientRequestId
  )
    fail();
  if ('persisted' in value && typeof value['persisted'] !== 'boolean') fail();
  const recipes = value['recipes'];
  list(recipes);
  if (recipes.length !== LIMITS.generationRecipes) fail();
  const ids = new Set<string>();
  const titles = new Set<string>();
  const ranks = new Set<number>();
  for (const recipe of recipes) {
    validateRecipe(recipe, request);
    record(recipe);
    text(recipe['id']);
    text(recipe['title']);
    const title = recipe['title'].trim().toLocaleLowerCase('de');
    const rank = recipe['rank'];
    if (
      typeof rank !== 'number' ||
      !Number.isInteger(rank) ||
      rank < 1 ||
      rank > LIMITS.generationRecipes ||
      ids.has(recipe['id']) ||
      titles.has(title) ||
      ranks.has(rank)
    )
      fail();
    ids.add(recipe['id']);
    titles.add(title);
    ranks.add(rank);
  }
  return structuredClone(value) as unknown as GenerationResponse;
}
