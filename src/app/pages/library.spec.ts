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
    const next = element.querySelector<HTMLButtonElement>('button[aria-label="Next page"]');
    next?.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.result()?.page).toBe(2);
    expect(fixture.componentInstance.result()?.items).toHaveLength(5);
    element.querySelector<HTMLButtonElement>('button[aria-label="Previous page"]')?.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.result()?.page).toBe(1);
    fixture.componentRef.setInput('cuisine', 'german');
    await fixture.whenStable();
    expect(fixture.componentInstance.result()?.total).toBe(3);
    expect(element.querySelector('nav')?.textContent).toContain('1');
  });

  it('centers the active page inside the three-page pagination window', async () => {
    const fixture = TestBed.createComponent(LibraryList);
    const recipe = mockResponse(
      createRequest([{ id: 'rice', name: 'Rice', amount: 100, unit: 'g' }], {
        difficulty: 'quick',
        cuisine: 'fusion',
        diet: 'none',
      }),
    ).recipes[0];
    fixture.componentInstance.result.set({ items: [recipe], total: 160, page: 4, pages: 8 });
    expect(fixture.componentInstance.visiblePages()).toEqual([3, 4, 5]);
    fixture.componentInstance.result.set({ items: [recipe], total: 160, page: 8, pages: 8 });
    expect(fixture.componentInstance.visiblePages()).toEqual([6, 7, 8]);
  });

  it('returns at most six favorited recipes ordered by favorite count in development', async () => {
    const repository = TestBed.inject(RECIPE_REPOSITORY);
    const recipe = mockResponse(
      createRequest([{ id: 'rice', name: 'Rice', amount: 100, unit: 'g' }], {
        difficulty: 'quick',
        cuisine: 'fusion',
        diet: 'none',
      }),
    ).recipes[0];
    await repository.saveMany(
      Array.from({ length: 8 }, (_, index) => ({
        ...recipe,
        id: `liked-${index}`,
        favoriteCount: index,
      })),
    );
    const result = await repository.list();
    expect(result.topLiked).toHaveLength(6);
    expect(result.topLiked?.map((item) => item.favoriteCount)).toEqual([7, 6, 5, 4, 3, 2]);
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
