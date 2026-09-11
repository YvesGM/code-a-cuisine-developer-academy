import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Recipe } from '../core/models';
import { CUISINE_LABELS, DIET_LABELS, DIFFICULTIES } from '../core/config';
@Component({
  selector: 'app-recipe-card',
  imports: [RouterLink],
  template: `<article>
    <h2>{{ recipe().title }}</h2>
    <p>
      {{ cuisines[recipe().cuisine] }} · {{ difficulties[recipe().difficulty].label }} ·
      {{ recipe().cookingTimeMinutes }} min ·
      {{ diets[recipe().diet] }}
    </p>
    <a [routerLink]="['/recipe', recipe().id]"
      >View<span class="visually-hidden"> {{ recipe().title }}</span></a
    >
  </article>`,
})
export class RecipeCard {
  readonly cuisines = CUISINE_LABELS;
  readonly diets = DIET_LABELS;
  readonly difficulties = DIFFICULTIES;
  readonly recipe = input.required<Recipe>();
}
