import { ingredientCoverage, validCookingTime, validCount } from './business';
import { LIMITS, OPTIONS, SCHEMA_VERSION } from './config';
import { GenerationRequest, GenerationResponse, Preferences, Recipe } from './models';

type RecordValue = Record<string, unknown>;
type ParallelGroup = { lastIndex: number; cooks: Set<number>; count: number };
type ParallelUpdate = {
  groups: Map<string, ParallelGroup>;
  name: string;
  index: number;
  cooks: Set<number>;
};
type DirectionContext = {
  index: number;
  cookCount: number;
  cookingTime: number;
  assigned: Set<number>;
  groups: Map<string, ParallelGroup>;
};
type RecipeNumbers = { servings: number; cookCount: number; cookingTime: number };
type ResponseSeen = { ids: Set<string>; titles: Set<string>; ranks: Set<number> };
type ResponseIdentity = { id: string; title: string; rank: number };

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
  if (typeof value !== 'number' || !Number.isFinite(value)) fail();
  if (positive ? value <= 0 : value < 0) fail();
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

/** Prüft genau einen Makronährstoff zwischen Portions- und Gesamtwert. */
function validateMacro(per: RecordValue, total: RecordValue, key: string, servings: number): void {
  const single = per[key];
  const all = total[key];
  record(single);
  record(all);
  number(single['grams']);
  number(all['grams']);
  number(single['percent']);
  number(all['percent']);
  if (single['percent'] > 100 || all['percent'] > 100) fail();
  if (!equalNumber(all['grams'], single['grams'] * servings)) fail();
  if (!equalNumber(all['percent'], single['percent'])) fail();
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
  for (const key of ['protein', 'carbs', 'fat']) validateMacro(per, total, key, servings);
}

/** Prüft genau eine persistierte User-Zutat und registriert ihre eindeutige Source-ID. */
function validateStoredIngredient(value: unknown, seen: Set<string>): void {
  record(value);
  text(value['sourceIngredientId']);
  text(value['name']);
  number(value['amount'], true);
  option(value['unit'], OPTIONS.units);
  if (seen.has(value['sourceIngredientId'])) fail();
  seen.add(value['sourceIngredientId']);
}

/** Prüft die persistierbare Struktur vorhandener Recipe-Zutaten und liefert eindeutige Source-IDs. */
function validateStoredIngredients(value: unknown): Set<string> {
  list(value);
  const seen = new Set<string>();
  for (const ingredient of value) validateStoredIngredient(ingredient, seen);
  return seen;
}

/** Bindet genau eine Recipe-Zutat an Name, Einheit und Vorratsmenge des Requests. */
function validateRequestIngredient(value: unknown, request: GenerationRequest): void {
  record(value);
  const source = request.ingredients.find((item) => item.id === value['sourceIngredientId']);
  if (!source || value['name'] !== source.name || value['unit'] !== source.unit) fail();
  if (typeof value['amount'] !== 'number' || value['amount'] > source.amount) fail();
}

/** Bindet User-Zutaten an den konkreten Request und erzwingt Vorratsgrenzen sowie 70-%-Coverage. */
function validateRequestIngredients(value: unknown, request: GenerationRequest): void {
  const seen = validateStoredIngredients(value);
  for (const ingredient of value as unknown[]) validateRequestIngredient(ingredient, request);
  if (ingredientCoverage([...seen], request.ingredients) < LIMITS.ingredientCoverage) fail();
}

/** Prüft genau eine zusätzliche Basiszutat ohne User-Referenz. */
function validateAdditionalIngredient(value: unknown): void {
  record(value);
  if ('sourceIngredientId' in value) fail();
  text(value['name']);
  number(value['amount'], true);
  option(value['unit'], OPTIONS.units);
}

/** Zusätzliche Basiszutaten bleiben eine getrennte Liste ohne User-Referenz, auch nicht null. */
function validateAdditional(value: unknown): void {
  if (!Array.isArray(value) || value.length > LIMITS.additionalIngredients) fail();
  for (const ingredient of value) validateAdditionalIngredient(ingredient);
}

