import { computed, inject, Injectable, signal } from '@angular/core';
import { LIMITS, OPTIONS } from '../constants/recipe-flow.constants';
import { GenerationRequest, Ingredient, IngredientInput, Preferences, Recipe } from '../models/app.models';
import { RecipeApiError, RecipeService } from './recipe.service';

interface AppStateData {
  servings: number;
  cookCount: number;
  ingredients: readonly Ingredient[];
  preferences: Preferences | null;
  status: 'idle' | 'generating' | 'success' | 'error';
  requestId: string | null;
  recipes: readonly Recipe[];
  error: string | null;
}

/** Holds the current generation flow and coordinates frontend state changes. */
@Injectable({ providedIn: 'root' })
export class AppStateService {
  private readonly recipesApi = inject(RecipeService);
  private readonly data = signal<AppStateData>({
    servings: LIMITS.servings.default,
    cookCount: LIMITS.cookCount.default,
    ingredients: [],
    preferences: null,
    status: 'idle',
    requestId: null,
    recipes: [],
    error: null,
  });

  readonly ingredients = computed(() => this.data().ingredients);
  readonly servings = computed(() => this.data().servings);
  readonly cookCount = computed(() => this.data().cookCount);
  readonly preferences = computed(() => this.data().preferences);
  readonly status = computed(() => this.data().status);
  readonly requestId = computed(() => this.data().requestId);
  readonly recipes = computed(() => this.data().recipes);
  readonly error = computed(() => this.data().error);
  readonly topResults = computed(() => [...this.recipes()].sort((a, b) => a.rank - b.rank));

  /**
   * Stores a new or edited ingredient in the current generation flow.
   *
   * @param {IngredientInput} input - The ingredient values to validate and store.
   * @param {string} [id] - The existing ingredient identifier when editing.
   * @returns {void} No value is returned.
   * @throws {Error} When the ingredient is invalid or an edited ingredient does not exist.
   */
  saveIngredient(input: IngredientInput, id?: string): void {
    if (!this.validIngredient(input)) throw new Error('Invalid ingredient.');
    const ingredient = { ...input, name: input.name.trim(), id: id ?? crypto.randomUUID() };
    if (id && !this.ingredients().some((item) => item.id === id)) throw new Error('Ingredient not found.');
    const ingredients = id
      ? this.ingredients().map((item) => (item.id === id ? ingredient : item))
      : [ingredient, ...this.ingredients()];
    this.changeInput({ ingredients });
  }

  /**
   * Removes an ingredient from the current flow.
   *
   * @param {string} id - The ingredient identifier to remove.
   * @returns {void} No value is returned.
   */
  deleteIngredient(id: string): void {
    this.changeInput({ ingredients: this.ingredients().filter((item) => item.id !== id) });
  }

  /**
   * Stores the selected recipe preferences.
   *
   * @param {Preferences} preferences - The complete selected recipe preferences.
   * @returns {void} No value is returned.
   * @throws {Error} When the supplied preferences are invalid.
   */
  setPreferences(preferences: Preferences): void {
    if (!this.validPreferences(preferences)) throw new Error('Invalid preferences.');
    this.changeInput({ preferences: { ...preferences } });
  }

  /**
   * Stores the serving count within the configured limits.
   *
   * @param {number} servings - The selected number of servings.
   * @returns {void} No value is returned.
   * @throws {Error} When the serving count is outside the configured limits.
   */
  setServings(servings: number): void {
    if (!this.validCount(servings, LIMITS.servings)) throw new Error('Invalid serving count.');
    this.changeInput({ servings });
  }

  /**
   * Stores the number of cooks.
   *
   * @param {number} cookCount - The selected number of cooks.
   * @returns {void} No value is returned.
   * @throws {Error} When the cook count is outside the configured limits.
   */
  setCookCount(cookCount: number): void {
    if (!this.validCount(cookCount, LIMITS.cookCount)) throw new Error('Invalid cook count.');
    this.changeInput({ cookCount });
  }

