import { inject, Injectable, InjectionToken, isDevMode } from '@angular/core';
import { LIMITS, SCHEMA_VERSION } from './config';
import { paginate } from './business';
import { Cuisine, Recipe, RecipePage, RecipeQuery } from './models';
import { validateStoredRecipe } from './response-validation';
import { SUPABASE_PUBLIC_CONFIG } from '../../environments/supabase';

export interface RecipeRepository {
  /** Speichert einen validierten Satz atomar und idempotent nach Recipe-ID; Fehler werden weitergegeben. */
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

type SupabaseRecipeRow = {
  readonly payload: unknown;
};

/** Meldet nur dann Supabase-Betrieb, wenn URL und browsergeeigneter Publishable Key gesetzt sind. */
function hasSupabaseConfig(): boolean {
  return Boolean(SUPABASE_PUBLIC_CONFIG.url.trim() && SUPABASE_PUBLIC_CONFIG.publishableKey.trim());
}

/** Normalisiert die Projekt-URL und hängt den Data-API-Pfad für Recipes an. */
function recipesEndpoint(): string {
  return SUPABASE_PUBLIC_CONFIG.url.replace(/\/+$/, '') + '/rest/v1/recipes';
}

/** Liefert öffentliche Data-API-Header und wählt das dedizierte Code-a-Cuisine-Schema. */
function supabaseHeaders(mode: 'read' | 'write', prefer?: string): HeadersInit {
  return {
    apikey: SUPABASE_PUBLIC_CONFIG.publishableKey,
    'Content-Type': 'application/json',
    ...(mode === 'read'
      ? { 'Accept-Profile': SUPABASE_PUBLIC_CONFIG.schema }
      : { 'Content-Profile': SUPABASE_PUBLIC_CONFIG.schema }),
    ...(prefer ? { Prefer: prefer } : {}),
  };
}

/** Wandelt ein validiertes Domain-Recipe in die bewusst schmale persistierte Tabellenzeile um. */
function recipeRow(recipe: Recipe): Record<string, unknown> {
  return {
    id: recipe.id,
    schema_version: SCHEMA_VERSION,
    title: recipe.title,
    cuisine: recipe.cuisine,
    difficulty: recipe.difficulty,
    diet: recipe.diet,
    cooking_time_minutes: recipe.cookingTimeMinutes,
    servings: recipe.servings,
    cook_count: recipe.cookCount,
    rank: recipe.rank,
    payload: recipe,
  };
}

/** Prüft eine Supabase-Listenantwort, bevor persistierte JSON-Daten in die UI gelangen. */
function recipesFromRows(value: unknown): Recipe[] {
  if (!Array.isArray(value)) throw new Error('Ungültige Supabase-Antwort für die Rezeptebibliothek.');
  return value.map((row) => {
    if (!row || typeof row !== 'object' || Array.isArray(row) || !('payload' in row))
      throw new Error('Ungültige Supabase-Rezeptzeile.');
    return validateStoredRecipe((row as SupabaseRecipeRow).payload);
  });
}

/** Liest den exakten PostgREST-Count aus Content-Range; fehlender Count ist ein API-Fehler. */
function totalFrom(response: Response): number {
  const range = response.headers.get('content-range');
  const total = range?.split('/')[1];
  if (!total || total === '*') throw new Error('Supabase hat keinen exakten Recipe-Count geliefert.');
  const value = Number(total);
  if (!Number.isInteger(value) || value < 0) throw new Error('Ungültiger Supabase-Recipe-Count.');
  return value;
}

/** Wirft Data-API-Fehler mit knappem Status, ohne Schlüssel oder Response-Inhalte zu protokollieren. */
async function requireOk(response: Response): Promise<void> {
  if (!response.ok) throw new Error(`Supabase Recipe API fehlgeschlagen (${response.status}).`);
}

@Injectable({ providedIn: 'root' })
export class SupabaseRecipeRepository implements RecipeRepository {
  /** Speichert drei validierte Rezepte idempotent; bestehende IDs werden nicht überschrieben. */
  async saveMany(recipes: readonly Recipe[]): Promise<void> {
    const response = await fetch(recipesEndpoint() + '?on_conflict=id', {
      method: 'POST',
      headers: supabaseHeaders('write', 'resolution=ignore-duplicates,return=minimal'),
      body: JSON.stringify(recipes.map(recipeRow)),
    });
    await requireOk(response);
  }

  /** Lädt eine öffentliche Recipe-ID und validiert das persistierte JSON erneut. */
  async getById(id: string): Promise<Recipe | undefined> {
    if (!id.trim()) return undefined;
    const params = new URLSearchParams({ select: 'payload', id: `eq.${id}`, limit: '1' });
    const response = await fetch(`${recipesEndpoint()}?${params}`, {
      headers: supabaseHeaders('read'),
    });
    await requireOk(response);
    const recipes = recipesFromRows((await response.json()) as unknown);
    return recipes[0];
  }

  /** Liest eine öffentliche Seite; Cuisine-Filterung erfolgt serverseitig vor der Pagination. */
  async list(query: RecipeQuery = {}): Promise<RecipePage> {
    const requested = Number.isInteger(query.page) ? Math.max(1, query.page ?? 1) : 1;
    const first = await this.loadPage(requested, query.cuisine);
    if (requested <= first.pages) return first;
    return this.loadPage(first.pages, query.cuisine);
  }

  /** Führt genau eine paginierte Supabase-Abfrage mit exaktem Count aus. */
  private async loadPage(page: number, cuisine?: Cuisine): Promise<RecipePage> {
    const offset = (page - 1) * LIMITS.libraryPageSize;
    const params = new URLSearchParams({
      select: 'payload',
      order: 'created_at.desc,id.asc',
      limit: String(LIMITS.libraryPageSize),
      offset: String(offset),
    });
    if (cuisine) params.set('cuisine', `eq.${cuisine}`);
    const response = await fetch(`${recipesEndpoint()}?${params}`, {
      headers: supabaseHeaders('read', 'count=exact'),
    });
    await requireOk(response);
    const total = totalFrom(response);
    const pages = Math.max(1, Math.ceil(total / LIMITS.libraryPageSize));
    return {
      items: recipesFromRows((await response.json()) as unknown),
      total,
      page: Math.min(page, pages),
      pages,
    };
  }
}

/**
 * Development ohne Credentials bleibt bewusst In-Memory; Produktion verlangt Supabase-Konfiguration.
 * Sobald URL und Publishable Key gesetzt sind, verwenden Dev und Production automatisch Supabase.
 */
export const RECIPE_REPOSITORY = new InjectionToken<RecipeRepository>('RECIPE_REPOSITORY', {
  providedIn: 'root',
  factory: () => {
    if (hasSupabaseConfig()) return inject(SupabaseRecipeRepository);
    if (isDevMode()) return inject(InMemoryRecipeRepository);
    throw new Error('Supabase Project URL und Publishable Key fehlen.');
  },
});
