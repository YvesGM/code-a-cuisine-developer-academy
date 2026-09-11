import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { CUISINE_LABELS, OPTIONS } from '../core/config';
import { LibraryList } from '../shared/library-list';
@Component({
  selector: 'app-cuisine',
  imports: [RouterLink, LibraryList],
  template: `@if (cuisine(); as cuisine) {
      <h1>{{ labels[cuisine] }}</h1>
      <app-library-list [cuisine]="cuisine" />
    } @else {
      <h1>Cuisine nicht gefunden</h1>
      <p>Dieser Kochstil ist nicht konfiguriert.</p>
    }
    <a routerLink="/cookbook">Alle Rezepte</a>`,
})
export class CuisinePage {
  private readonly params = toSignal(inject(ActivatedRoute).paramMap);
  readonly labels = CUISINE_LABELS;
  readonly cuisine = computed(() =>
    OPTIONS.cuisines.find((cuisine) => cuisine === this.params()?.get('cuisine')),
  );
}
