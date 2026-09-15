import { Injectable } from '@angular/core';
import { N8N_PUBLIC_CONFIG } from '../../environments/runtime-config';
import { N8N_PATHS } from '../config/app.constants';
import { GenerationRequest, GenerationResponse, Recipe, RecipePage, RecipeQuery } from '../models/app.models';

type ApiErrorBody = { error?: { code?: string; message?: string } };

/** Beschreibt einen kontrollierten Fehler aus der n8n-Rezeptschnittstelle. */
export class RecipeApiError extends Error {
  /** Erstellt einen Fehler mit optionalem Backend-Fehlercode. */
  constructor(message: string, readonly code = 'request_failed') {
    super(message);
    this.name = 'RecipeApiError';
  }
}

/** Kapselt alle Rezept-, Library- und Favorite-Aufrufe an n8n. */
@Injectable({ providedIn: 'root' })
export class RecipeService {
  /** Sendet eine Rezeptgenerierung an den einzigen produktiven n8n-Endpunkt. */
  async generate(request: GenerationRequest): Promise<GenerationResponse> {
    const response = await fetch(this.url(N8N_PATHS.generate), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw await this.apiError(response);
    return (await response.json()) as GenerationResponse;
  }

  /** Lädt genau ein gespeichertes Rezept aus der Firebase-Library über n8n. */
  async getById(id: string): Promise<Recipe | undefined> {
    if (!id.trim()) return undefined;
    const query = new URLSearchParams({ id });
    const response = await fetch(`${this.url(N8N_PATHS.library)}?${query}`);
    this.requireOk(response, 'Recipe could not be loaded.');
    const result = (await response.json()) as { recipe: Recipe | null };
    return result.recipe ?? undefined;
  }

  /** Lädt eine paginierte Library-Seite mit optionalem Cuisine-Filter. */
  async list(query: RecipeQuery = {}): Promise<RecipePage> {
    const params = new URLSearchParams({ page: String(this.page(query.page)) });
    if (query.cuisine) params.set('cuisine', query.cuisine);
    const response = await fetch(`${this.url(N8N_PATHS.library)}?${params}`);
    this.requireOk(response, 'Recipe library could not be loaded.');
    return (await response.json()) as RecipePage;
  }

  /** Registriert einen Favorite über denselben n8n/Firebase-Datenweg. */
  async favorite(id: string): Promise<void> {
    const response = await fetch(this.url(N8N_PATHS.favorite), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    this.requireOk(response, 'Favorite could not be saved.');
  }

  /** Baut eine Webhook-URL und meldet eine fehlende Runtime-Konfiguration verständlich. */
  private url(path: string): string {
    const base = N8N_PUBLIC_CONFIG.webhookBaseUrl;
    if (!base) throw new RecipeApiError('n8n is not configured.', 'n8n_not_configured');
    return `${base}/${path}`;
  }

  /** Normalisiert Seitennummern auf eine positive ganze Zahl. */
  private page(value?: number): number {
    return Number.isInteger(value) ? Math.max(1, value ?? 1) : 1;
  }

  /** Wirft einen einfachen Fehler für fehlgeschlagene Library-Aufrufe. */
  private requireOk(response: Response, message: string): void {
    if (!response.ok) throw new RecipeApiError(message, `http_${response.status}`);
  }

  /** Übernimmt nur den kontrollierten Fehlervertrag aus n8n. */
  private async apiError(response: Response): Promise<RecipeApiError> {
    try {
      const body = (await response.json()) as ApiErrorBody;
      if (body.error?.message) return new RecipeApiError(body.error.message, body.error.code);
    } catch {
      // Fallback below.
    }
    return new RecipeApiError('Die Rezeptgenerierung ist aktuell nicht verfügbar.');
  }
}
