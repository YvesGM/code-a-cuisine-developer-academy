import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { N8N_PUBLIC_CONFIG } from '../../environments/runtime-config';
import { N8N_PATHS } from '../constants/recipe-flow.constants';
import { GenerationRequest, GenerationResponse, Recipe, RecipePage, RecipeQuery } from '../models/app.models';

type ApiErrorBody = { error?: { code?: string; message?: string } };

/** Represents a controlled failure returned by the n8n recipe API. */
export class RecipeApiError extends Error {
  /** Creates a recipe API error with an optional backend error code.
   * @param {string} message - The user-facing fallback or backend error message.
   * @param {string} [code='request_failed'] - The stable backend error code. */
  constructor(message: string, readonly code = 'request_failed') {
    super(message);
    this.name = 'RecipeApiError';
  }
}

/** Handles recipe generation, library access, and favorites through Angular HttpClient and n8n. */
@Injectable({ providedIn: 'root' })
export class RecipeService {
  private readonly http = inject(HttpClient);

  /** Sends a recipe-generation request to the production n8n endpoint.
   * @param {GenerationRequest} request - The validated generation request.
   * @returns {Promise<GenerationResponse>} The validated generation response.
   * @throws {RecipeApiError} When n8n rejects the request or the HTTP request fails. */
  async generate(request: GenerationRequest): Promise<GenerationResponse> {
    try {
      return await firstValueFrom(this.http.post<GenerationResponse>(this.url(N8N_PATHS.generate), request));
    } catch (error) {
      throw this.apiError(error, 'Recipe generation is currently unavailable.');
    }
  }

  /** Loads one stored recipe from the Firebase-backed library through n8n.
   * @param {string} id - The recipe identifier to load.
   * @returns {Promise<Recipe|undefined>} The recipe, or undefined when it does not exist.
   * @throws {RecipeApiError} When the library request fails. */
  async getById(id: string): Promise<Recipe | undefined> {
    if (!id.trim()) return undefined;
    try {
      const result = await firstValueFrom(this.http.get<{ recipe: Recipe | null }>(this.url(N8N_PATHS.library), { params: { id } }));
      return result.recipe ?? undefined;
    } catch (error) {
      throw this.apiError(error, 'Recipe could not be loaded.');
    }
  }

  /** Loads a paginated recipe library page with an optional cuisine filter.
   * @param {RecipeQuery} [query={}] - The optional library query parameters.
   * @returns {Promise<RecipePage>} The requested recipe page.
   * @throws {RecipeApiError} When the library request fails. */
  async list(query: RecipeQuery = {}): Promise<RecipePage> {
    const params: Record<string, string> = { page: String(this.page(query.page)) };
    if (query.cuisine) params['cuisine'] = query.cuisine;
    try {
      return await firstValueFrom(this.http.get<RecipePage>(this.url(N8N_PATHS.library), { params }));
    } catch (error) {
      throw this.apiError(error, 'Recipe library could not be loaded.');
    }
  }

  /** Persists one favorite through n8n and Firebase.
   * @param {string} id - The recipe identifier to favorite.
   * @returns {Promise<void>} Resolves after n8n confirms persistence.
   * @throws {RecipeApiError} When the favorite request fails. */
  async favorite(id: string): Promise<void> {
    try {
      await firstValueFrom(this.http.post(this.url(N8N_PATHS.favorite), { id }));
    } catch (error) {
      throw this.apiError(error, 'Favorite could not be saved.');
    }
  }

  /** Builds a webhook URL from the public runtime configuration.
   * @param {string} path - The n8n webhook path to append.
   * @returns {string} The complete n8n webhook URL.
   * @throws {RecipeApiError} When the n8n base URL is not configured. */
  private url(path: string): string {
    const base = N8N_PUBLIC_CONFIG.webhookBaseUrl;
    if (!base) throw new RecipeApiError('n8n is not configured.', 'n8n_not_configured');
    return `${base}/${path}`;
  }

  /** Normalizes a library page value to a positive integer.
   * @param {number} [value] - The page value to normalize.
   * @returns {number} A positive page number. */
  private page(value?: number): number {
    return Number.isInteger(value) ? Math.max(1, value ?? 1) : 1;
  }

  /** Converts Angular HTTP failures to the stable recipe API error contract.
   * @param {unknown} error - The error thrown by Angular HttpClient.
   * @param {string} fallback - The message used when n8n supplies no controlled message.
   * @returns {RecipeApiError} A normalized recipe API error. */
  private apiError(error: unknown, fallback: string): RecipeApiError {
    if (!(error instanceof HttpErrorResponse)) return new RecipeApiError(fallback);
    const body = error.error as ApiErrorBody | null;
    const message = body?.error?.message ?? fallback;
    const code = body?.error?.code ?? (error.status ? `http_${error.status}` : 'request_failed');
    return new RecipeApiError(message, code);
  }
}