/** Prüft Koch-IDs eines einzelnen Schritts und ergänzt die globale Helferabdeckung. */
function validateCooks(value: unknown, cookCount: number, assigned: Set<number>): Set<number> {
  list(value);
  const seen = new Set<number>();
  for (const cook of value) {
    number(cook, true);
    if (!Number.isInteger(cook) || cook > cookCount || seen.has(cook)) fail();
    seen.add(cook);
    assigned.add(cook);
  }
  return seen;
}

/** Prüft optionale Wartezeit gegen die gesamte Kochzeit. */
function validateWaitingTime(direction: RecordValue, cookingTime: number): void {
  if (!('waitingTimeMinutes' in direction)) return;
  number(direction['waitingTimeMinutes']);
  if (direction['waitingTimeMinutes'] > cookingTime) fail();
}

/** Aktualisiert genau eine Parallelgruppe und verhindert überlappende Kochzuweisungen. */
function updateParallelGroup(update: ParallelUpdate): void {
  const { groups, name, index, cooks } = update;
  const group = groups.get(name);
  if (!group) {
    groups.set(name, { lastIndex: index, cooks, count: 1 });
    return;
  }
  if (group.lastIndex !== index - 1 || [...cooks].some((cook) => group.cooks.has(cook))) fail();
  cooks.forEach((cook) => group.cooks.add(cook));
  group.lastIndex = index;
  group.count++;
}

/** Prüft und registriert die optionale Parallelgruppe eines einzelnen Schritts. */
function validateParallel(
  direction: RecordValue,
  context: DirectionContext,
  cooks: Set<number>,
): void {
  if (!('parallelGroup' in direction)) return;
  const name = direction['parallelGroup'];
  text(name);
  updateParallelGroup({ groups: context.groups, name, index: context.index, cooks });
}

/** Prüft genau einen chronologischen Direction-Schritt. */
function validateDirection(value: unknown, context: DirectionContext): void {
  record(value);
  if (value['step'] !== context.index + 1) fail();
  text(value['title']);
  text(value['instruction']);
  const cooks = validateCooks(value['assignedCooks'], context.cookCount, context.assigned);
  validateWaitingTime(value, context.cookingTime);
  validateParallel(value, context, cooks);
}

/** Prüft Helferabdeckung und die Mindestgröße jeder Parallelgruppe nach allen Directions. */
function validateDirectionSummary(context: Omit<DirectionContext, 'index' | 'cookingTime'>): void {
  if ([...context.groups.values()].some((group) => group.count < 2)) fail();
  const cooks = Array.from({ length: context.cookCount }, (_, index) => index + 1);
  if (cooks.some((cook) => !context.assigned.has(cook))) fail();
  if (context.cookCount > 1 && context.groups.size === 0) fail();
}

/** Erzwingt Reihenfolge, Helferabdeckung und konfliktfreie Parallelgruppen für mehrere Köche. */
function validateDirections(value: unknown, cookCount: number, cookingTime: number): void {
  list(value);
  const groups = new Map<string, ParallelGroup>();
  const assigned = new Set<number>();
  value.forEach((direction, index) => {
    validateDirection(direction, { index, cookCount, cookingTime, assigned, groups });
  });
  validateDirectionSummary({ cookCount, assigned, groups });
}

/** Prüft stabile Identität und alle externen Preference-Keys eines Recipe. */
function validateRecipeIdentity(value: RecordValue): void {
  text(value['id']);
  text(value['title']);
  option(value['cuisine'], OPTIONS.cuisines);
  option(value['difficulty'], OPTIONS.difficulties);
  option(value['diet'], OPTIONS.diets);
}

/** Prüft Portions- und Helfergrenzen und gibt typisierte Werte zurück. */
function recipeCounts(value: RecordValue): Pick<RecipeNumbers, 'servings' | 'cookCount'> {
  const servings = value['servings'];
  const cookCount = value['cookCount'];
  number(servings, true);
  number(cookCount, true);
  if (!Number.isInteger(servings) || !validCount(servings, LIMITS.servings)) fail();
  if (!Number.isInteger(cookCount) || !validCount(cookCount, LIMITS.cookCount)) fail();
  return { servings, cookCount };
}

