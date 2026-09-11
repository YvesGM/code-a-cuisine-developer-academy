import { TestBed } from '@angular/core/testing';
import {
  createRequest,
  cookAssignments,
  ingredientCoverage,
  paginate,
  validCookingTime,
} from './business';
import { LIMITS, OPTIONS } from './config';
import { FlowState } from './flow-state';
import { GENERATION_PROVIDER, mockResponse } from './generation';
import { GenerationRequest, Ingredient, Recipe } from './models';
import { RECIPE_REPOSITORY } from './recipe-repository';
import { validateResponse, validateStoredRecipe } from './response-validation';

const ingredients: Ingredient[] = Array.from({ length: 10 }, (_, index) => ({
  id: 'i-' + index,
  name: 'Zutat ' + index,
  amount: 120,
  unit: 'g',
}));
const preferences = { difficulty: 'quick', cuisine: 'italian', diet: 'none' } as const;
/** Erzeugt einen geprüften Request für Grenz- und Skalierungstests. */
function request(servings = 2, cookCount = 1): GenerationRequest {
  return createRequest(ingredients, preferences, servings, cookCount);
}
/** Ändert nur ein Recipe, damit negative Tests nicht versehentlich allein am Recipe-Count scheitern. */
function changed(patch: Record<string, unknown>, input = request()): () => unknown {
  const response = mockResponse(input);
  return () =>
    validateResponse(
      {
        ...response,
        recipes: [{ ...response.recipes[0], ...patch }, ...response.recipes.slice(1)],
      },
      input,
    );
}

