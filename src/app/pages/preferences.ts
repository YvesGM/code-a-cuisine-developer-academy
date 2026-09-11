import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CUISINE_LABELS, DIET_LABELS, DIFFICULTIES, LIMITS, OPTIONS } from '../core/config';
import { FlowState } from '../core/flow-state';
import { Preferences } from '../core/models';
@Component({
  selector: 'app-preferences',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <h1>Preferences</h1>
    <form [formGroup]="form" (ngSubmit)="generate()">
      <fieldset>
        <legend>Portionen und Kochteam</legend>
        <label for="servings">Portionen</label>
        <input
          id="servings"
          type="number"
          formControlName="servings"
          [min]="limits.servings.min"
          [max]="limits.servings.max"
          step="1"
        />
        <p>
          Demo: Vorräte werden proportional auf bis zu zwölf Portionen verteilt. Keine Aussage über
          ausreichende Portionsgrößen.
        </p>
        <label for="cookCount">Kochhelfer</label>
        <input
          id="cookCount"
          type="number"
          formControlName="cookCount"
          [min]="limits.cookCount.min"
          [max]="limits.cookCount.max"
          step="1"
        />
      </fieldset>
      <fieldset>
        <legend>Rezeptwünsche</legend>
        <label for="difficulty">Difficulty / Aufwand</label
        ><select id="difficulty" formControlName="difficulty">
          <option [ngValue]="null">Bitte wählen</option>
          @for (item of options.difficulties; track item) {
            <option [value]="item">
              {{ difficulties[item].label }} – {{ difficulties[item].range }}
            </option>
          }
        </select>
        <label for="cuisine">Cuisine</label
        ><select id="cuisine" formControlName="cuisine">
          <option [ngValue]="null">Bitte wählen</option>
          @for (item of options.cuisines; track item) {
            <option [value]="item">{{ cuisines[item] }}</option>
          }
        </select>
        <label for="diet">Diet Preference</label
        ><select id="diet" formControlName="diet">
          <option [ngValue]="null">Bitte wählen</option>
          @for (item of options.diets; track item) {
            <option [value]="item">{{ diets[item] }}</option>
          }
        </select>
      </fieldset>
      @if (form.invalid) {
        <p>
          Bitte alle Wünsche wählen; Portionen und Kochhelfer müssen ganze Zahlen im angegebenen
          Bereich sein.
        </p>
      }
      <button type="submit" [disabled]="form.invalid">Generate Recipe</button>
    </form>
    <a routerLink="/generate">Zurück zu Zutaten</a>
  `,
})
export class PreferencesPage {
  readonly options = OPTIONS;
  readonly limits = LIMITS;
  readonly cuisines = CUISINE_LABELS;
  readonly diets = DIET_LABELS;
  readonly difficulties = DIFFICULTIES;
  private readonly state = inject(FlowState);
  private readonly router = inject(Router);
  readonly form = new FormGroup({
    servings: new FormControl(this.state.servings(), {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.min(LIMITS.servings.min),
        Validators.max(LIMITS.servings.max),
        Validators.pattern(/^\d+$/),
      ],
    }),
    cookCount: new FormControl(this.state.cookCount(), {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.min(LIMITS.cookCount.min),
        Validators.max(LIMITS.cookCount.max),
        Validators.pattern(/^\d+$/),
      ],
    }),
    difficulty: new FormControl<Preferences['difficulty'] | null>(
      this.state.preferences()?.difficulty ?? null,
      Validators.required,
    ),
    cuisine: new FormControl<Preferences['cuisine'] | null>(
      this.state.preferences()?.cuisine ?? null,
      Validators.required,
    ),
    diet: new FormControl<Preferences['diet'] | null>(
      this.state.preferences()?.diet ?? null,
      Validators.required,
    ),
  });
  /** Übernimmt den vollständigen gültigen Entwurf in den Owner und öffnet den Generation-Status. */
  generate(): void {
    const { difficulty, cuisine, diet, servings, cookCount } = this.form.getRawValue();
    if (!difficulty || !cuisine || !diet || this.form.invalid) return;
    this.state.setPreferences({ difficulty, cuisine, diet });
    this.state.setServings(servings);
    this.state.setCookCount(cookCount);
    void this.state.generate();
    void this.router.navigateByUrl('/generating');
  }
}
