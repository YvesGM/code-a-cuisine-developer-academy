import { createRequest, ranked, topRecipes, validIngredient, validPreferences } from './business';
import { LIMITS, OPTIONS } from './config';
import { mockResponse } from './generation';
import { Ingredient, Preferences } from './models';
const ingredients: Ingredient[] = [{ id: 'pasta', name: 'Pasta', amount: 100, unit: 'g' }];
const preferences: Preferences = { difficulty: 'quick', cuisine: 'italian', diet: 'none' };
describe('Business utilities', () => {
  it.each([0, -1, NaN, Infinity])('rejects invalid amount %s', (amount) =>
    expect(validIngredient({ name: 'Pasta', amount, unit: 'g' })).toBe(false),
  );
  it('rejects whitespace names and accepts positive fractional amounts', () => {
    expect(validIngredient({ name: '  ', amount: 1, unit: 'g' })).toBe(false);
    expect(validIngredient({ name: 'Pasta', amount: 0.5, unit: 'kg' })).toBe(true);
  });
  it('maps an independent versioned request with a unique ID', () => {
    const first = createRequest(ingredients, preferences);
    const second = createRequest(ingredients, preferences);
    expect(first.clientRequestId).not.toBe(second.clientRequestId);
    expect(first).toMatchObject({
      schemaVersion: 2,
      ingredients,
      preferences,
      servings: 2,
      cookCount: 1,
    });
    expect(first.ingredients).not.toBe(ingredients);
    expect(first.preferences).not.toBe(preferences);
  });
  it('rejects missing input', () => expect(() => createRequest([], preferences)).toThrow());
  it('accepts configured preferences', () => expect(validPreferences(preferences)).toBe(true));
  it('ranks the three results without modifying the response set', () => {
    const pool = [...mockResponse(createRequest(ingredients, preferences)).recipes].reverse();
    const ids = pool.map((r) => r.id);
    expect(topRecipes(pool)).toHaveLength(LIMITS.generationRecipes);
    expect(topRecipes(pool).map((r) => r.rank)).toEqual([1, 2, 3]);
    expect(pool.map((r) => r.id)).toEqual(ids);
    expect(ranked([])).toEqual([]);
  });
  it('returns three Italian top results when Italian cuisine is selected', () => {
    const pool = mockResponse(createRequest(ingredients, preferences)).recipes;
    expect(LIMITS.generationRecipes).toBe(3);
    expect(topRecipes(pool).map((recipe) => recipe.cuisine)).toEqual([
      'italian',
      'italian',
      'italian',
    ]);
  });
  it.each(OPTIONS.cuisines)(
    'keeps selected preferences for all three %s mock recipes',
    (cuisine) => {
      const selected: Preferences = { difficulty: 'complex', cuisine, diet: 'vegan' };
      const pool = mockResponse(createRequest(ingredients, selected)).recipes;
      const top = topRecipes([...pool].reverse());
      expect(top).toHaveLength(LIMITS.generationRecipes);
      for (const recipe of top) {
        expect(recipe).toMatchObject(selected);
        expect(pool).toContain(recipe);
      }
      expect(pool).toHaveLength(LIMITS.generationRecipes);
      expect(new Set(pool.map((recipe) => recipe.rank)).size).toBe(pool.length);
    },
  );
});
