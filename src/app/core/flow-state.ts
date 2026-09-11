import { computed, inject, Injectable, signal } from '@angular/core';
import {
  createRequest,
  topRecipes,
  validIngredient,
  validPreferences,
  validCount,
} from './business';
import { GenerationProviderError, GenerationService } from './generation';
import { LIMITS } from './config';
import { RECIPE_REPOSITORY } from './recipe-repository';
import { Ingredient, IngredientInput, Preferences, Recipe } from './models';
interface FlowData {
  servings: number;
  cookCount: number;
  ingredients: readonly Ingredient[];
  preferences: Preferences | null;
  status: 'idle' | 'generating' | 'success' | 'error';
  requestId: string | null;
  recipes: readonly Recipe[];
  error: string | null;
}
@Injectable({ providedIn: 'root' })
export class FlowState {
  private readonly generator = inject(GenerationService);
  private readonly repository = inject(RECIPE_REPOSITORY);
  private readonly data = signal<FlowData>({
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
  readonly topResults = computed(() => topRecipes(this.recipes()));
  /** Eingabeänderungen invalidieren nur den aktuellen Workflow, niemals gespeicherte Rezepte. */
  private changeInput(patch: Partial<FlowData>): void {
    this.data.update((s) => ({
      ...s,
      ...patch,
      status: 'idle',
      requestId: null,
      recipes: [],
      error: null,
    }));
  }
  /** Speichert einen geprüften Formularentwurf; beim Bearbeiten bleibt die ID stabil. */
  saveIngredient(input: IngredientInput, id?: string): void {
    if (!validIngredient(input))
      throw new Error('Name, positive Menge und Einheit sind erforderlich.');
    if (id && !this.ingredients().some((i) => i.id === id))
      throw new Error('Zutat nicht gefunden.');
    const ingredient: Ingredient = {
      ...input,
      name: input.name.trim(),
      id: id ?? crypto.randomUUID(),
    };
    this.changeInput({
      ingredients: id
        ? this.ingredients().map((i) => (i.id === id ? ingredient : i))
        : [...this.ingredients(), ingredient],
    });
  }
  /** Entfernt einen Vorrat und verwirft davon abhängige aktuelle Ergebnisse. */
  deleteIngredient(id: string): void {
    this.changeInput({ ingredients: this.ingredients().filter((i) => i.id !== id) });
  }
  /** Übernimmt ausschließlich konfigurierte Preference-Keys. */
  setPreferences(preferences: Preferences): void {
    if (!validPreferences(preferences)) throw new Error('Preferences sind ungültig.');
    this.changeInput({ preferences: { ...preferences } });
  }
  /** Prüft Portionsgrenzen vor der Invalidierung des aktuellen Requests. */
  setServings(servings: number): void {
    if (!validCount(servings, LIMITS.servings))
      throw new Error('Portionen müssen zwischen 1 und 12 liegen.');
    this.changeInput({ servings });
  }
  /** Prüft die Helferzahl; IDs in Directions beziehen sich auf 1..cookCount. */
  setCookCount(cookCount: number): void {
    if (!validCount(cookCount, LIMITS.cookCount))
      throw new Error('Kochhelfer müssen zwischen 1 und 3 liegen.');
    this.changeInput({ cookCount });
  }
  /** Generiert einmal, speichert den validierten Satz und verwirft verspätete Workflow-Antworten. */
  async generate(): Promise<void> {
    if (this.status() === 'generating') return;
    const preferences = this.preferences();
    if (!preferences || !this.ingredients().length) {
      this.data.update((s) => ({
        ...s,
        status: 'error',
        error: 'Bitte zuerst Zutaten und Preferences erfassen.',
      }));
      return;
    }
    const request = createRequest(
      this.ingredients(),
      preferences,
      this.servings(),
      this.cookCount(),
    );
    this.data.update((s) => ({
      ...s,
      status: 'generating',
      requestId: request.clientRequestId,
      recipes: [],
      error: null,
    }));
    try {
      const response = await this.generator.generate(request);
      if (!response.persisted) await this.repository.saveMany(response.recipes);
      if (this.requestId() === request.clientRequestId)
        this.data.update((s) => ({ ...s, status: 'success', recipes: response.recipes }));
    } catch (error) {
      if (this.requestId() === request.clientRequestId)
        this.data.update((s) => ({
          ...s,
          status: 'error',
          error:
            error instanceof GenerationProviderError
              ? error.message
              : 'Generierung oder Speicherung fehlgeschlagen, oder Antwort ungültig. Bitte erneut versuchen.',
        }));
    }
  }
}
