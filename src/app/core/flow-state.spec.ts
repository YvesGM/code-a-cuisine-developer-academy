import { TestBed } from '@angular/core/testing';
import { FlowState } from './flow-state';
import { GENERATION_PROVIDER, mockResponse } from './generation';
import { GenerationRequest, Preferences } from './models';
import { RECIPE_REPOSITORY } from './recipe-repository';
const preferences: Preferences = { difficulty: 'quick', cuisine: 'italian', diet: 'none' };
describe('FlowState', () => {
  let state: FlowState;
  const generate = vi.fn<(request: GenerationRequest) => Promise<unknown>>();
  beforeEach(() => {
    generate.mockReset();
    generate.mockImplementation(async (request) => mockResponse(request));
    TestBed.configureTestingModule({
      providers: [{ provide: GENERATION_PROVIDER, useValue: { generate } }],
    });
    state = TestBed.inject(FlowState);
  });
  /** Bereitet gültige Vorräte und Preferences für die Workflow-Tests vor. */
  function prepare(): void {
    state.saveIngredient({ name: 'Pasta', amount: 100, unit: 'g' });
    state.setPreferences(preferences);
  }
  it('adds, edits with stable ID, and deletes ingredients', () => {
    state.saveIngredient({ name: ' Pasta ', amount: 100, unit: 'g' });
    const id = state.ingredients()[0].id;
    state.saveIngredient({ name: 'Pasta', amount: 80, unit: 'g' }, id);
    expect(state.ingredients()[0]).toEqual({ id, name: 'Pasta', amount: 80, unit: 'g' });
    state.saveIngredient({ name: 'Egg', amount: 2, unit: 'piece' });
    expect(state.ingredients()[0].id).not.toBe(id);
    state.deleteIngredient(id);
    expect(state.ingredients()).toHaveLength(1);
  });
  it('rejects invalid input and unknown edits', () => {
    expect(() => state.saveIngredient({ name: '', amount: 1, unit: 'g' })).toThrow();
    expect(() =>
      state.saveIngredient({ name: 'Pasta', amount: 1, unit: 'g' }, 'unknown'),
    ).toThrow();
    expect(state.ingredients()).toEqual([]);
  });
  it('owns preferences independently of a form draft', () => {
    state.setPreferences(preferences);
    expect(state.preferences()).toEqual(preferences);
    expect(state.preferences()).not.toBe(preferences);
  });
  it('protects generation with missing inputs', async () => {
    await state.generate();
    expect(state.status()).toBe('error');
    expect(generate).not.toHaveBeenCalled();
  });
  it('generates once and exposes the validated recipes', async () => {
    prepare();
    const operation = state.generate();
    expect(state.status()).toBe('generating');
    await state.generate();
    await operation;
    expect(generate).toHaveBeenCalledTimes(1);
    expect(state.status()).toBe('success');
    expect(state.requestId()).toBe(generate.mock.calls[0][0].clientRequestId);
    expect(state.recipes()).toHaveLength(3);
  });
  it('clears obsolete results on input changes', async () => {
    prepare();
    await state.generate();
    state.setPreferences({ ...preferences, diet: 'vegan' });
    expect(state.recipes()).toEqual([]);
    expect(state.requestId()).toBeNull();
    expect(state.status()).toBe('idle');
  });
  it('discards late responses after input edits', async () => {
    let finish: ((value: unknown) => void) | undefined;
    generate.mockImplementation(
      (request) =>
        new Promise((resolve) => {
          finish = () => resolve(mockResponse(request));
        }),
    );
    prepare();
    const operation = state.generate();
    state.deleteIngredient(state.ingredients()[0].id);
    finish?.(null);
    await operation;
    expect(state.status()).toBe('idle');
    expect(state.recipes()).toEqual([]);
  });
  it('handles rejected and invalid responses, then retries with a new ID', async () => {
    prepare();
    generate.mockRejectedValueOnce(new Error('network'));
    await state.generate();
    const previous = state.requestId();
    expect(state.status()).toBe('error');
    expect(state.error()).toBeTruthy();
    generate.mockResolvedValueOnce({});
    await state.generate();
    expect(state.status()).toBe('error');
    await state.generate();
    expect(state.status()).toBe('success');
    expect(state.requestId()).not.toBe(previous);
    expect(state.error()).toBeNull();
  });

  it('does not write recipes a second time when n8n reports server-side persistence', async () => {
    prepare();
    const repository = TestBed.inject(RECIPE_REPOSITORY);
    const save = vi.spyOn(repository, 'saveMany');
    generate.mockImplementationOnce(async (request) => ({
      ...mockResponse(request),
      persisted: true,
    }));
    await state.generate();
    expect(state.status()).toBe('success');
    expect(state.recipes()).toHaveLength(3);
    expect(save).not.toHaveBeenCalled();
  });
  it('does not save invalid provider data or announce success on repository failure', async () => {
    prepare();
    const repository = TestBed.inject(RECIPE_REPOSITORY);
    const save = vi.spyOn(repository, 'saveMany');
    generate.mockResolvedValueOnce({});
    await state.generate();
    expect(save).not.toHaveBeenCalled();
    save.mockRejectedValueOnce(new Error('write failed'));
    await state.generate();
    expect(state.status()).toBe('error');
    expect(state.recipes()).toEqual([]);
    expect((await repository.list()).total).toBe(0);
  });
});
