import { DecimalPipe, Location } from '@angular/common';
import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DIET_LABELS, DIFFICULTIES } from '../../constants/recipe-flow.constants';
import { AppStateService } from '../../services/app-state.service';
import { Recipe } from '../../models/app.models';
import { RecipeService } from '../../services/recipe.service';

const CHEF_ICONS: Readonly<Record<number, string>> = {
  1: 'assets/icons/cooking-hat-icon.svg',
  2: 'assets/icons/cross-fork-spoon-icon.svg',
  3: 'assets/icons/chef-3-icon.svg',
  4: 'assets/icons/chef-4-icon.svg',
};

/** Displays recipe details and manages mobile sections and favoriting. */
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
  readonly favorited = signal(false);
  readonly favoriteCount = signal(this.recipe()?.favoriteCount ?? 0);
  readonly ingredientsExpanded = signal(true);
  readonly directionsExpanded = signal(true);
  readonly diets = DIET_LABELS;
  readonly difficulties = DIFFICULTIES;
  readonly chefs = computed(() =>
    Array.from({ length: this.recipe()?.cookCount ?? 0 }, (_, index) => index + 1),
  );

  /**
   * Returns only the existing Figma icon for the specified cook.
   *
   * @param {number} cook - The one-based cook number.
   * @returns {string} The asset path for the selected cook icon.
   */
  chefIcon(cook: number): string {
    return CHEF_ICONS[cook] ?? CHEF_ICONS[1];
  }

  /**
   * Returns an already generated recipe without another backend lookup.
   *
   * @param {string} id - The recipe identifier to find in the current results.
   * @returns {(Recipe|undefined)} The matching recipe, or undefined when no recipe matches.
   */
  private currentRecipe(id: string): Recipe | undefined {
    return this.state.recipes().find((recipe) => recipe.id === id);
  }

  /**
   * Applies recipe and engagement data without reducing a higher local like count.
   *
   * @param {Recipe} recipe - The recipe to display.
   * @returns {void} No value is returned.
   */
  private setRecipe(recipe: Recipe): void {
    const sameRecipe = this.recipe()?.id === recipe.id;
    const count = recipe.favoriteCount ?? 0;
    this.recipe.set(recipe);
    this.favoriteCount.set(sameRecipe ? Math.max(this.favoriteCount(), count) : count);
    this.loading.set(false);
    this.error.set('');
  }

  /**
   * Applies current results synchronously and therefore skips the detail loading state.
   *
   * @param {string} id - The recipe identifier to resolve from current results.
   * @returns {boolean} True when the recipe is available in the current generation results.
   */
  private useCurrentRecipe(id: string): boolean {
    const recipe = this.currentRecipe(id);
    if (!recipe) return false;
    this.setRecipe(recipe);
    return true;
  }

  /**
   * Resets visible loading flags before a direct service lookup begins.
   *
   * @returns {void} No value is returned.
   */
  private beginLoad(): void {
    this.recipe.set(undefined);
    this.loading.set(true);
    this.error.set('');
  }

  /**
   * Applies a service result only while its associated effect is still active.
   *
   * @param {(Recipe|undefined)} recipe - The recipe returned by the service, if found.
   * @param {{active: boolean}} token - The activity token used to ignore stale asynchronous results.
   * @returns {void} No value is returned.
   */
  private acceptRecipe(recipe: Recipe | undefined, token: { active: boolean }): void {
    if (!token.active) return;
    if (recipe) this.setRecipe(recipe);
    else this.loading.set(false);
  }

  /**
   * Shows a service read error only for the still-active direct lookup.
   *
   * @param {{active: boolean}} token - The activity token used to ignore stale asynchronous results.
   * @returns {void} No value is returned.
   */
  private rejectRecipe(token: { active: boolean }): void {
    if (!token.active) return;
    this.error.set('Recipe could not be loaded.');
    this.loading.set(false);
  }

  /**
   * Starts exactly one direct service lookup and binds its response to an activity token.
   *
   * @param {string} id - The recipe identifier to load from the service.
   * @param {{active: boolean}} token - The activity token used to ignore stale asynchronous results.
   * @returns {void} No value is returned.
   */
  private fetchRecipe(id: string, token: { active: boolean }): void {
    void this.recipesApi
      .getById(id)
      .then((recipe) => this.acceptRecipe(recipe, token))
      .catch(() => this.rejectRecipe(token));
  }

  /**
   * Uses current results immediately; only direct URLs require a visible service lookup.
   *
   * @param {string} id - The recipe identifier requested by the route.
   * @param {{active: boolean}} token - The activity token used to ignore stale asynchronous results.
   * @returns {void} No value is returned.
   */
  private loadRecipe(id: string, token: { active: boolean }): void {
    if (this.useCurrentRecipe(id)) return;
    this.beginLoad();
    this.fetchRecipe(id, token);
  }

  /**
   * Reacts to ID or retry changes and invalidates stale asynchronous responses.
   *
   * @param {(cleanup: () => void) => void} registerCleanup - Angular effect cleanup registration callback.
   * @returns {void} No value is returned.
   */
  private watchRecipe(registerCleanup: (cleanup: () => void) => void): void {
    const id = this.params()?.get('id') ?? '';
    this.revision();
    const token = { active: true };
    registerCleanup(() => {
      token.active = false;
    });
    untracked(() => this.loadRecipe(id, token));
  }

  /**
   * Registers the single reactive loader for public recipe IDs.
   */
  constructor() {
    effect((registerCleanup) => this.watchRecipe(registerCleanup));
  }

  /**
   * Returns to the results or cookbook page that was actually visited before.
   *
   * @param {MouseEvent} event - The browser event that triggered the action.
   * @returns {void} No value is returned.
   */
  goBack(event: MouseEvent): void {
    event.preventDefault();
    this.location.back();
  }

  /**
   * Toggles the ingredient list only for the mobile detail view.
   *
   * @returns {void} No value is returned.
   */
  toggleIngredients(): void {
    this.ingredientsExpanded.update((expanded) => !expanded);
  }

  /**
   * Toggles the directions only for the mobile detail view.
   *
   * @returns {void} No value is returned.
   */
  toggleDirections(): void {
    this.directionsExpanded.update((expanded) => !expanded);
  }

  /**
   * Reflects the favorite immediately in the frontend and blocks further clicks until the server responds.
   *
   * @returns {void} No value is returned.
   */
  private beginFavorite(): void {
    this.favoritePending.set(true);
    this.favorited.set(true);
    this.favoriteCount.update((count) => count + 1);
    this.favoriteError.set('');
  }

  /**
   * Rolls back the optimistic favorite if the server does not confirm the change.
   *
   * @returns {void} No value is returned.
   */
  private rejectFavorite(): void {
    this.favorited.set(false);
    this.favoriteCount.update((count) => Math.max(0, count - 1));
    this.favoriteError.set('Favorite could not be saved.');
  }

  /**
   * Optimistically favorites the visible recipe and prevents parallel or duplicate clicks.
   *
   * @returns {void} No value is returned.
   */
  favorite(): void {
    const recipe = this.recipe();
    if (!recipe || this.favorited() || this.favoritePending()) return;
    this.beginFavorite();
    void this.recipesApi
      .favorite(recipe.id)
      .catch(() => this.rejectFavorite())
      .finally(() => this.favoritePending.set(false));
  }

  /**
   * Retries the lookup after a service read error.
   *
   * @returns {void} No value is returned.
   */
  reload(): void {
    this.revision.update((value) => value + 1);
  }
}
