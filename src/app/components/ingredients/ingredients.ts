import { Component, ElementRef, inject, OnInit, signal, ViewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { OPTIONS } from '../../config/app.constants';
import { AppStateService } from '../../services/app-state.service';
import { IngredientService } from '../../services/ingredient.service';
import { Ingredient, IngredientCatalogItem, IngredientInput, Unit } from '../../models/app.models';

interface IngredientEditDraft {
  readonly amount: string;
  readonly unit: Unit;
  readonly unitMenuOpen: boolean;
}

const AMOUNT_VALIDATORS = [
  Validators.required,
  Validators.pattern(/^(?!0+(?:[.,]0+)?$)\d+(?:[.,]\d+)?$/),
];

/** Manages input, autocomplete, and editing for the current ingredients. */
@Component({
  selector: 'app-ingredients',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './ingredients.html',
  styleUrl: './ingredients.scss',
})
export class IngredientsComponent implements OnInit {
  readonly state = inject(AppStateService);
  readonly catalog = inject(IngredientService);
  readonly units = OPTIONS.units;
  readonly editDrafts = signal<Readonly<Record<string, IngredientEditDraft>>>({});
  readonly error = signal('');
  readonly unitMenuOpen = signal(false);
  readonly ingredientCaretLeft = signal(12);
  readonly ingredientCaretAtEnd = signal(true);
  readonly activeSuggestionIndex = signal(-1);
  @ViewChild('ingredientInput') private ingredientInput?: ElementRef<HTMLInputElement>;
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

  /**
   * Loads the ingredient catalog before autocomplete is used.
   *
   * @returns {void} No value is returned.
   */
  ngOnInit(): void {
    void this.catalog.load().catch(() => {
      this.error.set('Ingredient suggestions are currently unavailable.');
    });
  }

  /**
   * Returns the three most-used prefix matches from the loaded catalog.
   *
   * @returns {ReadonlyArray<IngredientCatalogItem>} The three highest-ranked matching catalog items.
   */
  suggestions(): readonly IngredientCatalogItem[] {
    const query = this.form.controls.name.value.trim().toLocaleLowerCase();
    if (query.length < 2) return [];
    return this.catalog
      .items()
      .filter((item) => this.matchesSuggestion(item.name, query))
      .slice(0, 3);
  }

  /**
   * Checks prefix matches and hides an already fully selected term.
   *
   * @param {string} item - The ingredient catalog name to test.
   * @param {string} query - The normalized ingredient query.
   * @returns {boolean} True when the catalog item is a prefix match that is not already fully selected.
   */
  private matchesSuggestion(item: string, query: string): boolean {
    const normalized = item.toLocaleLowerCase();
    return normalized.startsWith(query) && normalized !== query;
  }

  /**
   * Returns the keyboard-active match or the first suggestion by default.
   *
   * @returns {(string|undefined)} The selected suggestion name, or undefined when no suggestion exists.
   */
  private suggestedName(): string | undefined {
    const suggestions = this.suggestions();
    const active = suggestions[this.activeSuggestionIndex()];
    return active?.name ?? suggestions[0]?.name;
  }

  /**
   * Returns only the missing part of the currently selected autocomplete match.
   *
   * @returns {string} The unmatched suffix of the active suggestion, or an empty string.
   */
  suggestionSuffix(): string {
    const value = this.form.controls.name.value;
    if (!this.ingredientCaretAtEnd() || value.trim() !== value) return '';
    const suggestion = this.suggestedName();
    return suggestion ? suggestion.slice(value.length) : '';
  }

  /**
   * Resets keyboard selection on new text input and synchronizes the custom caret.
   *
   * @returns {void} No value is returned.
   */
  handleIngredientInput(): void {
    this.activeSuggestionIndex.set(-1);
    this.syncIngredientCaret();
  }

  /**
   * Navigates suggestions in the focused input and accepts a selection with Enter or Tab.
   *
   * @param {KeyboardEvent} event - The keyboard event from the ingredient input.
   * @returns {void} No value is returned.
   */
  handleIngredientKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown') return this.moveSuggestion(event, 1);
    if (event.key === 'ArrowUp') return this.moveSuggestion(event, -1);
    if (event.key === 'Enter' && this.activeSuggestionIndex() >= 0) {
      return this.acceptActiveSuggestion(event);
    }
    this.acceptInlineSuggestion(event);
  }

  /**
   * Moves the active selection without leaving the ingredient input.
   *
   * @param {KeyboardEvent} event - The keyboard event used for navigation.
   * @param {(1|-1)} direction - The direction to move through suggestions.
   * @returns {void} No value is returned.
   */
  private moveSuggestion(event: KeyboardEvent, direction: 1 | -1): void {
    const length = this.suggestions().length;
    if (!length) return;
    event.preventDefault();
    const current = this.activeSuggestionIndex();
    const next = direction === 1 ? Math.min(current + 1, length - 1) : Math.max(current - 1, 0);
    this.activeSuggestionIndex.set(next);
  }

  /**
   * Accepts exactly the active keyboard match and prevents form submission.
   *
   * @param {KeyboardEvent} event - The keyboard event that accepts the active suggestion.
   * @returns {void} No value is returned.
   */
  private acceptActiveSuggestion(event: KeyboardEvent): void {
    const suggestion = this.suggestions()[this.activeSuggestionIndex()];
    if (!suggestion) return;
    event.preventDefault();
    this.selectSuggestion(suggestion.name);
  }

  /**
   * Accepts the current inline suggestion with Tab without triggering the normal focus change.
   *
   * @param {KeyboardEvent} event - The keyboard event that may accept the inline suggestion.
   * @returns {void} No value is returned.
   */
  private acceptInlineSuggestion(event: KeyboardEvent): void {
    if (event.key !== 'Tab' || !this.suggestionSuffix()) return;
    const suggestion = this.suggestedName();
    if (!suggestion) return;
    event.preventDefault();
    this.selectSuggestion(suggestion);
  }

  /**
   * Applies an autocomplete match to the current form draft.
   *
   * @param {string} name - The selected ingredient name.
   * @returns {void} No value is returned.
   */
  selectSuggestion(name: string): void {
    this.form.controls.name.setValue(name);
    this.form.controls.name.markAsDirty();
    this.activeSuggestionIndex.set(-1);
    queueMicrotask(() => this.placeIngredientCaretAtEnd());
  }

  /**
   * Synchronizes the custom caret with the current cursor position in the ingredient field.
   *
   * @returns {void} No value is returned.
   */
  syncIngredientCaret(): void {
    const input = this.ingredientInput?.nativeElement;
    if (!input) return;
    const padding = Number.parseFloat(getComputedStyle(input).paddingLeft) || 0;
    this.ingredientCaretLeft.set(padding + this.ingredientTextWidth(input) - input.scrollLeft);
    this.syncIngredientCaretEnd(input);
  }

  /**
   * Moves the cursor to the end of the ingredient value after accepting a suggestion.
   *
   * @returns {void} No value is returned.
   */
  private placeIngredientCaretAtEnd(): void {
    const input = this.ingredientInput?.nativeElement;
    if (!input) return;
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
    this.syncIngredientCaret();
  }

  /**
   * Tracks whether the visible cursor is at the end of the ingredient value.
   *
   * @param {HTMLInputElement} input - The ingredient input element.
   * @returns {void} No value is returned.
   */
  private syncIngredientCaretEnd(input: HTMLInputElement): void {
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? start;
    this.ingredientCaretAtEnd.set(start === input.value.length && end === input.value.length);
  }

  /**
   * Measures the visible text up to the current cursor position in the ingredient field.
   *
   * @param {HTMLInputElement} input - The ingredient input element.
   * @returns {number} The rendered width in pixels up to the current cursor position.
   */
  private ingredientTextWidth(input: HTMLInputElement): number {
    const position = input.selectionStart ?? input.value.length;
    return this.measureInputText(input, input.value.slice(0, position));
  }

  /**
   * Measures text using the exact typography rendered by the input.
   *
   * @param {HTMLInputElement} input - The input element whose typography is measured.
   * @param {string} text - The text to measure.
   * @returns {number} The rendered width of the supplied text in pixels.
   */
  private measureInputText(input: HTMLInputElement, text: string): number {
    const context = this.caretMeasureContext;
    if (!context) return 0;
    context.font = getComputedStyle(input).font;
    return context.measureText(text).width;
  }

  /**
   * Opens or closes only the unit selector.
   *
   * @returns {void} No value is returned.
   */
  toggleUnitMenu(): void {
    this.unitMenuOpen.update((open) => !open);
  }

  /**
   * Applies the selected unit and closes the unit selector.
   *
   * @param {Unit} unit - The selected ingredient unit.
   * @returns {void} No value is returned.
   */
  selectUnit(unit: Unit): void {
    this.form.controls.unit.setValue(unit);
    this.unitMenuOpen.set(false);
  }

  /**
   * Converts the editable amount string to a domain number only when saving.
   *
   * @param {string} value - The raw amount text.
   * @returns {(number|null)} The parsed positive amount, or null when the value is invalid.
   */
  private amountValue(value: string): number | null {
    const amount = Number(value.replace(',', '.'));
    return Number.isFinite(amount) && amount > 0 ? amount : null;
  }

  /**
   * Builds a valid domain draft from name, amount string, and unit.
   *
   * @param {string} name - The ingredient name.
   * @param {string} amountText - The raw ingredient amount text.
   * @param {Unit} unit - The selected ingredient unit.
   * @returns {(IngredientInput|null)} The normalized ingredient input, or null when the draft is invalid.
   */
  private draftFrom(name: string, amountText: string, unit: Unit): IngredientInput | null {
    const amount = this.amountValue(amountText);
    if (!name.trim() || amount === null) return null;
    return { name, amount, unit };
  }

  /**
   * Builds a new ingredient draft from the add form only.
   *
   * @returns {(IngredientInput|null)} The normalized ingredient input, or null when the draft is invalid.
   */
  private ingredientDraft(): IngredientInput | null {
    if (this.form.invalid) return null;
    const value = this.form.getRawValue();
    return this.draftFrom(value.name, value.amount, value.unit);
  }

  /**
   * Accepts only valid new ingredients and registers their catalog usage.
   *
   * @returns {void} No value is returned.
   */
  save(): void {
    const draft = this.ingredientDraft();
    if (!draft) return this.showValidationError();
    try {
      this.state.saveIngredient(draft);
      this.resetAddForm();
      void this.catalog.recordUsage(draft.name).catch(() => {
        this.error.set('Ingredient was saved, but catalog usage could not be updated.');
      });
    } catch {
      this.error.set('Ingredient could not be saved. Please check the input.');
    }
  }

  /**
   * Marks the complete add draft and shows the existing validation message.
   *
   * @returns {void} No value is returned.
   */
  private showValidationError(): void {
    this.form.markAllAsTouched();
    this.error.set('Name, an amount greater than 0, and a unit are required.');
  }

  /**
   * Resets only the add form and leaves inline edits untouched.
   *
   * @returns {void} No value is returned.
   */
  private resetAddForm(): void {
    this.form.reset();
    this.activeSuggestionIndex.set(-1);
    this.error.set('');
  }

  /**
   * Returns the independent inline draft for an ingredient row.
   *
   * @param {string} id - The ingredient identifier whose edit draft is requested.
   * @returns {(IngredientEditDraft|undefined)} The edit draft, or undefined when no draft is open.
   */
  editDraft(id: string): IngredientEditDraft | undefined {
    return this.editDrafts()[id];
  }

  /**
   * Opens inline editing in addition to any ingredients already being edited.
   *
   * @param {Ingredient} ingredient - The ingredient to open for inline editing.
   * @returns {void} No value is returned.
   */
  edit(ingredient: Ingredient): void {
    this.setEditDraft(ingredient.id, {
      amount: String(ingredient.amount),
      unit: ingredient.unit,
      unitMenuOpen: false,
    });
  }

  /**
   * Synchronizes only the amount of the specified inline draft.
   *
   * @param {string} id - The ingredient identifier being edited.
   * @param {string} value - The new raw amount value.
   * @returns {void} No value is returned.
   */
  updateEditAmount(id: string, value: string): void {
    this.patchEditDraft(id, { amount: value });
  }

  /**
   * Opens or closes the unit selector only for the specified ingredient row.
   *
   * @param {string} id - The ingredient identifier being edited.
   * @returns {void} No value is returned.
   */
  toggleEditUnitMenu(id: string): void {
    const draft = this.editDraft(id);
    if (!draft) return;
    this.patchEditDraft(id, { unitMenuOpen: !draft.unitMenuOpen });
  }

  /**
   * Applies the unit only to the specified inline draft.
   *
   * @param {string} id - The ingredient identifier being edited.
   * @param {Unit} unit - The selected ingredient unit.
   * @returns {void} No value is returned.
   */
  selectEditUnit(id: string, unit: Unit): void {
    this.patchEditDraft(id, { unit, unitMenuOpen: false });
  }

  /**
   * Closes only the unit selector for the specified ingredient row.
   *
   * @param {string} id - The ingredient identifier being edited.
   * @returns {void} No value is returned.
   */
  closeEditUnitMenu(id: string): void {
    this.patchEditDraft(id, { unitMenuOpen: false });
  }

  /**
   * Saves the amount and unit for this ingredient while leaving other edits open.
   *
   * @param {Ingredient} ingredient - The ingredient whose inline edit should be saved.
   * @returns {void} No value is returned.
   */
  saveEdit(ingredient: Ingredient): void {
    const current = this.editDraft(ingredient.id);
    if (!current) return;
    const draft = this.draftFrom(ingredient.name, current.amount, current.unit);
    if (!draft) return;
    this.state.saveIngredient(draft, ingredient.id);
    this.clearEditDraft(ingredient.id);
  }

  /**
   * Removes the ingredient and only its associated inline draft.
   *
   * @param {string} id - The ingredient identifier to remove.
   * @returns {void} No value is returned.
   */
  remove(id: string): void {
    this.state.deleteIngredient(id);
    this.clearEditDraft(id);
  }

  /**
   * Stores a complete draft under its stable ingredient ID.
   *
   * @param {string} id - The ingredient identifier that owns the draft.
   * @param {IngredientEditDraft} draft - The complete inline edit draft.
   * @returns {void} No value is returned.
   */
  private setEditDraft(id: string, draft: IngredientEditDraft): void {
    this.editDrafts.update((drafts) => ({ ...drafts, [id]: draft }));
  }

  /**
   * Updates individual values of an already open inline draft.
   *
   * @param {string} id - The ingredient identifier that owns the draft.
   * @param {Partial<IngredientEditDraft>} patch - The draft values to update.
   * @returns {void} No value is returned.
   */
  private patchEditDraft(id: string, patch: Partial<IngredientEditDraft>): void {
    const draft = this.editDraft(id);
    if (!draft) return;
    this.setEditDraft(id, { ...draft, ...patch });
  }

  /**
   * Closes exactly one inline draft without affecting other edits.
   *
   * @param {string} id - The ingredient identifier whose draft should be closed.
   * @returns {void} No value is returned.
   */
  private clearEditDraft(id: string): void {
    this.editDrafts.update((drafts) => {
      const next = { ...drafts };
      delete next[id];
      return next;
    });
  }
}
