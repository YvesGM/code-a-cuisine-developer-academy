import { createRequest } from './business';
import { mockResponse } from './generation';
import { validateResponse } from './response-validation';
const request = createRequest([{ id: 'pasta', name: 'Pasta', amount: 100, unit: 'g' }], {
  difficulty: 'quick',
  cuisine: 'italian',
  diet: 'none',
});
describe('Response validation', () => {
  it('accepts deterministic mock data and detaches it', () => {
    const response = mockResponse(request);
    expect(validateResponse(response, request)).toEqual(response);
    expect(validateResponse(response, request)).not.toBe(response);
    expect(mockResponse(request)).toEqual(response);
  });
  it.each([
    null,
    {},
    { schemaVersion: 1 },
    { schemaVersion: 2, clientRequestId: request.clientRequestId, recipes: [] },
  ])('rejects empty or invalid envelopes %j', (response) =>
    expect(() => validateResponse(response, request)).toThrow(),
  );
  it('accepts the server persistence marker and rejects non-boolean markers', () => {
    const response = mockResponse(request);
    expect(validateResponse({ ...response, persisted: true }, request).persisted).toBe(true);
    expect(() => validateResponse({ ...response, persisted: 'yes' }, request)).toThrow();
  });
  it('rejects a mismatched request ID', () =>
    expect(() =>
      validateResponse({ ...mockResponse(request), clientRequestId: 'other' }, request),
    ).toThrow());
  it.each([
    { id: '' },
    { title: ' ' },
    { cuisine: 'unknown' },
    { difficulty: 'unknown' },
    { diet: 'unknown' },
    { cookingTimeMinutes: 0 },
    { cookingTimeMinutes: Infinity },
    { rank: 1.5 },
    { nutrition: { energyKcal: -1, proteinG: 0, fatG: 0, carbsG: 0 } },
    { nutrition: { energyKcal: 10, proteinG: '12', fatG: 0, carbsG: 0 } },
    { ingredients: [] },
    { ingredients: [{ sourceIngredientId: 'shrimp', name: 'Shrimp', amount: 1, unit: 'g' }] },
    { ingredients: [{ sourceIngredientId: 'pasta', name: 'Shrimp', amount: 1, unit: 'g' }] },
    { ingredients: [{ sourceIngredientId: 'pasta', name: 'Pasta', amount: 101, unit: 'g' }] },
    { ingredients: [{ sourceIngredientId: 'pasta', name: 'Pasta', amount: 1, unit: 'kg' }] },
    { directions: [] },
    { directions: [{ step: 2, title: 'Step', instruction: 'Text' }] },
    { directions: [{ step: 1, title: '', instruction: 'Text' }] },
  ])('rejects malformed recipe %j', (patch) => {
    const response = mockResponse(request);
    expect(() =>
      validateResponse(
        {
          ...response,
          recipes: [{ ...response.recipes[0], ...patch }, ...response.recipes.slice(1)],
        },
        request,
      ),
    ).toThrow();
  });
  it('rejects duplicate recipe IDs and repeated ingredient references', () => {
    const response = mockResponse(request);
    const recipe = response.recipes[0];
    expect(() =>
      validateResponse({ ...response, recipes: [recipe, recipe, response.recipes[2]] }, request),
    ).toThrow();
    expect(() =>
      validateResponse(
        {
          ...response,
          recipes: [
            { ...recipe, ingredients: [recipe.ingredients[0], recipe.ingredients[0]] },
            ...response.recipes.slice(1),
          ],
        },
        request,
      ),
    ).toThrow();
  });
});