/** Prüft die numerischen Recipe-Felder und gibt ihre typisierten Werte zurück. */
function validateRecipeNumbers(value: RecordValue): RecipeNumbers {
  const { servings, cookCount } = recipeCounts(value);
  const cookingTime = value['cookingTimeMinutes'];
  const rank = value['rank'];
  number(cookingTime, true);
  number(rank, true);
  if (!Number.isInteger(rank)) fail();
  if (!validCookingTime(cookingTime, value['difficulty'] as Preferences['difficulty'])) fail();
  return { servings, cookCount, cookingTime };
}

/** Prüft ein gespeichertes Recipe unabhängig von seinem ursprünglichen GenerationRequest. */
function validateRecipeStructure(value: unknown): void {
  record(value);
  validateRecipeIdentity(value);
  const numbers = validateRecipeNumbers(value);
  validateNutrition(value['nutrition'], numbers.servings);
  validateStoredIngredients(value['ingredients']);
  validateAdditional(value['additionalIngredients']);
  validateDirections(value['directions'], numbers.cookCount, numbers.cookingTime);
}

/** Prüft ein Recipe vollständig gegen den zugehörigen Request vor State- oder Repository-Übernahme. */
function validateRecipe(value: unknown, request: GenerationRequest): void {
  validateRecipeStructure(value);
  record(value);
  for (const key of ['cuisine', 'difficulty', 'diet'] as const) {
    if (value[key] !== request.preferences[key]) fail();
  }
  if (value['servings'] !== request.servings || value['cookCount'] !== request.cookCount) fail();
  validateRequestIngredients(value['ingredients'], request);
}

/** Validiert persistierte Firebase-Daten erneut, bevor sie in der öffentlichen Library erscheinen. */
export function validateStoredRecipe(value: unknown): Recipe {
  validateRecipeStructure(value);
  return structuredClone(value) as unknown as Recipe;
}

/** Prüft Schema, Request-Zuordnung und optionales serverseitiges Persistenzflag. */
function validateResponseHeader(value: RecordValue, request: GenerationRequest): void {
  if (value['schemaVersion'] !== SCHEMA_VERSION) fail();
  if (value['clientRequestId'] !== request.clientRequestId) fail();
  if ('persisted' in value && typeof value['persisted'] !== 'boolean') fail();
}

/** Extrahiert die bereits strukturell geprüfte Response-Identität und validiert den Rang. */
function responseIdentity(value: RecordValue): ResponseIdentity {
  text(value['id']);
  text(value['title']);
  const rank = value['rank'];
  if (typeof rank !== 'number' || !Number.isInteger(rank)) fail();
  if (rank < 1 || rank > LIMITS.generationRecipes) fail();
  return { id: value['id'], title: value['title'].trim().toLocaleLowerCase('de'), rank };
}

/** Registriert eine Response-Identität genau einmal im aktuellen Drei-Rezepte-Satz. */
function registerResponseIdentity(identity: ResponseIdentity, seen: ResponseSeen): void {
  if (
    seen.ids.has(identity.id) ||
    seen.titles.has(identity.title) ||
    seen.ranks.has(identity.rank)
  ) {
    fail();
  }
  seen.ids.add(identity.id);
  seen.titles.add(identity.title);
  seen.ranks.add(identity.rank);
}

/** Prüft Eindeutigkeit und zulässigen Rang genau eines bereits fachlich validierten Recipes. */
function validateResponseRecipe(
  value: unknown,
  request: GenerationRequest,
  seen: ResponseSeen,
): void {
  validateRecipe(value, request);
  record(value);
  registerResponseIdentity(responseIdentity(value), seen);
}

/** Schema 2 verlangt exakt drei eindeutige, Preference-konforme Rezepte mit den Rängen 1..3. */
export function validateResponse(value: unknown, request: GenerationRequest): GenerationResponse {
  record(value);
  validateResponseHeader(value, request);
  const recipes = value['recipes'];
  list(recipes);
  if (recipes.length !== LIMITS.generationRecipes) fail();
  const seen: ResponseSeen = { ids: new Set(), titles: new Set(), ranks: new Set() };
  for (const recipe of recipes) validateResponseRecipe(recipe, request, seen);
  return structuredClone(value) as unknown as GenerationResponse;
}
