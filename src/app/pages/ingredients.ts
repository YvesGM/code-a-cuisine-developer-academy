import { Component, ElementRef, inject, OnInit, signal, ViewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { OPTIONS } from '../core/config';
import { FlowState } from '../core/flow-state';
import { IngredientCatalogService } from '../core/ingredient-catalog';
import { Ingredient, IngredientCatalogItem, IngredientInput, Unit } from '../core/models';

interface IngredientEditDraft {
  readonly amount: string;
  readonly unit: Unit;
  readonly unitMenuOpen: boolean;
}

const AMOUNT_VALIDATORS = [
  Validators.required,
  Validators.pattern(/^(?!0+(?:[.,]0+)?$)\d+(?:[.,]\d+)?$/),
];

@Component({
  selector: 'app-ingredients',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './ingredients.html',
  styleUrl: './ingredients.scss',
})
export class IngredientsPage implements OnInit {
  readonly state = inject(FlowState);
  readonly catalog = inject(IngredientCatalogService);
  readonly units = OPTIONS.units;
  readonly editDrafts = signal<Readonly<Record<string, IngredientEditDraft>>>({});
  readonly error = signal('');
  readonly unitMenuOpen = signal(false);
  readonly ingredientCaretLeft = signal(12);
  readonly amountCaretLeft = signal(12);
  readonly ingredientCaretAtEnd = signal(true);
  readonly activeSuggestionIndex = signal(-1);
  @ViewChild('ingredientInput') private ingredientInput?: ElementRef<HTMLInputElement>;
  @ViewChild('amountInput') private amountInput?: ElementRef<HTMLInputElement>;
  private readonly caretMeasureContext = document.createElement('canvas').getContext('2d');
  readonly unitLabels: Record<Unit, string> = { piece: 'piece', ml: 'ml', g: 'gram' };
  readonly listUnitLabels: Record<Unit, string> = { piece: '', ml: 'ml', g: 'g' };
  readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/\S/)],
    }),
    amount: new FormControl('', {
      nonNullable: true,
      validators: AMOUNT_VALIDATORS,
    }),
    unit: new FormControl<Unit>(OPTIONS.units[0], {
      nonNullable: true,
      validators: Validators.required,
    }),
  });

  /** Lädt den Catalog früh einmalig; Tippen filtert danach ausschließlich den lokalen Stand. */
  ngOnInit(): void {
    void this.catalog.load().catch(() => undefined);
  }

  /** Liefert die drei meistgenutzten Prefix-Treffer aus dem bereits geladenen Catalog. */
  suggestions(): readonly IngredientCatalogItem[] {
    const query = this.form.controls.name.value.trim().toLocaleLowerCase();
    if (query.length < 2) return [];
    return this.catalog
      .items()
      .filter((item) => this.matchesSuggestion(item.name, query))
      .slice(0, 3);
  }

  /** Prüft Prefix-Treffer und blendet einen bereits vollständig gewählten Begriff aus. */
  private matchesSuggestion(item: string, query: string): boolean {
    const normalized = item.toLocaleLowerCase();
    return normalized.startsWith(query) && normalized !== query;
  }

  /** Liefert den per Pfeiltaste aktiven Treffer oder standardmäßig den ersten Vorschlag. */
  private suggestedName(): string | undefined {
    const suggestions = this.suggestions();
    const active = suggestions[this.activeSuggestionIndex()];
    return active?.name ?? suggestions[0]?.name;
  }

  /** Liefert nur den noch fehlenden Teil des aktuell ausgewählten Autocomplete-Treffers. */
  suggestionSuffix(): string {
    const value = this.form.controls.name.value;
    if (!this.ingredientCaretAtEnd() || value.trim() !== value) return '';
    const suggestion = this.suggestedName();
    return suggestion ? suggestion.slice(value.length) : '';
  }

  /** Setzt Keyboard-Auswahl bei neuer Texteingabe zurück und synchronisiert den Custom-Caret. */
  handleIngredientInput(): void {
    this.activeSuggestionIndex.set(-1);
    this.syncIngredientCaret();
  }

  /** Navigiert Vorschläge im fokussierten Input und übernimmt Auswahl per Enter oder Tab. */
  handleIngredientKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown') return this.moveSuggestion(event, 1);
    if (event.key === 'ArrowUp') return this.moveSuggestion(event, -1);
    if (event.key === 'Enter' && this.activeSuggestionIndex() >= 0) {
      return this.acceptActiveSuggestion(event);
    }
    this.acceptInlineSuggestion(event);
  }

  /** Verschiebt die aktive Auswahl ohne den Fokus aus dem Ingredient-Input zu nehmen. */
  private moveSuggestion(event: KeyboardEvent, direction: 1 | -1): void {
    const length = this.suggestions().length;
    if (!length) return;
    event.preventDefault();
    const current = this.activeSuggestionIndex();
    const next = direction === 1 ? Math.min(current + 1, length - 1) : Math.max(current - 1, 0);
    this.activeSuggestionIndex.set(next);
  }

  /** Übernimmt genau den aktiven Keyboard-Treffer und verhindert das Formular-Submit. */
  private acceptActiveSuggestion(event: KeyboardEvent): void {
    const suggestion = this.suggestions()[this.activeSuggestionIndex()];
    if (!suggestion) return;
    event.preventDefault();
    this.selectSuggestion(suggestion.name);
  }

  /** Übernimmt den aktuellen Inline-Vorschlag mit Tab, ohne den normalen Fokuswechsel auszulösen. */
  private acceptInlineSuggestion(event: KeyboardEvent): void {
    if (event.key !== 'Tab' || !this.suggestionSuffix()) return;
    const suggestion = this.suggestedName();
    if (!suggestion) return;
    event.preventDefault();
    this.selectSuggestion(suggestion);
  }

  /** Übernimmt einen Autocomplete-Treffer in den bestehenden Formularentwurf. */
  selectSuggestion(name: string): void {
    this.form.controls.name.setValue(name);
    this.form.controls.name.markAsDirty();
    this.activeSuggestionIndex.set(-1);
    queueMicrotask(() => this.placeIngredientCaretAtEnd());
  }

  /** Synchronisiert den Figma-Caret mit der aktuellen Cursorposition im Zutatenfeld. */
  syncIngredientCaret(): void {
    const input = this.ingredientInput?.nativeElement;
    if (!input) return;
    const padding = Number.parseFloat(getComputedStyle(input).paddingLeft) || 0;
    this.ingredientCaretLeft.set(padding + this.ingredientTextWidth(input) - input.scrollLeft);
    this.syncIngredientCaretEnd(input);
  }

  /** Setzt den Cursor nach Übernahme eines Vorschlags ans Ende des Zutatenwerts. */
  private placeIngredientCaretAtEnd(): void {
    const input = this.ingredientInput?.nativeElement;
    if (!input) return;
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
    this.syncIngredientCaret();
  }

  /** Merkt, ob der sichtbare Cursor am Ende des Zutatenwerts steht. */
  private syncIngredientCaretEnd(input: HTMLInputElement): void {
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? start;
    this.ingredientCaretAtEnd.set(start === input.value.length && end === input.value.length);
  }

  /** Synchronisiert den Figma-Caret mit dem aktuellen Wert im Mengenfeld. */
  syncAmountCaret(): void {
    const input = this.amountInput?.nativeElement;
    if (!input) return;
    const padding = Number.parseFloat(getComputedStyle(input).paddingLeft) || 0;
    const left = padding + this.measureInputText(input, input.value) - input.scrollLeft;
    this.amountCaretLeft.set(left);
  }

  /** Misst den sichtbaren Text bis zur aktuellen Cursorposition des Zutatenfelds. */
  private ingredientTextWidth(input: HTMLInputElement): number {
    const position = input.selectionStart ?? input.value.length;
    return this.measureInputText(input, input.value.slice(0, position));
  }

  /** Misst Text mit exakt der aktuell gerenderten Input-Typografie. */
  private measureInputText(input: HTMLInputElement, text: string): number {
    const context = this.caretMeasureContext;
    if (!context) return 0;
    context.font = getComputedStyle(input).font;
    return context.measureText(text).width;
  }

  /** Öffnet oder schließt ausschließlich die Unit-Auswahl. */
  toggleUnitMenu(): void {
    this.unitMenuOpen.update((open) => !open);
  }

  /** Übernimmt die gewählte Einheit und schließt die Unit-Auswahl. */
  selectUnit(unit: Unit): void {
    this.form.controls.unit.setValue(unit);
    this.unitMenuOpen.set(false);
  }

  /** Wandelt den editierbaren Mengenstring erst beim Speichern in eine Domain-Zahl um. */
  private amountValue(value: string): number | null {
    const amount = Number(value.replace(',', '.'));
    return Number.isFinite(amount) && amount > 0 ? amount : null;
  }

  /** Baut aus Name, Mengenstring und Einheit einen gültigen Domain-Entwurf. */
  private draftFrom(name: string, amountText: string, unit: Unit): IngredientInput | null {
    const amount = this.amountValue(amountText);
    if (!name.trim() || amount === null) return null;
    return { name, amount, unit };
  }

  /** Baut aus dem Add-Formular ausschließlich einen neuen Zutatenentwurf. */
  private ingredientDraft(): IngredientInput | null {
    if (this.form.invalid) return null;
    const value = this.form.getRawValue();
    return this.draftFrom(value.name, value.amount, value.unit);
  }

  /** Übernimmt nur gültige neue Zutaten und registriert ihre Nutzung im Catalog. */
  save(): void {
    const draft = this.ingredientDraft();
    if (!draft) return this.showValidationError();
    try {
      this.state.saveIngredient(draft);
      this.resetAddForm();
      void this.catalog.recordUsage(draft.name).catch(() => undefined);
    } catch {
      this.error.set('Zutat konnte nicht gespeichert werden. Bitte Eingaben prüfen.');
    }
  }

  /** Markiert den gesamten Add-Entwurf und zeigt den bestehenden Validierungstext. */
  private showValidationError(): void {
    this.form.markAllAsTouched();
    this.error.set('Name, Menge größer als 0 und Einheit sind erforderlich.');
  }

  /** Setzt nur das Add-Formular zurück und lässt den Inline-Edit davon unberührt. */
  private resetAddForm(): void {
    this.form.reset();
    this.activeSuggestionIndex.set(-1);
    this.error.set('');
  }

  /** Liefert den unabhängigen Inline-Entwurf einer Zutatenzeile. */
  editDraft(id: string): IngredientEditDraft | undefined {
    return this.editDrafts()[id];
  }

  /** Öffnet den Inline-Edit zusätzlich zu bereits bearbeiteten Zutaten. */
  edit(ingredient: Ingredient): void {
    this.setEditDraft(ingredient.id, {
      amount: String(ingredient.amount),
      unit: ingredient.unit,
      unitMenuOpen: false,
    });
  }

  /** Synchronisiert nur die Menge des angegebenen Inline-Entwurfs. */
  updateEditAmount(id: string, value: string): void {
    this.patchEditDraft(id, { amount: value });
  }

  /** Öffnet oder schließt die Unit-Auswahl nur für die angegebene Zutatenzeile. */
  toggleEditUnitMenu(id: string): void {
    const draft = this.editDraft(id);
    if (!draft) return;
    this.patchEditDraft(id, { unitMenuOpen: !draft.unitMenuOpen });
  }

  /** Übernimmt die Einheit nur in den angegebenen Inline-Entwurf. */
  selectEditUnit(id: string, unit: Unit): void {
    this.patchEditDraft(id, { unit, unitMenuOpen: false });
  }

  /** Schließt nur die Unit-Auswahl der angegebenen Zutatenzeile. */
  closeEditUnitMenu(id: string): void {
    this.patchEditDraft(id, { unitMenuOpen: false });
  }

  /** Speichert Menge und Einheit dieser Zutat und lässt andere Edits geöffnet. */
  saveEdit(ingredient: Ingredient): void {
    const current = this.editDraft(ingredient.id);
    if (!current) return;
    const draft = this.draftFrom(ingredient.name, current.amount, current.unit);
    if (!draft) return;
    this.state.saveIngredient(draft, ingredient.id);
    this.clearEditDraft(ingredient.id);
  }

  /** Entfernt die Zutat und ausschließlich ihren zugehörigen Inline-Entwurf. */
  remove(id: string): void {
    this.state.deleteIngredient(id);
    this.clearEditDraft(id);
  }

  /** Setzt einen vollständigen Entwurf unter seiner stabilen Zutaten-ID. */
  private setEditDraft(id: string, draft: IngredientEditDraft): void {
    this.editDrafts.update((drafts) => ({ ...drafts, [id]: draft }));
  }

  /** Aktualisiert einzelne Werte eines bereits geöffneten Inline-Entwurfs. */
  private patchEditDraft(id: string, patch: Partial<IngredientEditDraft>): void {
    const draft = this.editDraft(id);
    if (!draft) return;
    this.setEditDraft(id, { ...draft, ...patch });
  }

  /** Schließt genau einen Inline-Entwurf, ohne andere Bearbeitungen anzufassen. */
  private clearEditDraft(id: string): void {
    this.editDrafts.update((drafts) => {
      const next = { ...drafts };
      delete next[id];
      return next;
    });
  }
}