  /**
   * Starts exactly one generation with the current input.
   *
   * @returns {Promise<void>} A promise that resolves after the generation flow reaches a success or error state.
   */
  async generate(): Promise<void> {
    if (this.status() === 'generating') return;
    const request = this.createRequest();
    if (!request) return;
    this.beginGeneration(request.clientRequestId);
    try {
      const response = await this.recipesApi.generate(request);
      if (this.requestId() !== request.clientRequestId) return;
      this.data.update((state) => ({ ...state, status: 'success', recipes: response.recipes }));
    } catch (error) {
      this.rejectGeneration(error, request.clientRequestId);
    }
  }

  /**
   * Resets result data as soon as an input changes.
   *
   * @param {Partial<AppStateData>} patch - The state fields changed by the user.
   * @returns {void} No value is returned.
   */
  private changeInput(patch: Partial<AppStateData>): void {
    this.data.update((state) => ({
      ...state,
      ...patch,
      status: 'idle',
      requestId: null,
      recipes: [],
      error: null,
    }));
  }

  /**
   * Builds the n8n request from the current valid flow.
   *
   * @returns {(GenerationRequest|null)} The request payload, or null when required input is missing.
   */
  private createRequest(): GenerationRequest | null {
    const preferences = this.preferences();
    if (!preferences || !this.ingredients().length) return this.rejectMissingInput();
    return {
      schemaVersion: 2,
      clientRequestId: crypto.randomUUID(),
      ingredients: this.ingredients().map((item) => ({ ...item })),
      preferences: { ...preferences },
      servings: this.servings(),
      cookCount: this.cookCount(),
    };
  }

  /**
   * Reports missing ingredients or preferences and aborts request construction.
   *
   * @returns {null} Always null after recording the missing-input state.
   */
  private rejectMissingInput(): null {
    this.data.update((state) => ({
      ...state,
      status: 'error',
      error: 'Please add ingredients and preferences first.',
    }));
    return null;
  }

  /**
   * Marks one generation request as active so older responses cannot replace newer state.
   *
   * @param {string} requestId - The client request identifier for the active generation.
   * @returns {void} No value is returned.
   */
  private beginGeneration(requestId: string): void {
    this.data.update((state) => ({ ...state, status: 'generating', requestId, recipes: [], error: null }));
  }

  /**
   * Applies a controlled service error to the visible UI state.
   *
   * @param {unknown} error - The service error returned by recipe generation.
   * @param {string} requestId - The client request identifier for the active generation.
   * @returns {void} No value is returned.
   */
  private rejectGeneration(error: unknown, requestId: string): void {
    if (this.requestId() !== requestId) return;
    const message = error instanceof RecipeApiError
      ? error.message
      : 'Generation or storage failed. Please try again.';
    this.data.update((state) => ({ ...state, status: 'error', error: message }));
  }

  /**
   * Validates an ingredient before storing it in frontend state.
   *
   * @param {IngredientInput} input - The ingredient input to validate.
   * @returns {boolean} True when the ingredient satisfies the domain validation rules.
   */
  private validIngredient(input: IngredientInput): boolean {
    return Boolean(input.name.trim()) && Number.isFinite(input.amount) && input.amount > 0 && OPTIONS.units.includes(input.unit);
  }

  /**
   * Validates the configured preference values.
   *
   * @param {Preferences} value - The selected preference set to validate.
   * @returns {boolean} True when all selected preferences are supported.
   */
  private validPreferences(value: Preferences): boolean {
    return OPTIONS.difficulties.includes(value.difficulty) && OPTIONS.cuisines.includes(value.cuisine) && OPTIONS.diets.includes(value.diet);
  }

  /**
   * Validates integer counters against their limits.
   *
   * @param {number} value - The numeric counter value to validate.
   * @param {{min: number, max: number}} limits - The allowed minimum and maximum values.
   * @returns {boolean} True when the value is an integer inside the supplied limits.
   */
  private validCount(value: number, limits: { min: number; max: number }): boolean {
    return Number.isInteger(value) && value >= limits.min && value <= limits.max;
  }
}