describe('Academy contract', () => {
  it('defaults to two servings and one cook in state and request', () => {
    const state = TestBed.inject(FlowState);
    expect(state.servings()).toBe(2);
    expect(state.cookCount()).toBe(1);
    expect(request()).toMatchObject({ schemaVersion: 2, servings: 2, cookCount: 1 });
  });
  it.each([1, 2, 12])('accepts %s servings', (servings) => {
    const state = TestBed.inject(FlowState);
    state.setServings(servings);
    expect(state.servings()).toBe(servings);
    expect(request(servings).servings).toBe(servings);
  });
  it.each([0, 13, 1.5, NaN, Infinity])(
    'rejects invalid servings %s without changing state',
    (servings) => {
      const state = TestBed.inject(FlowState);
      expect(() => state.setServings(servings)).toThrow();
      expect(state.servings()).toBe(2);
      expect(() => request(servings)).toThrow();
    },
  );
  it.each([1, 2, 3])('accepts %s cooks and distributes work', (cookCount) => {
    const state = TestBed.inject(FlowState);
    state.setCookCount(cookCount);
    expect(state.cookCount()).toBe(cookCount);
    const input = request(2, cookCount);
    const response = mockResponse(input);
    expect(() => validateResponse(response, input)).not.toThrow();
    const assignments = cookAssignments(response.recipes[0].directions, cookCount);
    expect(assignments).toHaveLength(cookCount);
    expect(assignments.every((a) => a.steps.length > 0)).toBe(true);
    if (cookCount > 1) expect(response.recipes[0].directions[0].parallelGroup).toBe('vorbereitung');
  });
  it.each([0, 4, 1.5, NaN])('rejects invalid cook count %s', (count) => {
    expect(() => TestBed.inject(FlowState).setCookCount(count)).toThrow();
    expect(() => request(2, count)).toThrow();
  });
  it.each(OPTIONS.difficulties)(
    'generates exactly three different recipes in the %s time range',
    (difficulty) => {
      const input = createRequest(ingredients, { ...preferences, difficulty });
      const response = mockResponse(input);
      expect(response.recipes).toHaveLength(3);
      expect(new Set(response.recipes.map((r) => r.id)).size).toBe(3);
      expect(new Set(response.recipes.map((r) => r.title)).size).toBe(3);
      expect(new Set(response.recipes.map((r) => r.directions.at(-1)?.instruction)).size).toBe(3);
      expect(
        response.recipes.every((r) => validCookingTime(r.cookingTimeMinutes, difficulty)),
      ).toBe(true);
      expect(() => validateResponse(response, input)).not.toThrow();
    },
  );
  it('enforces inclusive difficulty boundaries', () => {
    expect(validCookingTime(20, 'quick')).toBe(true);
    expect(validCookingTime(21, 'quick')).toBe(false);
    expect(validCookingTime(20, 'medium')).toBe(true);
    expect(validCookingTime(45, 'medium')).toBe(true);
    expect(validCookingTime(19, 'medium')).toBe(false);
    expect(validCookingTime(46, 'medium')).toBe(false);
    expect(validCookingTime(45, 'complex')).toBe(true);
    expect(validCookingTime(35, 'complex')).toBe(false);
  });
  it.each([0, 1, 2, 4])('rejects %s recipes', (count) => {
    const input = request();
    const response = mockResponse(input);
    const recipes = Array.from({ length: count }, (_, i) => ({
      ...response.recipes[i % 3],
      id: 'recipe-' + i,
      title: 'Recipe ' + i,
    }));
    expect(() => validateResponse({ ...response, recipes }, input)).toThrow();
  });
  it('requires the unique ranks 1, 2 and 3', () => {
    const input = request();
    const response = mockResponse(input);
    expect(changed({ rank: response.recipes[1].rank }, input)).toThrow();
    expect(changed({ rank: 4 }, input)).toThrow();
  });
  it('rejects old schema, duplicate titles and mismatched preferences', () => {
    const input = request();
    const response = mockResponse(input);
    expect(() => validateResponse({ ...response, schemaVersion: 1 }, input)).toThrow();
    expect(changed({ title: response.recipes[1].title })).toThrow();
    expect(changed({ cuisine: 'german' })).toThrow();
    expect(changed({ difficulty: 'complex', cookingTimeMinutes: 35 })).toThrow();
    expect(changed({ diet: 'vegan' })).toThrow();
    expect(changed({ servings: 3 })).toThrow();
    expect(changed({ cookCount: 2 })).toThrow();
  });
  it('accepts exactly 70 percent and rejects less; additional ingredients do not count', () => {
    const input = request();
    const used = mockResponse(input).recipes[0].ingredients;
    expect(changed({ ingredients: used.slice(0, 7) }, input)).not.toThrow();
    expect(
      changed(
        {
          ingredients: used.slice(0, 6),
          additionalIngredients: [{ name: 'Salz', amount: 1, unit: 'g' }],
        },
        input,
      ),
    ).toThrow();
    expect(ingredientCoverage(['i-0', 'i-0', 'unknown'], ingredients)).toBe(0.1);
    expect(ingredientCoverage([], [])).toBe(0);
  });
  it.each([0, 1, 2, 3])('accepts %s additional ingredients', (count) => {
    expect(
      changed({
        additionalIngredients: ['Salz', 'Pfeffer', 'Öl']
          .slice(0, count)
          .map((name) => ({ name, amount: 1, unit: 'g' })),
      }),
    ).not.toThrow();
  });
  it('rejects extra ingredients with references, invalid quantities, names, or excessive count', () => {
    const basic = { name: 'Salz', amount: 1, unit: 'g' };
    for (const additionalIngredients of [
      [basic, basic, basic, basic],
      [{ ...basic, sourceIngredientId: null }],
      [{ ...basic, amount: 0 }],
      [{ ...basic, name: ' ' }],
      [{ ...basic, unit: 'unknown' }],
    ]) {
      expect(changed({ additionalIngredients })).toThrow();
    }
  });
  it('scales ingredient totals linearly without exceeding available stock', () => {
    const two = mockResponse(request(2)).recipes[0];
    const four = mockResponse(request(4)).recipes[0];
    expect(four.ingredients[0].amount).toBe(two.ingredients[0].amount * 2);
    expect(mockResponse(request(12)).recipes[0].ingredients[0].amount).toBe(ingredients[0].amount);
  });
  it.each([1, 2, 12])('keeps nutrition consistent for %s servings', (servings) => {
    const input = request(servings);
    const response = mockResponse(input);
    for (const recipe of response.recipes) {
      const { perServing, total } = recipe.nutrition;
      expect(total.energyKcal).toBe(perServing.energyKcal * servings);
      for (const key of ['protein', 'carbs', 'fat'] as const) {
        expect(total[key].grams).toBe(perServing[key].grams * servings);
        expect(total[key].percent).toBe(perServing[key].percent);
      }
    }
    expect(() => validateResponse(response, input)).not.toThrow();
    const nutrition = response.recipes[0].nutrition;
    expect(
      changed(
        { nutrition: { ...nutrition, total: { ...nutrition.total, energyKcal: -1 } } },
        input,
      ),
    ).toThrow();
    expect(
      changed(
        {
          nutrition: {
            ...nutrition,
            total: { ...nutrition.total, energyKcal: nutrition.total.energyKcal + 1 },
          },
        },
        input,
      ),
    ).toThrow();
  });
  it('validates stored recipe payloads independently of the original request', () => {
    const recipe = mockResponse(request(2, 2)).recipes[0];
    expect(validateStoredRecipe(recipe)).toEqual(recipe);
    expect(() => validateStoredRecipe({ ...recipe, servings: 0 })).toThrow();
    expect(() =>
      validateStoredRecipe({
        ...recipe,
        additionalIngredients: [{ name: '', amount: 1, unit: 'g' }],
      }),
    ).toThrow();
  });
  it('rejects invalid chronological, cook and parallel assignments', () => {
    const input = request(2, 2);
    const directions = mockResponse(input).recipes[0].directions;
    for (const patch of [
      { step: 2 },
      { assignedCooks: [0] },
      { assignedCooks: [3] },
      { assignedCooks: [1, 1] },
      { assignedCooks: [] },
      { waitingTimeMinutes: -1 },
      { parallelGroup: '' },
      { assignedCooks: [2] },
    ]) {
      expect(
        changed({ directions: [{ ...directions[0], ...patch }, ...directions.slice(1)] }, input),
      ).toThrow();
    }
    expect(
      changed(
        { directions: [{ ...directions[0], parallelGroup: 'single' }, ...directions.slice(1)] },
        input,
      ),
    ).toThrow();
    expect(
      changed(
        { directions: directions.map((direction) => ({ ...direction, assignedCooks: [1] })) },
        input,
      ),
    ).toThrow();
    expect(
      changed(
        {
          directions: directions.map((direction) => {
            const copy = { ...direction };
            delete copy.parallelGroup;
            return copy;
          }),
        },
        input,
      ),
    ).toThrow();
    expect(directions.map((d) => d.step)).toEqual([1, 2, 3]);
  });
});

