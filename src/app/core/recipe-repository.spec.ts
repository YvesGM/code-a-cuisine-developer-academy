import { createRequest } from './business';
import { mockResponse } from './generation';
import { N8nRecipeRepository } from './recipe-repository';

const recipe = mockResponse(
  createRequest([{ id: 'pasta', name: 'Pasta', amount: 100, unit: 'g' }], {
    difficulty: 'quick',
    cuisine: 'italian',
    diet: 'none',
  }),
).recipes[0];

/** Erzeugt eine erfolgreiche JSON-Antwort des öffentlichen Library-Webhooks. */
function apiResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200 });
}

describe('N8nRecipeRepository', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('never writes recipes from the browser', async () => {
    await expect(new N8nRecipeRepository().saveMany([recipe])).rejects.toThrow(
      'ausschließlich serverseitig',
    );
  });

  it('validates a persisted Firebase recipe before returning it', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => apiResponse({ recipe })),
    );
    await expect(new N8nRecipeRepository().getById(recipe.id)).resolves.toEqual(recipe);

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => apiResponse({ recipe: { ...recipe, servings: 0 } })),
    );
    await expect(new N8nRecipeRepository().getById(recipe.id)).rejects.toThrow();
  });

  it('sends favorites through the dedicated n8n library owner', async () => {
    const request = vi.fn(
      async (_input: Parameters<typeof fetch>[0], _init?: Parameters<typeof fetch>[1]) =>
        apiResponse({ ok: true }),
    );
    vi.stubGlobal('fetch', request);
    await expect(new N8nRecipeRepository().favorite(recipe.id)).resolves.toBeUndefined();
    const [url, init] = request.mock.calls[0];
    expect(String(url)).toContain('code-a-cuisine-favorite');
    expect(init).toMatchObject({ method: 'POST' });
    expect(String((init as RequestInit).body)).toContain(recipe.id);
  });

  it('uses the n8n library endpoint for pagination and cuisine filtering', async () => {
    const request = vi.fn(async (_input: Parameters<typeof fetch>[0]) =>
      apiResponse({ items: [recipe], topLiked: [{ ...recipe, favoriteCount: 7 }], total: 21, page: 1, pages: 2 }),
    );
    vi.stubGlobal('fetch', request);
    const result = await new N8nRecipeRepository().list({ page: 1, cuisine: 'italian' });
    expect(result).toMatchObject({ total: 21, page: 1, pages: 2 });
    expect(result.items).toEqual([recipe]);
    expect(result.topLiked).toEqual([{ ...recipe, favoriteCount: 7 }]);
    const url = String(request.mock.calls[0][0]);
    expect(url).toContain('code-a-cuisine-library');
    expect(url).toContain('cuisine=italian');
    expect(url).toContain('page=1');
  });
});
