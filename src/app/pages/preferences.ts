import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CUISINE_LABELS, DIET_LABELS, DIFFICULTIES, LIMITS, OPTIONS } from '../core/config';
import { FlowState } from '../core/flow-state';
import { Preferences, QuotaStatus } from '../core/models';
import { QuotaService } from '../core/quota';
@Component({
  selector: 'app-preferences',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './preferences.html',
  styleUrl: './preferences.scss',
})
export class PreferencesPage {
  readonly options = OPTIONS;
  readonly limits = LIMITS;
  readonly cuisines = CUISINE_LABELS;
  readonly diets = DIET_LABELS;
  readonly difficulties = DIFFICULTIES;
  private readonly state = inject(FlowState);
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
  /** Lädt beim Öffnen transparent die serverseitige Tagesquota; Mock-Modus bleibt ohne Anzeige. */
  constructor() {
    void this.refreshQuota();
  }

  /** Aktualisiert die Quota-Anzeige, ohne eine Generierung zu reservieren. */
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

  /** Ändert den Formularentwurf über die Zählerbuttons innerhalb der bestehenden Grenzen. */
  adjustCount(name: 'servings' | 'cookCount', delta: -1 | 1): void {
    const control = this.form.controls[name];
    if (!Number.isInteger(control.value)) return;
    const value = control.value + delta;
    if (value < this.limits[name].min || value > this.limits[name].max) return;
    control.setValue(value);
    control.markAsDirty();
  }
}
