import { computed, inject, Injectable, signal } from '@angular/core';
import { LIMITS, OPTIONS } from '../config/app.constants';
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

/** Hält den aktuellen Generierungsflow und koordiniert Änderungen am Frontend-State. */
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

  /** Speichert eine neue oder bearbeitete Zutat im aktuellen Generierungsflow. */
  saveIngredient(input: IngredientInput, id?: string): void {
    if (!this.validIngredient(input)) throw new Error('Ungültige Zutat.');
    const ingredient = { ...input, name: input.name.trim(), id: id ?? crypto.randomUUID() };
    if (id && !this.ingredients().some((item) => item.id === id)) throw new Error('Zutat fehlt.');
    const ingredients = id
      ? this.ingredients().map((item) => (item.id === id ? ingredient : item))
      : [ingredient, ...this.ingredients()];
    this.changeInput({ ingredients });
  }

  /** Entfernt eine Zutat aus dem aktuellen Flow. */
  deleteIngredient(id: string): void {
    this.changeInput({ ingredients: this.ingredients().filter((item) => item.id !== id) });
  }

  /** Speichert die gewählten Rezeptpräferenzen. */
  setPreferences(preferences: Preferences): void {
    if (!this.validPreferences(preferences)) throw new Error('Ungültige Preferences.');
    this.changeInput({ preferences: { ...preferences } });
  }

  /** Speichert die Portionszahl innerhalb der vorgegebenen Grenzen. */
  setServings(servings: number): void {
    if (!this.validCount(servings, LIMITS.servings)) throw new Error('Ungültige Portionszahl.');
    this.changeInput({ servings });
  }

  /** Speichert die Anzahl der kochenden Personen. */
  setCookCount(cookCount: number): void {
    if (!this.validCount(cookCount, LIMITS.cookCount)) throw new Error('Ungültige Helferzahl.');
    this.changeInput({ cookCount });
  }

  /** Startet genau eine Generierung mit den aktuellen Eingaben. */
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

  /** Setzt Ergebnisdaten zurück, sobald sich eine Eingabe ändert. */
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

  /** Baut den n8n-Request aus dem aktuellen gültigen Flow. */
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

  /** Meldet fehlende Zutaten oder Preferences und bricht den Requestaufbau ab. */
  private rejectMissingInput(): null {
    this.data.update((state) => ({
      ...state,
      status: 'error',
      error: 'Bitte zuerst Zutaten und Preferences erfassen.',
    }));
    return null;
  }

  /** Markiert den aktiven Request für Loading und Race-Protection. */
  private beginGeneration(requestId: string): void {
    this.data.update((state) => ({ ...state, status: 'generating', requestId, recipes: [], error: null }));
  }

  /** Übernimmt einen kontrollierten Servicefehler in den sichtbaren UI-State. */
  private rejectGeneration(error: unknown, requestId: string): void {
    if (this.requestId() !== requestId) return;
    const message = error instanceof RecipeApiError
      ? error.message
      : 'Generierung oder Speicherung fehlgeschlagen. Bitte erneut versuchen.';
    this.data.update((state) => ({ ...state, status: 'error', error: message }));
  }

  /** Prüft eine Zutat vor dem Speichern im Frontend-State. */
  private validIngredient(input: IngredientInput): boolean {
    return Boolean(input.name.trim()) && Number.isFinite(input.amount) && input.amount > 0 && OPTIONS.units.includes(input.unit);
  }

  /** Prüft die konfigurierten Preference-Werte. */
  private validPreferences(value: Preferences): boolean {
    return OPTIONS.difficulties.includes(value.difficulty) && OPTIONS.cuisines.includes(value.cuisine) && OPTIONS.diets.includes(value.diet);
  }

  /** Prüft ganzzahlige Zähler gegen ihre Grenzen. */
  private validCount(value: number, limits: { min: number; max: number }): boolean {
    return Number.isInteger(value) && value >= limits.min && value <= limits.max;
  }
}
