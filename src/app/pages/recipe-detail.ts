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
  template: ` @if (loading()) {
      <p role="status">Rezept wird geladen…</p>
    } @else if (error()) {
      <p role="alert">{{ error() }}</p>
      <button (click)="reload()">Erneut laden</button>
    } @else if (recipe(); as recipe) {
      <article>
        <h1>{{ recipe.title }}</h1>
        <p>
          {{ cuisines[recipe.cuisine] }} · {{ difficulties[recipe.difficulty].label }} ·
          {{ diets[recipe.diet] }} · {{ recipe.cookingTimeMinutes }} min
        </p>
        <p>{{ recipe.servings }} Portionen · {{ recipe.cookCount }} Kochhelfer</p>
        <section>
          <h2>Nutrition (Demo-Werte)</h2>
          <p>Prozentangaben: Anteil an der Demo-Makroenergie, keine Ernährungsanalyse.</p>
          @for (item of nutrition(); track item.label) {
            <h3>{{ item.label }}</h3>
            <dl>
              <dt>Kalorien</dt>
              <dd>{{ item.values.energyKcal | number: '1.0-2' }} kcal</dd>
              <dt>Protein</dt>
              <dd>
                {{ item.values.protein.grams | number: '1.0-2' }} g ({{
                  item.values.protein.percent | number: '1.0-2'
                }}
                %)
              </dd>
              <dt>Kohlenhydrate</dt>
              <dd>
                {{ item.values.carbs.grams | number: '1.0-2' }} g ({{
                  item.values.carbs.percent | number: '1.0-2'
                }}
                %)
              </dd>
              <dt>Fett</dt>
              <dd>
                {{ item.values.fat.grams | number: '1.0-2' }} g ({{
                  item.values.fat.percent | number: '1.0-2'
                }}
                %)
              </dd>
            </dl>
          }
        </section>
        <section>
          <h2>Vorhandene Zutaten – Gesamtmengen</h2>
          <ul>
            @for (ingredient of recipe.ingredients; track ingredient.sourceIngredientId) {
              <li>
                {{ ingredient.name }}: {{ ingredient.amount | number: '1.0-3' }}
                {{ ingredient.unit }}
              </li>
            }
          </ul>
        </section>
        <section>
          <h2>Zusätzlich benötigt – Gesamtmengen</h2>
          <ul>
            @for (ingredient of recipe.additionalIngredients; track $index) {
              <li>
                {{ ingredient.name }}: {{ ingredient.amount | number: '1.0-3' }}
                {{ ingredient.unit }}
              </li>
            } @empty {
              <li>Keine zusätzlichen Zutaten.</li>
            }
          </ul>
        </section>
        <section>
          <h2>Directions</h2>
          <ol>
            @for (direction of recipe.directions; track direction.step) {
              <li>
                <h3>{{ direction.title }}</h3>
                <p>{{ direction.instruction }}</p>
                <p>Kochhelfer: {{ direction.assignedCooks.join(', ') }}</p>
                @if (direction.parallelGroup) {
                  <p>Parallel ausführbar: {{ direction.parallelGroup }}</p>
                }
                @if (direction.waitingTimeMinutes !== undefined) {
                  <p>Wartezeit: {{ direction.waitingTimeMinutes }} min</p>
                }
              </li>
            }
          </ol>
        </section>
        <section>
          <h2>Arbeitsaufteilung</h2>
          @for (assignment of assignments(); track assignment.cook) {
            <h3>Person {{ assignment.cook }}</h3>
            <ul>
              @for (step of assignment.steps; track step.step) {
                <li>Step {{ step.step }} – {{ step.title }}</li>
              } @empty {
                <li>Keine Aufgabe zugeordnet.</li>
              }
            </ul>
          }
        </section>
      </article>
    } @else {
      <h1>Rezept nicht gefunden</h1>
      <p>Diese Recipe ID ist nicht in der Bibliothek gespeichert.</p>
    }
    <a routerLink="/results">Results</a> <a routerLink="/cookbook">Rezeptebibliothek</a>`,
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
  /** Lädt ausschließlich aus dem öffentlichen Repository; schützt vor veralteten ID-Antworten. */
  constructor() {
    effect((onCleanup) => {
      const id = this.params()?.get('id');
      this.revision();
      let active = true;
      onCleanup(() => {
        active = false;
      });
      this.recipe.set(undefined);
      this.loading.set(true);
      this.error.set('');
      void this.repository
        .getById(id ?? '')
        .then((recipe) => {
          if (active) {
            this.recipe.set(recipe);
            this.loading.set(false);
          }
        })
        .catch(() => {
          if (active) {
            this.error.set('Rezept konnte nicht geladen werden.');
            this.loading.set(false);
          }
        });
    });
  }
  /** Wiederholt den Lookup nach einem Repository-Lesefehler. */
  reload(): void {
    this.revision.update((value) => value + 1);
  }
}
