import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AppStateService } from '../services/app-state.service';

/** Verhindert Preferences ohne mindestens eine gespeicherte Zutat. */
export const ingredientsGuard: CanActivateFn = () =>
  inject(AppStateService).ingredients().length > 0 || inject(Router).parseUrl('/generate');

/** Gibt die Loading-Seite nur für einen gestarteten Generierungsflow frei. */
export const generationGuard: CanActivateFn = () => {
  const state = inject(AppStateService);
  const router = inject(Router);
  if (!state.ingredients().length) return router.parseUrl('/generate');
  if (!state.preferences() || state.status() === 'idle') return router.parseUrl('/preferences');
  return true;
};

/** Schützt Results vor direktem Aufruf ohne aktuelle Rezepte. */
export const recipesGuard: CanActivateFn = () => {
  const state = inject(AppStateService);
  const router = inject(Router);
  if (state.recipes().length) return true;
  if (state.status() === 'generating' || state.status() === 'error') return router.parseUrl('/generating');
  return router.parseUrl(state.ingredients().length ? '/preferences' : '/generate');
};
