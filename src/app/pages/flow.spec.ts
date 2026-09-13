import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../app.routes';
import { GENERATION_PROVIDER, mockResponse } from '../core/generation';
import { FlowState } from '../core/flow-state';
import { GenerationRequest } from '../core/models';
import { IngredientsPage } from './ingredients';
import { PreferencesPage } from './preferences';
import { GeneratingPage } from './generating';
import { RecipeDetailPage } from './recipe-detail';
import { CuisinePage } from './cuisine';
import { RECIPE_REPOSITORY } from '../core/recipe-repository';
describe('Functional navigation flow', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        {
          provide: GENERATION_PROVIDER,
          useValue: { generate: async (request: GenerationRequest) => mockResponse(request) },
        },
      ],
    }),
  );
  it('covers ingredient CRUD, preferences, generation, results, detail and cookbook', async () => {
    const harness = await RouterTestingHarness.create('/');
    expect(harness.routeNativeElement?.querySelector('a')?.getAttribute('href')).toBe('/generate');
    const ingredients = await harness.navigateByUrl('/generate', IngredientsPage);
    ingredients.form.setValue({ name: 'Pasta', amount: '100', unit: 'g' });
    ingredients.save();
    const state = TestBed.inject(FlowState);
    const original = state.ingredients()[0];
    ingredients.edit(original);
    ingredients.form.controls.amount.setValue('80');
    ingredients.save();
    expect(state.ingredients()[0].id).toBe(original.id);
    ingredients.remove(original.id);
    expect(state.ingredients()).toHaveLength(0);
    ingredients.form.setValue({ name: 'Tomato', amount: '150', unit: 'g' });
    ingredients.save();
    ingredients.form.setValue({ name: 'Spinach', amount: '100', unit: 'g' });
    ingredients.save();
    const preferences = await harness.navigateByUrl('/preferences', PreferencesPage);
    preferences.form.setValue({
      difficulty: 'quick',
      cuisine: 'italian',
      diet: 'none',
      servings: 4,
      cookCount: 2,
    });
    preferences.generate();
    await harness.fixture.whenStable();
    harness.detectChanges();
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/results');
    expect(state.topResults()).toHaveLength(3);
    const recipe = state.recipes()[0];
    const detail = await harness.navigateByUrl('/recipe/' + recipe.id, RecipeDetailPage);
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(detail.recipe()).toBe(recipe);
    expect(harness.routeNativeElement?.textContent).toContain('4 Portionen');
    expect(harness.routeNativeElement?.textContent).toContain('Pro Portion');
    expect(harness.routeNativeElement?.textContent).toContain('Gesamtrezept');
    expect(harness.routeNativeElement?.textContent).toContain('Person 2');
    expect(harness.routeNativeElement?.textContent).toContain('Zusätzlich benötigt');
    await harness.navigateByUrl('/cookbook');
    const cuisine = await harness.navigateByUrl('/cookbook/' + recipe.cuisine, CuisinePage);
    expect(cuisine.cuisine()).toBe(recipe.cuisine);
    const stored = await TestBed.inject(RECIPE_REPOSITORY).list({ cuisine: recipe.cuisine });
    state.deleteIngredient(state.ingredients()[0].id);
    expect(state.recipes()).toEqual([]);
    const libraryDetail = await harness.navigateByUrl(
      '/recipe/' + stored.items[1].id,
      RecipeDetailPage,
    );
    await harness.fixture.whenStable();
    expect(libraryDetail.recipe()).toBe(stored.items[1]);
    expect(harness.routeNativeElement?.textContent).toContain('Wasser');
    await harness.navigateByUrl('/impressum');
    expect(harness.routeNativeElement?.textContent).toContain('Platzhalter');
  });
  it.each(['/preferences', '/generating', '/results'])(
    'protects direct navigation to %s without state',
    async (url) => {
      await RouterTestingHarness.create(url);
      expect(TestBed.inject(Router).url).toBe('/generate');
    },
  );
  it('renders unknown recipe and cuisine states', async () => {
    const state = TestBed.inject(FlowState);
    state.saveIngredient({ name: 'Pasta', amount: 100, unit: 'g' });
    state.setPreferences({ difficulty: 'quick', cuisine: 'italian', diet: 'none' });
    await state.generate();
    const harness = await RouterTestingHarness.create('/recipe/missing');
    await harness.fixture.whenStable();
    expect(harness.routeNativeElement?.textContent).toContain('Rezept nicht gefunden');
    await harness.navigateByUrl('/cookbook/missing');
    expect(harness.routeNativeElement?.textContent).toContain('Cuisine nicht gefunden');
  });
  it('shows loading, controlled error and retry', async () => {
    let reject: ((reason: Error) => void) | undefined;
    const provider = TestBed.inject(GENERATION_PROVIDER);
    vi.spyOn(provider, 'generate').mockImplementationOnce(
      () =>
        new Promise((_resolve, fail) => {
          reject = fail;
        }),
    );
    const state = TestBed.inject(FlowState);
    state.saveIngredient({ name: 'Pasta', amount: 1, unit: 'g' });
    state.setPreferences({ difficulty: 'quick', cuisine: 'italian', diet: 'none' });
    const pending = state.generate();
    const harness = await RouterTestingHarness.create('/generating');
    expect(harness.routeNativeElement?.textContent).toContain('Generating...');
    reject?.(new Error('network'));
    await pending;
    harness.detectChanges();
    expect(harness.routeNativeElement?.querySelector('[role="alert"]')).toBeTruthy();
    const page = harness.routeDebugElement?.componentInstance as GeneratingPage;
    page.retry();
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/results');
  });
});
