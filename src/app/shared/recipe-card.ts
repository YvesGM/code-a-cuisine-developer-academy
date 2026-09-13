import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Recipe } from '../core/models';
import { CUISINE_LABELS, DIET_LABELS, DIFFICULTIES } from '../core/config';
@Component({
  selector: 'app-recipe-card',
  imports: [RouterLink],
  styleUrl: './recipe-card.scss',
  template: `<article class="recipe-card" [class.recipe-card--ranked]="showRank()">
    @if (showRank()) {
      <p class="recipe-rank">
        <img src="assets/icons/recipe-icon.svg" alt="" width="40" height="28" />Recipe
        {{ recipe().rank }}
      </p>
    }
    <h2>{{ recipe().title }}</h2>
    <p class="cooking-time">
    <img class="icon" src="assets/icons/clock-icon.svg" alt="" width="20" height="20" />
      Cooking time: {{ recipe().cookingTimeMinutes }}min
    </p>
    @if (!showRank()) {
      <p class="recipe-meta">
        {{ cuisines[recipe().cuisine] }} · {{ difficulties[recipe().difficulty].label }} ·
        {{ diets[recipe().diet] }}
      </p>
    }
    <a class="button button--cream" [routerLink]="['/recipe', recipe().id]"
      >View<span class="visually-hidden"> {{ recipe().title }}</span></a
    >
  </article>`,
})
export class RecipeCard {
  readonly showRank = input(false);
  readonly cuisines = CUISINE_LABELS;
  readonly diets = DIET_LABELS;
  readonly difficulties = DIFFICULTIES;
  readonly recipe = input.required<Recipe>();
}
