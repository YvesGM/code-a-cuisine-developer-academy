import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { OPTIONS } from '../core/config';
import { FlowState } from '../core/flow-state';
import { Ingredient, Unit } from '../core/models';
@Component({
  selector: 'app-ingredients',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <h1>Deine Zutaten</h1>
    <form [formGroup]="form" (ngSubmit)="save()">
      <label for="name">Name</label><input id="name" formControlName="name" required />
      <label for="amount">Menge</label
      ><input id="amount" type="number" step="any" formControlName="amount" required />
      <label for="unit">Einheit</label
      ><select id="unit" formControlName="unit">
        @for (unit of units; track unit) {
          <option [value]="unit">{{ unit }}</option>
        }
      </select>
      <button type="submit">{{ editingId() ? 'Änderung speichern' : 'Zutat hinzufügen' }}</button>
      @if (editingId()) {
        <button type="button" (click)="cancel()">Abbrechen</button>
      }
      @if (error()) {
        <p role="alert">{{ error() }}</p>
      }
    </form>
    <ul>
      @for (ingredient of state.ingredients(); track ingredient.id) {
        <li>
          {{ ingredient.name }}: {{ ingredient.amount }} {{ ingredient.unit }}
          <button
            type="button"
            (click)="edit(ingredient)"
            [attr.aria-label]="ingredient.name + ' bearbeiten'"
          >
            Bearbeiten
          </button>
          <button
            type="button"
            (click)="remove(ingredient.id)"
            [attr.aria-label]="ingredient.name + ' löschen'"
          >
            Löschen
          </button>
        </li>
      } @empty {
        <li>Noch keine Zutaten erfasst.</li>
      }
    </ul>
    @if (state.ingredients().length) {
      <a routerLink="/preferences">Next Step</a>
    } @else {
      <p>Füge mindestens eine gültige Zutat hinzu.</p>
    }
  `,
})
export class IngredientsPage {
  readonly state = inject(FlowState);
  readonly units = OPTIONS.units;
  readonly editingId = signal<string | undefined>(undefined);
  readonly error = signal('');
  readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/\S/)],
    }),
    amount: new FormControl(1, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(Number.MIN_VALUE)],
    }),
    unit: new FormControl<Unit>(OPTIONS.units[0], {
      nonNullable: true,
      validators: Validators.required,
    }),
  });
  /** Übernimmt nur gültige Formularentwürfe; Validierungsfehler bleiben sichtbar im Formular. */
  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Name, Menge größer als 0 und Einheit sind erforderlich.');
      return;
    }
    try {
      this.state.saveIngredient(this.form.getRawValue(), this.editingId());
      this.cancel();
    } catch {
      this.error.set('Zutat konnte nicht gespeichert werden. Bitte Eingaben prüfen.');
    }
  }
  /** Öffnet einen lokalen Editierentwurf und bewahrt die stabile Vorrats-ID. */
  edit(ingredient: Ingredient): void {
    this.editingId.set(ingredient.id);
    this.form.setValue({ name: ingredient.name, amount: ingredient.amount, unit: ingredient.unit });
    this.error.set('');
  }
  /** Entfernt die Zutat im Owner und schließt gegebenenfalls ihren Editierentwurf. */
  remove(id: string): void {
    this.state.deleteIngredient(id);
    if (this.editingId() === id) this.cancel();
  }
  /** Verwirft ausschließlich den ungespeicherten Entwurf und dessen Formularfehler. */
  cancel(): void {
    this.editingId.set(undefined);
    this.form.reset();
    this.error.set('');
  }
}
