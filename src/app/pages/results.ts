import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FlowState } from '../core/flow-state';
import { RecipeCard } from '../shared/recipe-card';
@Component({
  selector: 'app-results',
  imports: [RecipeCard, RouterLink],
  template: `<h1>Beste Rezeptvorschläge</h1>
    @for (recipe of state.topResults(); track recipe.id) {
      <app-recipe-card [recipe]="recipe" />
    }
    <a routerLink="/cookbook">Cookbook</a>`,
})
export class ResultsPage {
  readonly state = inject(FlowState);
}
