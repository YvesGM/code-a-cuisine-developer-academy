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
  /** Setzt die Seite bei jedem Cuisine-Wechsel deterministisch auf den Anfang zurück. */
  private watchCuisine(): void {
    effect(() => {
      this.cuisine();
      this.page.set(1);
    });
  }

  /** Setzt sichtbare Ladeflags zurück, bevor eine Repository-Seite angefordert wird. */
  private beginLoad(): void {
    this.loading.set(true);
    this.error.set('');
    this.result.set(null);
  }

  /** Übernimmt eine geladene Seite nur solange der zugehörige Effect noch aktiv ist. */
  private acceptResult(result: RecipePage, token: { active: boolean }): void {
    if (!token.active) return;
    this.result.set(result);
    this.loading.set(false);
  }

  /** Zeigt einen Repository-Lesefehler nur für den weiterhin aktiven Request. */
  private rejectResult(token: { active: boolean }): void {
    if (!token.active) return;
    this.error.set('Bibliothek konnte nicht geladen werden.');
    this.loading.set(false);
  }

  /** Startet genau eine Library-Abfrage für den aktuell reaktiven Filter- und Seitenstand. */
  private requestPage(registerCleanup: (cleanup: () => void) => void): void {
    const query = { cuisine: this.cuisine(), page: this.page() };
    this.revision();
    const token = { active: true };
    registerCleanup(() => {
      token.active = false;
    });
    this.beginLoad();
    void this.repository
      .list(query)
      .then((result) => this.acceptResult(result, token))
      .catch(() => this.rejectResult(token));
  }

  /** Registriert Filter-Reset und Repository-Lader als getrennte reaktive Verantwortlichkeiten. */
  constructor() {
    this.watchCuisine();
    effect((registerCleanup) => this.requestPage(registerCleanup));
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
