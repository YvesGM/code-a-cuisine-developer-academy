import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppStateService } from '../../services/app-state.service';
import { CUISINE_LABELS, DIFFICULTIES } from '../../constants/recipe-flow.constants';
import { RecipeCardComponent } from '../../shared/recipe-card/recipe-card';
/** Displays the three validated recipe suggestions from the current generation flow. */
@Component({
  selector: 'app-results',
  imports: [RecipeCardComponent, RouterLink],
  templateUrl: './results.html',
  styleUrl: './results.scss',
})
export class ResultsComponent {
  readonly cuisines = CUISINE_LABELS;
  readonly difficulties = DIFFICULTIES;
  readonly state = inject(AppStateService);
}
