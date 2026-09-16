import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CUISINE_LABELS, DIET_LABELS, DIFFICULTIES, LIMITS, OPTIONS } from '../../constants/recipe-flow.constants';
import { AppStateService } from '../../services/app-state.service';
import { Preferences, QuotaStatus } from '../../models/app.models';
import { QuotaService } from '../../services/quota.service';
/** Captures servings, cook count, and recipe preferences before generation. */
@Component({
  selector: 'app-preferences',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './preferences.html',
  styleUrl: './preferences.scss',
})
export class PreferencesComponent {
  readonly options = OPTIONS;
  readonly limits = LIMITS;
  readonly cuisines = CUISINE_LABELS;
  readonly diets = DIET_LABELS;
  readonly difficulties = DIFFICULTIES;
  private readonly state = inject(AppStateService);
  private readonly router = inject(Router);
  private readonly quotaService = inject(QuotaService);
  readonly quota = signal<QuotaStatus | null>(null);
  readonly quotaError = signal('');
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
  /**
   * Loads the server-side daily quota when the preferences page is created.
   */
  constructor() {
    void this.refreshQuota();
  }

  /**
   * Refreshes the quota display without reserving a generation.
   *
   * @returns {Promise<void>} A promise that resolves after the quota status has been refreshed.
   */
  private async refreshQuota(): Promise<void> {
    this.quotaError.set('');
    try {
      this.quota.set(await this.quotaService.getStatus());
    } catch {
      this.quota.set(null);
      this.quotaError.set(
        'The usage limit could not be loaded in advance; the server will validate it when generating.',
      );
    }
  }

  /**
   * Applies the complete valid draft to the owner and opens the generation status.
   *
   * @returns {void} No value is returned.
   */
  generate(): void {
    const { difficulty, cuisine, diet, servings, cookCount } = this.form.getRawValue();
    if (!difficulty || !cuisine || !diet || this.form.invalid) return;
    this.state.setPreferences({ difficulty, cuisine, diet });
    this.state.setServings(servings);
    this.state.setCookCount(cookCount);
    void this.state.generate();
    void this.router.navigateByUrl('/generating');
  }

  /**
   * Changes the form draft through the counter buttons within the configured limits.
   *
   * @param {('servings'|'cookCount')} name - The counter field to update.
   * @param {(-1|1)} delta - The amount to add or subtract.
   * @returns {void} No value is returned.
   */
  adjustCount(name: 'servings' | 'cookCount', delta: -1 | 1): void {
    const control = this.form.controls[name];
    if (!Number.isInteger(control.value)) return;
    const value = control.value + delta;
    if (value < this.limits[name].min || value > this.limits[name].max) return;
    control.setValue(value);
    control.markAsDirty();
  }
}
