import { inject, Injectable, InjectionToken, isDevMode } from '@angular/core';
import { N8N_PUBLIC_CONFIG } from '../../environments/runtime-config';
import { paginate } from './business';
import { N8N_PATHS } from './config';
import { Recipe, RecipePage, RecipeQuery } from './models';
import { validateStoredRecipe } from './response-validation';

export interface RecipeRepository {
  /** Speichert Development-Rezepte; produktive Rezepte werden bereits serverseitig durch n8n persistiert. */
  saveMany(recipes: readonly Recipe[]): Promise<void>;
  /** Liefert eine gespeicherte ID oder undefined, unabhängig vom aktuellen Workflow. */
  getById(id: string): Promise<Recipe | undefined>;
  /** Liefert eine öffentliche, nach optionaler Cuisine gefilterte Seite samt Gesamtzahl. */
  list(query?: RecipeQuery): Promise<RecipePage>;
  /** Registriert genau einen öffentlichen Favorite für eine bekannte Recipe-ID. */
  favorite(id: string): Promise<void>;
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

  /** Registriert im Development-Adapter einen Favorite direkt am bestehenden Datensatz. */
  async favorite(id: string): Promise<void> {
    const recipe = this.recipes.get(id);
    if (!recipe) throw new Error('Recipe nicht gefunden.');
    this.recipes.set(id, { ...recipe, favoriteCount: (recipe.favoriteCount ?? 0) + 1 });
  }

  /** Liefert für Development dieselben globalen Top-Favorites wie der serverseitige Library-Owner. */
  private topLiked(): readonly Recipe[] {
    return [...this.recipes.values()]
      .filter((recipe) => (recipe.favoriteCount ?? 0) > 0)
      .sort((a, b) => (b.favoriteCount ?? 0) - (a.favoriteCount ?? 0))
      .slice(0, 6);
  }

  /** Behält Einfügereihenfolge bei; Filterung erfolgt vor Pagination. */
  async list(query: RecipeQuery = {}): Promise<RecipePage> {
    const recipes = [...this.recipes.values()].filter(
      (recipe) => !query.cuisine || recipe.cuisine === query.cuisine,
    );
    return { ...paginate(recipes, query.page), topLiked: this.topLiked() };
  }
}

type JsonRecord = Record<string, unknown>;

/** Baut eine stabile öffentliche n8n-URL aus der Runtime-Basis. */
function libraryEndpoint(): string {
  return `${N8N_PUBLIC_CONFIG.webhookBaseUrl}/${N8N_PATHS.library}`;
}

/** Baut den Favorite-Endpunkt innerhalb desselben n8n-Library-Owners. */
function favoriteEndpoint(): string {
  return `${N8N_PUBLIC_CONFIG.webhookBaseUrl}/${N8N_PATHS.favorite}`;
}

/** Erzwingt ein JSON-Objekt für externe n8n-Antworten. */
function asRecord(value: unknown): JsonRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Ungültige Library-Antwort.');
  }
  return value as JsonRecord;
}

/** Prüft einen einzelnen Library-Lookup und validiert den Firebase-Payload erneut im Frontend. */
function parseRecipeLookup(value: unknown): Recipe | undefined {
  const row = asRecord(value);
  if (row['recipe'] === null) return undefined;
  return validateStoredRecipe(row['recipe']);
}

/** Prüft genau einen ganzzahligen Pagination-Wert aus der n8n-Antwort. */
function pageNumber(row: JsonRecord, key: 'total' | 'page' | 'pages'): number {
  const value = row[key];
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new Error('Ungültige Library-Antwort.');
  }
  return value;
}

/** Prüft die paginierte Library-Antwort und jeden darin enthaltenen Recipe-Payload. */
function parseRecipePage(value: unknown): RecipePage {
  const row = asRecord(value);
  if (!Array.isArray(row['items'])) throw new Error('Ungültige Library-Antwort.');
  const topLiked = Array.isArray(row['topLiked']) ? row['topLiked'] : [];
  return {
    items: row['items'].map((recipe) => validateStoredRecipe(recipe)),
    topLiked: topLiked.map((recipe) => validateStoredRecipe(recipe)),
    total: pageNumber(row, 'total'),
    page: pageNumber(row, 'page'),
    pages: pageNumber(row, 'pages'),
  };
}

/** Wirft kontrollierte HTTP-Fehler, ohne Backend-Inhalte oder Credentials in die UI zu übernehmen. */
async function requireOk(response: Response): Promise<void> {
  if (!response.ok) throw new Error(`Recipe Library API fehlgeschlagen (${response.status}).`);
}

/** Normalisiert die gewünschte Library-Seite auf eine positive ganze Zahl. */
function requestedPage(query: RecipeQuery): number {
  return Number.isInteger(query.page) ? Math.max(1, query.page ?? 1) : 1;
}

/** Baut Queryparameter für serverseitige Pagination und optionalen Cuisine-Filter. */
function libraryParams(query: RecipeQuery): URLSearchParams {
  const params = new URLSearchParams({ page: String(requestedPage(query)) });
  if (query.cuisine) params.set('cuisine', query.cuisine);
  return params;
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
    const response = await fetch(`${libraryEndpoint()}?${new URLSearchParams({ id })}`);
    await requireOk(response);
    return parseRecipeLookup((await response.json()) as unknown);
  }

  /** Registriert einen Favorite serverseitig über n8n, ohne Firebase-Zugang im Browser. */
  async favorite(id: string): Promise<void> {
    if (!id.trim()) throw new Error('Recipe-ID fehlt.');
    const response = await fetch(favoriteEndpoint(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    await requireOk(response);
  }

  /** Lädt eine serverseitig paginierte und optional nach Cuisine gefilterte Firebase-Library-Seite. */
  async list(query: RecipeQuery = {}): Promise<RecipePage> {
    const response = await fetch(`${libraryEndpoint()}?${libraryParams(query)}`);
    await requireOk(response);
    return parseRecipePage((await response.json()) as unknown);
  }
}

/** Wählt genau einen Library-Adapter und verhindert produktive Fallbacks auf In-Memory-Daten. */
function recipeRepositoryFactory(): RecipeRepository {
  if (N8N_PUBLIC_CONFIG.webhookBaseUrl) return inject(N8nRecipeRepository);
  if (isDevMode()) return inject(InMemoryRecipeRepository);
  throw new Error('n8n Webhook-Basis-URL fehlt.');
}

/** Öffentliche Repository-Abstraktion für Session-Mock oder dauerhafte Firebase-Library via n8n. */
export const RECIPE_REPOSITORY = new InjectionToken<RecipeRepository>('RECIPE_REPOSITORY', {
  providedIn: 'root',
  factory: recipeRepositoryFactory,
});
