import { DecimalPipe, Location } from '@angular/common';
import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DIET_LABELS, DIFFICULTIES } from '../../config/app.constants';
import { AppStateService } from '../../services/app-state.service';
import { Recipe } from '../../models/app.models';
import { RecipeService } from '../../services/recipe.service';

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

/** Zeigt ein Rezeptdetail und verwaltet mobile Bereiche sowie Favorisieren. */
@Component({
  selector: 'app-recipe-detail',
  imports: [RouterLink, DecimalPipe],
  templateUrl: './recipe-detail.html',
  styleUrl: './recipe-detail.scss',
})
export class RecipeDetailComponent {
  private readonly recipesApi = inject(RecipeService);
  private readonly state = inject(AppStateService);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
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
  readonly ingredientsExpanded = signal(true);
  readonly directionsExpanded = signal(true);
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

  /** Übernimmt den persistierten Favorite-Status, ohne ein laufendes optimistisches Update zurückzusetzen. */
  private syncFavoriteState(recipe: Recipe, sameRecipe: boolean): void {
    const persisted = storedFavoriteIds().includes(recipe.id);
    const pending = sameRecipe && this.favoritePending();
    this.favorited.set(pending ? this.favorited() : persisted);
  }

  /** Übernimmt Recipe und Engagement, ohne einen bereits höheren lokalen Like-Stand zurückzusetzen. */
  private setRecipe(recipe: Recipe): void {
    const sameRecipe = this.recipe()?.id === recipe.id;
    const count = recipe.favoriteCount ?? 0;
    this.recipe.set(recipe);
    this.favoriteCount.set(sameRecipe ? Math.max(this.favoriteCount(), count) : count);
    this.syncFavoriteState(recipe, sameRecipe);
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

  /** Setzt sichtbare Ladeflags zurück, bevor ein direkter Service-Lookup beginnt. */
  private beginLoad(): void {
    this.recipe.set(undefined);
    this.loading.set(true);
    this.error.set('');
  }

  /** Übernimmt ein Service-Ergebnis nur solange der zugehörige Effect noch aktiv ist. */
  private acceptRecipe(recipe: Recipe | undefined, token: { active: boolean }): void {
    if (!token.active) return;
    if (recipe) this.setRecipe(recipe);
    else this.loading.set(false);
  }

  /** Zeigt einen Service-Lesefehler nur für den weiterhin aktiven direkten Lookup. */
  private rejectRecipe(token: { active: boolean }): void {
    if (!token.active) return;
    this.error.set('Recipe could not be loaded.');
    this.loading.set(false);
  }

  /** Aktualisiert persistiertes Engagement im Hintergrund, ohne den sofort sichtbaren Result-State zu blockieren. */
  private hydrateCurrentRecipe(id: string, token: { active: boolean }): void {
    void this.recipesApi
      .getById(id)
      .then((recipe) => this.acceptRecipe(recipe, token))
      .catch(() => undefined);
  }

  /** Startet genau einen direkten Service-Lookup und bindet seine Antwort an ein Aktivitäts-Token. */
  private fetchRecipe(id: string, token: { active: boolean }): void {
    void this.recipesApi
      .getById(id)
      .then((recipe) => this.acceptRecipe(recipe, token))
      .catch(() => this.rejectRecipe(token));
  }

  /** Verwendet Results sofort; nur direkte URLs benötigen einen sichtbaren Service-Lookup. */
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
    untracked(() => this.loadRecipe(id, token));
  }

  /** Registriert den einzigen reaktiven Loader für öffentliche Recipe-IDs. */
  constructor() {
    effect((registerCleanup) => this.watchRecipe(registerCleanup));
  }

  /** Kehrt zur tatsächlich zuvor besuchten Results- oder Cookbook-Seite zurück. */
  goBack(event: MouseEvent): void {
    event.preventDefault();
    this.location.back();
  }

  /** Schaltet die Zutatenliste ausschließlich für die mobile Detailansicht ein oder aus. */
  toggleIngredients(): void {
    this.ingredientsExpanded.update((expanded) => !expanded);
  }

  /** Schaltet die Zubereitungsschritte ausschließlich für die mobile Detailansicht ein oder aus. */
  toggleDirections(): void {
    this.directionsExpanded.update((expanded) => !expanded);
  }

  /** Spiegelt den Favorite sofort im Frontend und sperrt weitere Klicks bis zur Serverantwort. */
  private beginFavorite(): void {
    this.favoritePending.set(true);
    this.favorited.set(true);
    this.favoriteCount.update((count) => count + 1);
    this.favoriteError.set('');
  }

  /** Persistiert nach erfolgreicher Serverantwort nur noch die lokale Browser-Markierung. */
  private acceptFavorite(id: string): void {
    storeFavoriteId(id);
    this.favoriteError.set('');
  }

  /** Rollt das optimistische Favorite zurück, falls der Server die Änderung nicht bestätigt. */
  private rejectFavorite(): void {
    this.favorited.set(false);
    this.favoriteCount.update((count) => Math.max(0, count - 1));
    this.favoriteError.set('Favorite could not be saved.');
  }

  /** Favorisiert das sichtbare Rezept optimistisch und verhindert parallele oder doppelte Klicks. */
  favorite(): void {
    const recipe = this.recipe();
    if (!recipe || this.favorited() || this.favoritePending()) return;
    this.beginFavorite();
    void this.recipesApi
      .favorite(recipe.id)
      .then(() => this.acceptFavorite(recipe.id))
      .catch(() => this.rejectFavorite())
      .finally(() => this.favoritePending.set(false));
  }

  /** Wiederholt den Lookup nach einem Service-Lesefehler. */
  reload(): void {
    this.revision.update((value) => value + 1);
  }
}
