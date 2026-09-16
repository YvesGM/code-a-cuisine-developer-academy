import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DIET_LABELS, DIFFICULTIES, LIMITS } from '../../config/app.constants';
import { Cuisine, RecipePage } from '../../models/app.models';
import { RecipeService } from '../../services/recipe.service';
/** Reusably loads and renders a paginated recipe list. */
@Component({
  selector: 'app-library-list',
  imports: [RouterLink],
  templateUrl: './library-list.html',
  styleUrl: './library-list.scss',
})
export class LibraryListComponent {
  readonly cuisine = input<Cuisine | undefined>();
  readonly result = signal<RecipePage | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly diets = DIET_LABELS;
  readonly difficulties = DIFFICULTIES;
  readonly pageSize = LIMITS.libraryPageSize;
  readonly visiblePages = computed(() => this.paginationWindow(this.result()));
  private readonly page = signal(1);
  private readonly revision = signal(0);
  private readonly recipes = inject(RecipeService);

  /**
   * Deterministically resets the page to the beginning whenever the cuisine changes.
   *
   * @returns {void} No value is returned.
   */
  private watchCuisine(): void {
    effect(() => {
      this.cuisine();
      this.page.set(1);
    });
  }

  /**
   * Returns a centered three-page window around the current library page.
   *
   * @param {(RecipePage|null)} result - The current recipe page, or null before loading.
   * @returns {ReadonlyArray<number>} The page numbers that should be displayed.
   */
  private paginationWindow(result: RecipePage | null): readonly number[] {
    if (!result) return [];
    const windowSize = Math.min(3, result.pages);
    const start = Math.max(1, Math.min(result.page - 1, result.pages - windowSize + 1));
    return Array.from({ length: windowSize }, (_, index) => start + index);
  }

  /**
   * Resets visible loading flags before requesting a service page.
   *
   * @returns {void} No value is returned.
   */
  private beginLoad(): void {
    this.loading.set(true);
    this.error.set('');
    this.result.set(null);
  }

  /**
   * Applies a loaded page only while its associated effect is still active.
   *
   * @param {RecipePage} result - The recipe page returned by the service.
   * @param {{active: boolean}} token - The activity token used to ignore stale asynchronous results.
   * @returns {void} No value is returned.
   */
  private acceptResult(result: RecipePage, token: { active: boolean }): void {
    if (!token.active) return;
    this.result.set(result);
    this.loading.set(false);
  }

  /**
   * Shows a service read error only for the still-active request.
   *
   * @param {{active: boolean}} token - The activity token used to ignore stale asynchronous results.
   * @returns {void} No value is returned.
   */
  private rejectResult(token: { active: boolean }): void {
    if (!token.active) return;
    this.error.set('Library could not be loaded.');
    this.loading.set(false);
  }

  /**
   * Starts exactly one library request for the current reactive filter and page state.
   *
   * @param {(cleanup: () => void) => void} registerCleanup - Angular effect cleanup registration callback.
   * @returns {void} No value is returned.
   */
  private requestPage(registerCleanup: (cleanup: () => void) => void): void {
    const query = { cuisine: this.cuisine(), page: this.page() };
    this.revision();
    const token = { active: true };
    registerCleanup(() => {
      token.active = false;
    });
    this.beginLoad();
    void this.recipes
      .list(query)
      .then((result) => this.acceptResult(result, token))
      .catch(() => this.rejectResult(token));
  }

  /**
   * Registers filter reset and service loading as separate reactive responsibilities.
   */
  constructor() {
    this.watchCuisine();
    effect((registerCleanup) => this.requestPage(registerCleanup));
  }

  /**
   * Requests the desired page; the service constrains invalid page numbers.
   *
   * @param {number} page - The desired library page number.
   * @returns {void} No value is returned.
   */
  changePage(page: number): void {
    this.page.set(page);
  }

  /**
   * Repeats the same request after a visible service error.
   *
   * @returns {void} No value is returned.
   */
  reload(): void {
    this.revision.update((value) => value + 1);
  }
}
