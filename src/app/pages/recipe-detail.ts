import { DecimalPipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DIET_LABELS, DIFFICULTIES } from '../core/config';
import { FlowState } from '../core/flow-state';
import { Recipe } from '../core/models';
import { RECIPE_REPOSITORY } from '../core/recipe-repository';

const FAVORITES_STORAGE_KEY = 'code-a-cuisine:favorites';
const CHEF_ICONS: Readonly<Record<number, string>> = {
  1: 'assets/icons/cooking-hat-icon.svg',
  2: 'assets/icons/cross-fork-spoon-icon.svg',
  3: 'assets/icons/chef-3-icon.svg',
  4: 'assets/icons/chef-4-icon.svg',
};

/** Liest ausschließlich lokal markierte Recipe-IDs und verwirft beschädigte Browserdaten. */
function storedFavoriteIds(): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) ?? '[]') as unknown;
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

/** Merkt eine erfolgreiche Favorisierung pro Browser, damit dieselbe Person nicht doppelt zählt. */
function storeFavoriteId(id: string): void {
  try {
    const ids = new Set(storedFavoriteIds());
    ids.add(id);
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // Favorisieren bleibt serverseitig erfolgreich, auch wenn Browser-Speicher blockiert ist.
  }
}

@Component({
  selector: 'app-recipe-detail',
  imports: [RouterLink, DecimalPipe],
  templateUrl: './recipe-detail.html',
  styleUrl: './recipe-detail.scss',
})
export class RecipeDetailPage {
  private readonly repository = inject(RECIPE_REPOSITORY);
  private readonly state = inject(FlowState);
  private readonly route = inject(ActivatedRoute);
  private readonly params = toSignal(this.route.paramMap);
  private readonly revision = signal(0);
  private readonly initialId = this.route.snapshot.paramMap.get('id') ?? '';
  readonly recipe = signal<Recipe | undefined>(this.currentRecipe(this.initialId));
  readonly loading = signal(!this.recipe());
  readonly error = signal('');
  readonly favoriteError = signal('');
  readonly favoritePending = signal(false);
  readonly favorited = signal(storedFavoriteIds().includes(this.initialId));
  readonly favoriteCount = signal(this.recipe()?.favoriteCount ?? 0);
  readonly diets = DIET_LABELS;
  readonly difficulties = DIFFICULTIES;
  readonly chefs = computed(() =>
    Array.from({ length: this.recipe()?.cookCount ?? 0 }, (_, index) => index + 1),
  );

  /** Liefert ausschließlich das bestehende Figma-Icon für den angegebenen Chef. */
  chefIcon(cook: number): string {
    return CHEF_ICONS[cook] ?? CHEF_ICONS[1];
  }

  /** Liefert ein bereits generiertes Rezept ohne erneuten Backend-Lookup. */
  private currentRecipe(id: string): Recipe | undefined {
    return this.state.recipes().find((recipe) => recipe.id === id);
  }

  /** Übernimmt Recipe und Engagement, ohne einen bereits höheren lokalen Like-Stand zurückzusetzen. */
  private setRecipe(recipe: Recipe): void {
    const sameRecipe = this.recipe()?.id === recipe.id;
    const count = recipe.favoriteCount ?? 0;
    this.recipe.set(recipe);
    this.favoriteCount.set(sameRecipe ? Math.max(this.favoriteCount(), count) : count);
    this.favorited.set(storedFavoriteIds().includes(recipe.id));
    this.loading.set(false);
    this.error.set('');
  }

  /** Übernimmt aktuelle Results synchron und überspringt dadurch den Detail-Ladezustand. */
  private useCurrentRecipe(id: string): boolean {
    const recipe = this.currentRecipe(id);
    if (!recipe) return false;
    this.setRecipe(recipe);
    return true;
  }

  /** Setzt sichtbare Ladeflags zurück, bevor ein direkter Repository-Lookup beginnt. */
  private beginLoad(): void {
    this.recipe.set(undefined);
    this.loading.set(true);
    this.error.set('');
  }

  /** Übernimmt ein Repository-Ergebnis nur solange der zugehörige Effect noch aktiv ist. */
  private acceptRecipe(recipe: Recipe | undefined, token: { active: boolean }): void {
    if (!token.active) return;
    if (recipe) this.setRecipe(recipe);
    else this.loading.set(false);
  }

  /** Zeigt einen Repository-Lesefehler nur für den weiterhin aktiven direkten Lookup. */
  private rejectRecipe(token: { active: boolean }): void {
    if (!token.active) return;
    this.error.set('Recipe could not be loaded.');
    this.loading.set(false);
  }

  /** Aktualisiert persistiertes Engagement im Hintergrund, ohne den sofort sichtbaren Result-State zu blockieren. */
  private hydrateCurrentRecipe(id: string, token: { active: boolean }): void {
    void this.repository
      .getById(id)
      .then((recipe) => this.acceptRecipe(recipe, token))
      .catch(() => undefined);
  }

  /** Startet genau einen direkten Repository-Lookup und bindet seine Antwort an ein Aktivitäts-Token. */
  private fetchRecipe(id: string, token: { active: boolean }): void {
    void this.repository
      .getById(id)
      .then((recipe) => this.acceptRecipe(recipe, token))
      .catch(() => this.rejectRecipe(token));
  }

  /** Verwendet Results sofort; nur direkte URLs benötigen einen sichtbaren Repository-Lookup. */
  private loadRecipe(id: string, token: { active: boolean }): void {
    if (this.useCurrentRecipe(id)) return this.hydrateCurrentRecipe(id, token);
    this.beginLoad();
    this.fetchRecipe(id, token);
  }

  /** Reagiert auf ID- oder Retry-Änderungen und macht veraltete Async-Antworten wirkungslos. */
  private watchRecipe(registerCleanup: (cleanup: () => void) => void): void {
    const id = this.params()?.get('id') ?? '';
    this.revision();
    const token = { active: true };
    registerCleanup(() => {
      token.active = false;
    });
    this.loadRecipe(id, token);
  }

  /** Registriert den einzigen reaktiven Loader für öffentliche Recipe-IDs. */
  constructor() {
    effect((registerCleanup) => this.watchRecipe(registerCleanup));
  }

  /** Übernimmt eine erfolgreiche serverseitige Favorisierung genau einmal pro Browser. */
  private acceptFavorite(id: string): void {
    storeFavoriteId(id);
    this.favorited.set(true);
    this.favoriteCount.update((count) => count + 1);
    this.favoriteError.set('');
  }

  /** Favorisiert das sichtbare Rezept serverseitig und verhindert parallele oder doppelte Klicks. */
  favorite(): void {
    const recipe = this.recipe();
    if (!recipe || this.favorited() || this.favoritePending()) return;
    this.favoritePending.set(true);
    this.favoriteError.set('');
    void this.repository
      .favorite(recipe.id)
      .then(() => this.acceptFavorite(recipe.id))
      .catch(() => this.favoriteError.set('Favorite could not be saved.'))
      .finally(() => this.favoritePending.set(false));
  }

  /** Wiederholt den Lookup nach einem Repository-Lesefehler. */
  reload(): void {
    this.revision.update((value) => value + 1);
  }
}
