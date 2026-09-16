import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AppStateService } from '../services/app-state.service';

/**
 * Prevents preferences access without at least one stored ingredient.
 *
 * @returns {boolean|UrlTree} True when navigation is allowed; otherwise a redirect tree.
 */
export const ingredientsGuard: CanActivateFn = () =>
  inject(AppStateService).ingredients().length > 0 || inject(Router).parseUrl('/generate');

/**
 * Allows the loading page only for a started generation flow.
 *
 * @returns {boolean|UrlTree} True when navigation is allowed; otherwise a redirect tree.
 */
export const generationGuard: CanActivateFn = () => {
  const state = inject(AppStateService);
  const router = inject(Router);
  if (!state.ingredients().length) return router.parseUrl('/generate');
  if (!state.preferences() || state.status() === 'idle') return router.parseUrl('/preferences');
  return true;
};

/**
 * Protects results from direct access without current recipes.
 *
 * @returns {boolean|UrlTree} True when navigation is allowed; otherwise a redirect tree.
 */
export const recipesGuard: CanActivateFn = () => {
  const state = inject(AppStateService);
  const router = inject(Router);
  if (state.recipes().length) return true;
  if (state.status() === 'generating' || state.status() === 'error') return router.parseUrl('/generating');
  return router.parseUrl(state.ingredients().length ? '/preferences' : '/generate');
};
