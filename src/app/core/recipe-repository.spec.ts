import { createRequest } from './business';
import { mockResponse } from './generation';
import { SupabaseRecipeRepository } from './recipe-repository';

const recipe = mockResponse(
  createRequest([{ id: 'pasta', name: 'Pasta', amount: 100, unit: 'g' }], {
    difficulty: 'quick',
    cuisine: 'italian',
    diet: 'none',
  }),
).recipes[0];

/** Erzeugt eine Data-API-Antwort mit optionalem exaktem Pagination-Count. */
function apiResponse(body: unknown, total?: number): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: total === undefined ? {} : { 'content-range': `0-0/${total}` },
  });
}

describe('SupabaseRecipeRepository', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('stores validated recipes as idempotent Data API rows', async () => {
    const request = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) => new Response(null, { status: 201 }),
    );
    vi.stubGlobal('fetch', request);
    await new SupabaseRecipeRepository().saveMany([recipe]);
    expect(request).toHaveBeenCalledTimes(1);
    const [url, init] = request.mock.calls[0];
    expect(String(url)).toContain('/rest/v1/recipes?on_conflict=id');
    expect(init?.method).toBe('POST');
    expect(new Headers(init?.headers).get('content-profile')).toBe('code_a_cuisine');
    expect(String(init?.body)).toContain('\"payload\"');
    expect(String(init?.body)).toContain(recipe.id);
  });

  it('validates a persisted recipe before returning it', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => apiResponse([{ payload: recipe }])));
    await expect(new SupabaseRecipeRepository().getById(recipe.id)).resolves.toEqual(recipe);

    vi.stubGlobal('fetch', vi.fn(async () => apiResponse([{ payload: { ...recipe, servings: 0 } }])));
    await expect(new SupabaseRecipeRepository().getById(recipe.id)).rejects.toThrow();
  });

  it('uses exact count for public pagination and cuisine filtering', async () => {
    const request = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        apiResponse([{ payload: recipe }], 21),
    );
    vi.stubGlobal('fetch', request);
    const result = await new SupabaseRecipeRepository().list({ page: 1, cuisine: 'italian' });
    expect(result).toMatchObject({ total: 21, page: 1, pages: 2 });
    expect(result.items).toEqual([recipe]);
    expect(String(request.mock.calls[0][0])).toContain('cuisine=eq.italian');
    expect(new Headers(request.mock.calls[0][1]?.headers).get('accept-profile')).toBe(
      'code_a_cuisine',
    );
  });
});
