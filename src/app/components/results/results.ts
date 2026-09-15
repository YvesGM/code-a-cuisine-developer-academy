import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppStateService } from '../../services/app-state.service';
import { CUISINE_LABELS, DIFFICULTIES } from '../../config/app.constants';
import { RecipeCardComponent } from '../../shared/recipe-card/recipe-card';
/** Zeigt die drei validierten Rezeptvorschläge des aktuellen Generierungsflows. */
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
