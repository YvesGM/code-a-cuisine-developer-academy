import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DIET_LABELS, DIFFICULTIES, LIMITS } from '../../config/app.constants';
import { Cuisine, RecipePage } from '../../models/app.models';
import { RecipeService } from '../../services/recipe.service';
/** Lädt und rendert wiederverwendbar eine paginierte Rezeptliste. */
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

  /** Setzt die Seite bei jedem Cuisine-Wechsel deterministisch auf den Anfang zurück. */
  private watchCuisine(): void {
    effect(() => {
      this.cuisine();
      this.page.set(1);
    });
  }

  /** Liefert ein zentriertes Dreierfenster um die aktuelle Bibliotheksseite. */
  private paginationWindow(result: RecipePage | null): readonly number[] {
    if (!result) return [];
    const windowSize = Math.min(3, result.pages);
    const start = Math.max(1, Math.min(result.page - 1, result.pages - windowSize + 1));
    return Array.from({ length: windowSize }, (_, index) => start + index);
  }

  /** Setzt sichtbare Ladeflags zurück, bevor eine Service-Seite angefordert wird. */
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

  /** Zeigt einen Service-Lesefehler nur für den weiterhin aktiven Request. */
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
    void this.recipes
      .list(query)
      .then((result) => this.acceptResult(result, token))
      .catch(() => this.rejectResult(token));
  }

  /** Registriert Filter-Reset und Service-Lader als getrennte reaktive Verantwortlichkeiten. */
  constructor() {
    this.watchCuisine();
    effect((registerCleanup) => this.requestPage(registerCleanup));
  }

  /** Fordert die gewünschte Seite an; das Service begrenzt ungültige Seitennummern. */
  changePage(page: number): void {
    this.page.set(page);
  }

  /** Wiederholt dieselbe Abfrage nach einem sichtbaren Service-Fehler. */
  reload(): void {
    this.revision.update((value) => value + 1);
  }
}
