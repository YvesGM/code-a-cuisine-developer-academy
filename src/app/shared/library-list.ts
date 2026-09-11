import { Component, effect, inject, input, signal } from '@angular/core';
import { Cuisine, RecipePage } from '../core/models';
import { RECIPE_REPOSITORY } from '../core/recipe-repository';
import { RecipeCard } from './recipe-card';
@Component({
  selector: 'app-library-list',
  imports: [RecipeCard],
  template: `@if (loading()) {
      <p role="status">Bibliothek wird geladen…</p>
    }
    @if (error()) {
      <p role="alert">{{ error() }}</p>
      <button (click)="reload()">Erneut laden</button>
    }
    @if (result(); as result) {
      @for (recipe of result.items; track recipe.id) {
        <app-recipe-card [recipe]="recipe" />
      } @empty {
        <p>Noch keine gespeicherten Rezepte vorhanden.</p>
      }
      @if (result.pages > 1) {
        <nav aria-label="Bibliotheksseiten">
          <button (click)="changePage(result.page - 1)" [disabled]="result.page === 1">
            Previous
          </button>
          <span>Seite {{ result.page }} von {{ result.pages }} ({{ result.total }} Rezepte)</span>
          <button (click)="changePage(result.page + 1)" [disabled]="result.page === result.pages">
            Next
          </button>
        </nav>
      }
    }`,
})
export class LibraryList {
  readonly cuisine = input<Cuisine | undefined>();
  readonly result = signal<RecipePage | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');
  private readonly page = signal(1);
  private readonly revision = signal(0);
  private readonly repository = inject(RECIPE_REPOSITORY);
  /** Lädt eine Repository-Seite und ignoriert Antworten nach Filterwechsel oder Zerstörung. */
  constructor() {
    effect(() => {
      this.cuisine();
      this.page.set(1);
    });
    effect((onCleanup) => {
      const cuisine = this.cuisine();
      const page = this.page();
      this.revision();
      let active = true;
      onCleanup(() => {
        active = false;
      });
      this.loading.set(true);
      this.error.set('');
      this.result.set(null);
      void this.repository
        .list({ cuisine, page })
        .then((result) => {
          if (active) {
            this.result.set(result);
            this.loading.set(false);
          }
        })
        .catch(() => {
          if (active) {
            this.error.set('Bibliothek konnte nicht geladen werden.');
            this.loading.set(false);
          }
        });
    });
  }
  /** Fordert die gewünschte Seite an; das Repository begrenzt ungültige Seitennummern. */
  changePage(page: number): void {
    this.page.set(page);
  }
  /** Wiederholt dieselbe Abfrage nach einem sichtbaren Repository-Fehler. */
  reload(): void {
    this.revision.update((value) => value + 1);
  }
}