describe('Public development repository and pagination', () => {
  /** Erzeugt mehr als eine Seite eindeutiger, bereits validierter Recipe-Fixtures. */
  function pool(): Recipe[] {
    const recipe = mockResponse(request()).recipes[0];
    return Array.from({ length: 45 }, (_, index) => ({
      ...recipe,
      id: 'saved-' + index,
      cuisine: index < 25 ? 'italian' : 'german',
    }));
  }
  it('saves many idempotently and finds old recipes independently of current flow', async () => {
    const repository = TestBed.inject(RECIPE_REPOSITORY);
    const recipes = pool();
    await repository.saveMany(recipes);
    await repository.saveMany(recipes);
    expect((await repository.list()).total).toBe(45);
    expect(await repository.getById(recipes[0].id)).toBe(recipes[0]);
    expect(await repository.getById('missing')).toBeUndefined();
    TestBed.inject(FlowState).saveIngredient({ name: 'Neu', amount: 1, unit: 'g' });
    expect(await repository.getById(recipes[0].id)).toBe(recipes[0]);
  });
  it('paginates at 20 and filters before pagination', async () => {
    const repository = TestBed.inject(RECIPE_REPOSITORY);
    await repository.saveMany(pool());
    expect((await repository.list()).items).toHaveLength(LIMITS.libraryPageSize);
    expect((await repository.list({ page: 2 })).items[0].id).toBe('saved-20');
    expect((await repository.list({ page: 3 })).items).toHaveLength(5);
    expect(await repository.list({ cuisine: 'italian', page: 2 })).toMatchObject({
      total: 25,
      page: 2,
      pages: 2,
    });
    expect((await repository.list({ cuisine: 'italian', page: 2 })).items).toHaveLength(5);
    expect(paginate(pool(), 99).page).toBe(3);
    expect(paginate(pool(), -1).page).toBe(1);
    expect(paginate([])).toEqual({ items: [], total: 0, page: 1, pages: 1 });
    expect(paginate(pool().slice(0, 20)).pages).toBe(1);
    expect(paginate(pool().slice(0, 21)).pages).toBe(2);
  });
  it('generation saves three recipes and keeps older generations available', async () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: GENERATION_PROVIDER,
          useValue: { generate: async (input: GenerationRequest) => mockResponse(input) },
        },
      ],
    });
    const state = TestBed.inject(FlowState);
    const repository = TestBed.inject(RECIPE_REPOSITORY);
    state.saveIngredient(ingredients[0]);
    state.setPreferences(preferences);
    state.setServings(4);
    state.setCookCount(3);
    await state.generate();
    const first = state.recipes()[0];
    expect(state.status()).toBe('success');
    expect(first.servings).toBe(4);
    expect(first.cookCount).toBe(3);
    await state.generate();
    expect((await repository.list()).total).toBe(6);
    expect(await repository.getById(first.id)).toBe(first);
  });
});
