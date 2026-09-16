import { Injectable } from '@angular/core';
import { N8N_PUBLIC_CONFIG } from '../../environments/runtime-config';
import { N8N_PATHS } from '../config/app.constants';
import { GenerationRequest, GenerationResponse, Recipe, RecipePage, RecipeQuery } from '../models/app.models';

type ApiErrorBody = { error?: { code?: string; message?: string } };

/** Describes a controlled error from the n8n recipe API. */
export class RecipeApiError extends Error {
  /**
   * Creates an error with an optional backend error code.
   *
   * @param {string} message - The fallback error message.
   * @param {string} [code='request_failed'] - The backend error code.
   */
  constructor(message: string, readonly code = 'request_failed') {
    super(message);
    this.name = 'RecipeApiError';
  }
}

/** Encapsulates all recipe, library, and favorite requests to n8n. */
@Injectable({ providedIn: 'root' })
export class RecipeService {
  /**
   * Sends recipe generation to the single production n8n endpoint.
   *
   * @param {GenerationRequest} request - The validated generation request sent to n8n.
   * @returns {Promise<GenerationResponse>} A promise resolving to the validated generation response.
   * @throws {Error} When the generation request fails or n8n returns a controlled API error.
   */
  async generate(request: GenerationRequest): Promise<GenerationResponse> {
    const response = await fetch(this.url(N8N_PATHS.generate), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw await this.apiError(response);
    return (await response.json()) as GenerationResponse;
  }

  /**
   * Loads exactly one stored recipe from the Firebase library through n8n.
   *
   * @param {string} id - The recipe identifier to load.
   * @returns {Promise<Recipe|undefined>} A promise resolving to the requested recipe, or undefined when it does not exist.
   * @throws {Error} When the recipe request fails.
   */
  async getById(id: string): Promise<Recipe | undefined> {
    if (!id.trim()) return undefined;
    const query = new URLSearchParams({ id });
    const response = await fetch(`${this.url(N8N_PATHS.library)}?${query}`);
    this.requireOk(response, 'Recipe could not be loaded.');
    const result = (await response.json()) as { recipe: Recipe | null };
    return result.recipe ?? undefined;
  }

  /**
   * Loads a paginated library page with an optional cuisine filter.
   *
   * @param {RecipeQuery} [query={}] - The optional library query parameters.
   * @returns {Promise<RecipePage>} A promise resolving to the requested recipe page.
   * @throws {Error} When the library request fails.
   */
  async list(query: RecipeQuery = {}): Promise<RecipePage> {
    const params = new URLSearchParams({ page: String(this.page(query.page)) });
    if (query.cuisine) params.set('cuisine', query.cuisine);
    const response = await fetch(`${this.url(N8N_PATHS.library)}?${params}`);
    this.requireOk(response, 'Recipe library could not be loaded.');
    return (await response.json()) as RecipePage;
  }

  /**
   * Registers a favorite through the same n8n/Firebase data path.
   *
   * @param {string} id - The recipe identifier to favorite.
   * @returns {Promise<void>} A promise that resolves after the favorite has been persisted.
   * @throws {Error} When the favorite request fails.
   */
  async favorite(id: string): Promise<void> {
    const response = await fetch(this.url(N8N_PATHS.favorite), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    this.requireOk(response, 'Favorite could not be saved.');
  }

  /**
   * Builds a webhook URL and reports missing runtime configuration clearly.
   *
   * @param {string} path - The webhook path appended to the configured n8n base URL.
   * @returns {string} The complete URL for the requested n8n webhook.
   * @throws {RecipeApiError} When the n8n base URL is not configured.
   */
  private url(path: string): string {
    const base = N8N_PUBLIC_CONFIG.webhookBaseUrl;
    if (!base) throw new RecipeApiError('n8n is not configured.', 'n8n_not_configured');
    return `${base}/${path}`;
  }

  /**
   * Normalizes page numbers to a positive integer.
   *
   * @param {number} [value] - The value to normalize or validate.
   * @returns {number} A positive page number suitable for the library request.
   */
  private page(value?: number): number {
    return Number.isInteger(value) ? Math.max(1, value ?? 1) : 1;
  }

  /**
   * Throws a simple error for failed library requests.
   *
   * @param {Response} response - The HTTP response to validate.
   * @param {string} message - The fallback error message.
   * @returns {void} No value is returned.
   * @throws {RecipeApiError} When the HTTP response is not successful.
   */
  private requireOk(response: Response, message: string): void {
    if (!response.ok) throw new RecipeApiError(message, `http_${response.status}`);
  }

  /**
   * Applies only the controlled error contract from n8n.
   *
   * @param {Response} response - The HTTP response to validate.
   * @returns {Promise<RecipeApiError>} A promise resolving to the controlled API error.
   */
  private async apiError(response: Response): Promise<RecipeApiError> {
    try {
      const body = (await response.json()) as ApiErrorBody;
      if (body.error?.message) return new RecipeApiError(body.error.message, body.error.code);
    } catch {
      return new RecipeApiError('Recipe generation is currently unavailable.');
    }
    return new RecipeApiError('Recipe generation is currently unavailable.');
  }
}
