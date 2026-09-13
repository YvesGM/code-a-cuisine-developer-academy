import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FlowState } from '../core/flow-state';
import { CUISINE_LABELS, DIFFICULTIES } from '../core/config';
import { RecipeCard } from '../shared/recipe-card';
@Component({
  selector: 'app-results',
  imports: [RecipeCard, RouterLink],
  templateUrl: './results.html',
  styleUrl: './results.scss',
})
export class ResultsPage {
  readonly cuisines = CUISINE_LABELS;
  readonly difficulties = DIFFICULTIES;
  readonly state = inject(FlowState);
}
