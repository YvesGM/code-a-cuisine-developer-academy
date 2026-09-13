import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { IngredientCatalogService } from '../core/ingredient-catalog';
import { FlowState } from '../core/flow-state';
import { IngredientCatalogItem } from '../core/models';
import { IngredientsPage } from './ingredients';

describe('IngredientsPage', () => {
  const items = signal<readonly IngredientCatalogItem[]>([
    { name: 'Pasta', usageCount: 9 },
    { name: 'Pastrami', usageCount: 5 },
    { name: 'Passionsfruit', usageCount: 2 },
    { name: 'Paprika', usageCount: 1 },
  ]);
  const catalog = {
    items: items.asReadonly(),
    load: vi.fn(async () => undefined),
    recordUsage: vi.fn(async () => undefined),
  };

  beforeEach(() => {
    catalog.load.mockClear();
    catalog.recordUsage.mockClear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: IngredientCatalogService, useValue: catalog }],
    });
  });

  it('filters the prefetched catalog locally to the three highest-ranked prefix matches', () => {
    const page = TestBed.createComponent(IngredientsPage).componentInstance;
    page.form.controls.name.setValue('Pa');
    expect(page.suggestions().map((item) => item.name)).toEqual(['Pasta', 'Pastrami', 'Passionsfruit']);
  });

  it('keeps focus navigation in the input and accepts the active suggestion with Enter', () => {
    const page = TestBed.createComponent(IngredientsPage).componentInstance;
    page.form.controls.name.setValue('Pa');
    page.handleIngredientKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    page.handleIngredientKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(page.activeSuggestionIndex()).toBe(1);
    expect(page.suggestionSuffix()).toBe('strami');
    page.handleIngredientKeydown(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(page.form.controls.name.value).toBe('Pastrami');
  });

  it('keeps the add form untouched while opening the selected ingredient inline for editing', () => {
    const page = TestBed.createComponent(IngredientsPage).componentInstance;
    const state = TestBed.inject(FlowState);
    state.saveIngredient({ name: 'Pasta', amount: 250, unit: 'g' });
    page.form.setValue({ name: 'Tomatoes', amount: '300', unit: 'g' });
    const ingredient = state.ingredients()[0];
    page.edit(ingredient);
    expect(page.form.getRawValue()).toEqual({ name: 'Tomatoes', amount: '300', unit: 'g' });
    expect(page.editDraft(ingredient.id)).toEqual({ amount: '250', unit: 'g', unitMenuOpen: false });
  });

  it('keeps multiple ingredient edits open independently', () => {
    const page = TestBed.createComponent(IngredientsPage).componentInstance;
    const state = TestBed.inject(FlowState);
    state.saveIngredient({ name: 'Pasta', amount: 250, unit: 'g' });
    state.saveIngredient({ name: 'Tomatoes', amount: 300, unit: 'g' });
    const [tomatoes, pasta] = state.ingredients();
    page.edit(tomatoes);
    page.edit(pasta);
    expect(page.editDraft(tomatoes.id)?.amount).toBe('300');
    expect(page.editDraft(pasta.id)?.amount).toBe('250');
  });

  it('saves one inline edit without changing the ingredient name, id, or another open edit', () => {
    const page = TestBed.createComponent(IngredientsPage).componentInstance;
    const state = TestBed.inject(FlowState);
    state.saveIngredient({ name: 'Pasta', amount: 250, unit: 'g' });
    state.saveIngredient({ name: 'Tomatoes', amount: 300, unit: 'g' });
    const [tomatoes, pasta] = state.ingredients();
    page.edit(tomatoes);
    page.edit(pasta);
    page.updateEditAmount(pasta.id, '500');
    page.selectEditUnit(pasta.id, 'ml');
    page.saveEdit(pasta);
    expect(state.ingredients().find((item) => item.id === pasta.id)).toEqual({
      ...pasta,
      amount: 500,
      unit: 'ml',
    });
    expect(page.editDraft(pasta.id)).toBeUndefined();
    expect(page.editDraft(tomatoes.id)).toBeDefined();
  });

  it('allows the amount input to become empty and converts decimal text only on save', () => {
    const page = TestBed.createComponent(IngredientsPage).componentInstance;
    page.form.setValue({ name: 'Pasta', amount: '500', unit: 'g' });
    page.form.controls.amount.setValue('');
    expect(page.form.controls.amount.value).toBe('');
    expect(page.form.controls.amount.invalid).toBe(true);
    page.form.controls.amount.setValue('1,5');
    page.save();
    expect(TestBed.inject(FlowState).ingredients()[0].amount).toBe(1.5);
    expect(catalog.recordUsage).toHaveBeenCalledWith('Pasta');
  });
});
