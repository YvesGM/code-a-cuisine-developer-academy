import { inject, Injectable, InjectionToken, isDevMode } from '@angular/core';
import { paginate } from './business';
import { N8N_PATHS } from './config';
import { Cuisine, Recipe, RecipePage, RecipeQuery } from './models';
import { validateStoredRecipe } from './response-validation';
import { N8N_PUBLIC_CONFIG } from '../../environments/runtime-config';

export interface RecipeRepository {
  /** Speichert Development-Rezepte; produktive Rezepte werden bereits serverseitig durch n8n persistiert. */
  saveMany(recipes: readonly Recipe[]): Promise<void>;
  /** Liefert eine gespeicherte ID oder undefined, unabhängig vom aktuellen Workflow. */
  getById(id: string): Promise<Recipe | undefined>;
  /** Liefert eine öffentliche, nach optionaler Cuisine gefilterte Seite samt Gesamtzahl. */
  list(query?: RecipeQuery): Promise<RecipePage>;
}

@Injectable({ providedIn: 'root' })
export class InMemoryRecipeRepository implements RecipeRepository {
  private readonly recipes = new Map<string, Recipe>();

  /** Hält validierte unveränderte Datensätze während dieser App-Sitzung; kein localStorage. */
  async saveMany(recipes: readonly Recipe[]): Promise<void> {
    for (const recipe of recipes) this.recipes.set(recipe.id, recipe);
  }

  /** Öffnet auch Rezepte älterer Generierungen über deren stabile ID. */
  async getById(id: string): Promise<Recipe | undefined> {
    return this.recipes.get(id);
  }

  /** Behält Einfügereihenfolge bei; Filterung erfolgt vor Pagination. */
  async list(query: RecipeQuery = {}): Promise<RecipePage> {
    const recipes = [...this.recipes.values()].filter(
      (recipe) => !query.cuisine || recipe.cuisine === query.cuisine,
    );
    return paginate(recipes, query.page);
  }
}

type JsonRecord = Record<string, unknown>;

/** Baut eine stabile öffentliche n8n-URL aus der Runtime-Basis. */
function libraryEndpoint(): string {
  return `${N8N_PUBLIC_CONFIG.webhookBaseUrl}/${N8N_PATHS.library}`;
}

/** Erzwingt ein JSON-Objekt für externe n8n-Antworten. */
function asRecord(value: unknown): JsonRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Ungültige Library-Antwort.');
  return value as JsonRecord;
}

/** Prüft einen einzelnen Library-Lookup und validiert den Firebase-Payload erneut im Frontend. */
function parseRecipeLookup(value: unknown): Recipe | undefined {
  const row = asRecord(value);
  if (row['recipe'] === null) return undefined;
  return validateStoredRecipe(row['recipe']);
}

/** Prüft die paginierte Library-Antwort und jeden darin enthaltenen Recipe-Payload. */
function parseRecipePage(value: unknown): RecipePage {
  const row = asRecord(value);
  if (!Array.isArray(row['items'])) throw new Error('Ungültige Library-Antwort.');
  for (const key of ['total', 'page', 'pages'] as const) {
    if (typeof row[key] !== 'number' || !Number.isInteger(row[key]) || row[key] < 0)
      throw new Error('Ungültige Library-Antwort.');
  }
  return {
    items: row['items'].map((recipe) => validateStoredRecipe(recipe)),
    total: row['total'],
    page: row['page'],
    pages: row['pages'],
  };
}

/** Wirft kontrollierte HTTP-Fehler, ohne Backend-Inhalte oder Credentials in die UI zu übernehmen. */
async function requireOk(response: Response): Promise<void> {
  if (!response.ok) throw new Error(`Recipe Library API fehlgeschlagen (${response.status}).`);
}

@Injectable({ providedIn: 'root' })
export class N8nRecipeRepository implements RecipeRepository {
  /** Produktive Browser-Writes sind absichtlich deaktiviert; n8n persistiert direkt in Firebase. */
  async saveMany(_recipes: readonly Recipe[]): Promise<void> {
    throw new Error('Produktive Recipe-Writes erfolgen ausschließlich serverseitig über n8n.');
  }

  /** Lädt eine öffentliche Recipe-ID über n8n aus Firebase und validiert den Payload erneut. */
  async getById(id: string): Promise<Recipe | undefined> {
    if (!id.trim()) return undefined;
    const params = new URLSearchParams({ id });
    const response = await fetch(`${libraryEndpoint()}?${params}`);
    await requireOk(response);
    return parseRecipeLookup((await response.json()) as unknown);
  }

  /** Lädt eine serverseitig paginierte und optional nach Cuisine gefilterte Firebase-Library-Seite. */
  async list(query: RecipeQuery = {}): Promise<RecipePage> {
    const page = Number.isInteger(query.page) ? Math.max(1, query.page ?? 1) : 1;
    const params = new URLSearchParams({ page: String(page) });
    if (query.cuisine) params.set('cuisine', query.cuisine);
    const response = await fetch(`${libraryEndpoint()}?${params}`);
    await requireOk(response);
    return parseRecipePage((await response.json()) as unknown);
  }
}

/**
 * Ohne n8n verwendet Development den bestehenden In-Memory-Adapter. Sobald n8n konfiguriert ist,
 * liest die App die dauerhafte Firebase-Library ausschließlich über den öffentlichen n8n-Endpunkt.
 */
export const RECIPE_REPOSITORY = new InjectionToken<RecipeRepository>('RECIPE_REPOSITORY', {
  providedIn: 'root',
  factory: () => {
    if (N8N_PUBLIC_CONFIG.webhookBaseUrl) return inject(N8nRecipeRepository);
    if (isDevMode()) return inject(InMemoryRecipeRepository);
    throw new Error('n8n Webhook-Basis-URL fehlt.');
  },
});
