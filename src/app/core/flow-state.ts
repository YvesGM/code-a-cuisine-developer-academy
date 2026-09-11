import { computed, inject, Injectable, signal } from '@angular/core';
import {
  createRequest,
  topRecipes,
  validCount,
  validIngredient,
  validPreferences,
} from './business';
import { LIMITS } from './config';
import { GenerationProviderError, GenerationService } from './generation';
import { GenerationRequest, Ingredient, IngredientInput, Preferences, Recipe } from './models';
import { RECIPE_REPOSITORY } from './recipe-repository';

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
    this.data.update((state) => ({
      ...state,
      ...patch,
      status: 'idle',
      requestId: null,
      recipes: [],
      error: null,
    }));
  }

  /** Baut aus einem gültigen Formularentwurf eine normalisierte Ingredient-Entität. */
  private ingredientFrom(input: IngredientInput, id?: string): Ingredient {
    if (!validIngredient(input))
      throw new Error('Name, positive Menge und Einheit sind erforderlich.');
    if (id && !this.ingredients().some((ingredient) => ingredient.id === id)) {
      throw new Error('Zutat nicht gefunden.');
    }
    return { ...input, name: input.name.trim(), id: id ?? crypto.randomUUID() };
  }

  /** Ersetzt eine bestehende Zutat oder hängt eine neue an die aktuelle Vorratsliste. */
  private ingredientList(ingredient: Ingredient, editingId?: string): readonly Ingredient[] {
    if (!editingId) return [...this.ingredients(), ingredient];
    return this.ingredients().map((current) => (current.id === editingId ? ingredient : current));
  }

  /** Speichert einen geprüften Formularentwurf; beim Bearbeiten bleibt die ID stabil. */
  saveIngredient(input: IngredientInput, id?: string): void {
    const ingredient = this.ingredientFrom(input, id);
    this.changeInput({ ingredients: this.ingredientList(ingredient, id) });
  }

  /** Entfernt einen Vorrat und verwirft davon abhängige aktuelle Ergebnisse. */
  deleteIngredient(id: string): void {
    this.changeInput({
      ingredients: this.ingredients().filter((ingredient) => ingredient.id !== id),
    });
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

  /** Liefert den aktuellen Request oder markiert fehlende Workflow-Eingaben als sichtbaren Fehler. */
  private currentRequest(): GenerationRequest | null {
    const preferences = this.preferences();
    if (preferences && this.ingredients().length) {
      return createRequest(this.ingredients(), preferences, this.servings(), this.cookCount());
    }
    this.data.update((state) => ({
      ...state,
      status: 'error',
      error: 'Bitte zuerst Zutaten und Preferences erfassen.',
    }));
    return null;
  }

  /** Markiert den Beginn einer Generierung und bindet spätere Antworten an diese Request-ID. */
  private beginGeneration(requestId: string): void {
    this.data.update((state) => ({
      ...state,
      status: 'generating',
      requestId,
      recipes: [],
      error: null,
    }));
  }

  /** Übernimmt ausschließlich die Antwort des weiterhin aktuellen Requests. */
  private async acceptGeneration(request: GenerationRequest): Promise<void> {
    const response = await this.generator.generate(request);
    if (!response.persisted) await this.repository.saveMany(response.recipes);
    if (this.requestId() !== request.clientRequestId) return;
    this.data.update((state) => ({ ...state, status: 'success', recipes: response.recipes }));
  }

  /** Übersetzt Provider-Fehler in kontrollierte UI-Texte und ignoriert veraltete Requests. */
  private rejectGeneration(error: unknown, requestId: string): void {
    if (this.requestId() !== requestId) return;
    const message =
      error instanceof GenerationProviderError
        ? error.message
        : 'Generierung oder Speicherung fehlgeschlagen, oder Antwort ungültig. Bitte erneut versuchen.';
    this.data.update((state) => ({ ...state, status: 'error', error: message }));
  }

  /** Führt genau einen GenerationRequest aus und kapselt Erfolg sowie Fehlerbehandlung. */
  private async runGeneration(request: GenerationRequest): Promise<void> {
    try {
      await this.acceptGeneration(request);
    } catch (error) {
      this.rejectGeneration(error, request.clientRequestId);
    }
  }

  /** Generiert einmal pro aktivem Flow; parallele Klicks werden ohne zweiten Request verworfen. */
  async generate(): Promise<void> {
    if (this.status() === 'generating') return;
    const request = this.currentRequest();
    if (!request) return;
    this.beginGeneration(request.clientRequestId);
    await this.runGeneration(request);
  }
}
