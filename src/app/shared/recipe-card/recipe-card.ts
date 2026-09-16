import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CUISINE_LABELS, DIET_LABELS, DIFFICULTIES } from '../../config/app.constants';
import { Recipe } from '../../models/app.models';

/** Renders a recipe as a reusable card in results and the library. */
@Component({
  selector: 'app-recipe-card',
  imports: [RouterLink],
  templateUrl: './recipe-card.html',
  styleUrl: './recipe-card.scss',
})
export class RecipeCardComponent {
  readonly showRank = input(false);
  readonly cuisines = CUISINE_LABELS;
  readonly diets = DIET_LABELS;
  readonly difficulties = DIFFICULTIES;
  readonly recipe = input.required<Recipe>();
}
