import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../app.routes';
import { createRequest } from '../core/business';
import { mockResponse } from '../core/generation';
import { RECIPE_REPOSITORY } from '../core/recipe-repository';
import { LibraryList } from '../shared/library-list';

describe('Public library UI', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideRouter(routes)] }));
  it.each(['/cookbook', '/cookbook/italian', '/recipe/missing', '/impressum'])(
    'opens %s without generation or account',
    async (url) => {
      const harness = await RouterTestingHarness.create(url);
      await harness.fixture.whenStable();
      expect(harness.routeNativeElement?.textContent).not.toContain('Deine Zutaten');
      expect(harness.routeNativeElement?.textContent?.trim()).toBeTruthy();
    },
  );
  it('shows pagination above 20, navigates forward/back and resets after a cuisine filter', async () => {
    const repository = TestBed.inject(RECIPE_REPOSITORY);
    const recipe = mockResponse(
      createRequest([{ id: 'pasta', name: 'Pasta', amount: 100, unit: 'g' }], {
        difficulty: 'quick',
        cuisine: 'italian',
        diet: 'none',
      }),
    ).recipes[0];
    await repository.saveMany(
      Array.from({ length: 25 }, (_, i) => ({
        ...recipe,
        id: 'r-' + i,
        cuisine: i < 22 ? 'italian' : 'german',
      })),
    );
    const fixture = TestBed.createComponent(LibraryList);
    await fixture.whenStable();
    expect(fixture.componentInstance.result()?.items).toHaveLength(20);
    const element = fixture.nativeElement as HTMLElement;
    const next = element.querySelectorAll('button')[1];
    next.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.result()?.page).toBe(2);
    expect(fixture.componentInstance.result()?.items).toHaveLength(5);
    element.querySelector('button')?.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.result()?.page).toBe(1);
    fixture.componentRef.setInput('cuisine', 'german');
    await fixture.whenStable();
    expect(fixture.componentInstance.result()?.total).toBe(3);
    expect(element.querySelector('nav')).toBeNull();
  });
  it('shows repository read errors and allows retry', async () => {
    const repository = TestBed.inject(RECIPE_REPOSITORY);
    vi.spyOn(repository, 'list').mockRejectedValueOnce(new Error('read failed'));
    const fixture = TestBed.createComponent(LibraryList);
    await fixture.whenStable();
    expect(fixture.componentInstance.error()).toBeTruthy();
    fixture.componentInstance.reload();
    await fixture.whenStable();
    expect(fixture.componentInstance.error()).toBe('');
    expect(fixture.componentInstance.result()?.total).toBe(0);
    vi.spyOn(repository, 'getById').mockRejectedValueOnce(new Error('lookup failed'));
    const harness = await RouterTestingHarness.create('/recipe/missing');
    await harness.fixture.whenStable();
    expect(harness.routeNativeElement?.querySelector('[role="alert"]')).toBeTruthy();
  });
});
