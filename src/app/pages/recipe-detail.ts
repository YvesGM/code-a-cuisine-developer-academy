import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { DecimalPipe } from '@angular/common';
import { CUISINE_LABELS, DIET_LABELS, DIFFICULTIES } from '../core/config';
import { cookAssignments } from '../core/business';
import { RECIPE_REPOSITORY } from '../core/recipe-repository';
import { Recipe } from '../core/models';
@Component({
  selector: 'app-recipe-detail',
  imports: [RouterLink, DecimalPipe],
  templateUrl: './recipe-detail.html',
  styleUrl: './recipe-detail.scss',
})
export class RecipeDetailPage {
  private readonly repository = inject(RECIPE_REPOSITORY);
  private readonly params = toSignal(inject(ActivatedRoute).paramMap);
  private readonly revision = signal(0);
  readonly recipe = signal<Recipe | undefined>(undefined);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly cuisines = CUISINE_LABELS;
  readonly diets = DIET_LABELS;
  readonly difficulties = DIFFICULTIES;
  readonly assignments = computed(() => {
    const recipe = this.recipe();
    return recipe ? cookAssignments(recipe.directions, recipe.cookCount) : [];
  });
  readonly nutrition = computed(() => {
    const recipe = this.recipe();
    return recipe
      ? [
          { label: 'Pro Portion', values: recipe.nutrition.perServing },
          { label: 'Gesamtrezept', values: recipe.nutrition.total },
        ]
      : [];
  });
  /** Setzt sichtbare Ladeflags zurück, bevor ein neuer Repository-Lookup beginnt. */
  private beginLoad(): void {
    this.recipe.set(undefined);
    this.loading.set(true);
    this.error.set('');
  }

  /** Übernimmt ein Repository-Ergebnis nur solange der zugehörige Effect noch aktiv ist. */
  private acceptRecipe(recipe: Recipe | undefined, token: { active: boolean }): void {
    if (!token.active) return;
    this.recipe.set(recipe);
    this.loading.set(false);
  }

  /** Zeigt einen Repository-Lesefehler nur für den weiterhin aktiven Lookup. */
  private rejectRecipe(token: { active: boolean }): void {
    if (!token.active) return;
    this.error.set('Rezept konnte nicht geladen werden.');
    this.loading.set(false);
  }

  /** Startet genau einen Repository-Lookup und bindet seine Antwort an ein Aktivitäts-Token. */
  private loadRecipe(id: string, token: { active: boolean }): void {
    this.beginLoad();
    void this.repository
      .getById(id)
      .then((recipe) => this.acceptRecipe(recipe, token))
      .catch(() => this.rejectRecipe(token));
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

  /** Wiederholt den Lookup nach einem Repository-Lesefehler. */
  reload(): void {
    this.revision.update((value) => value + 1);
  }
}
