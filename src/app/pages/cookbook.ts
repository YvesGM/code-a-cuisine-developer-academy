import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CUISINE_LABELS, OPTIONS } from '../core/config';
import { LibraryList } from '../shared/library-list';
@Component({
  selector: 'app-cookbook',
  imports: [RouterLink, LibraryList],
  template: `<h1>Rezeptebibliothek</h1>
    <p>Öffentliche gespeicherte Rezepte ohne Account.</p>
    <nav aria-label="Kochstil filtern">
      <a routerLink="/cookbook">Alle</a>
      @for (cuisine of cuisines; track cuisine) {
        <a [routerLink]="['/cookbook', cuisine]">{{ labels[cuisine] }}</a>
      }
    </nav>
    <app-library-list />`,
})
export class CookbookPage {
  readonly cuisines = OPTIONS.cuisines;
  readonly labels = CUISINE_LABELS;
}
