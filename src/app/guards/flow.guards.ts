import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AppStateService } from '../services/app-state.service';

/**
 * Protects the preferences page from direct access without ingredient input.
 * Missing ingredients redirect to `/generate`, where the recipe flow starts.
 * @returns {boolean|UrlTree} True for valid flow state, otherwise the redirect target.
 */
export const ingredientsGuard: CanActivateFn = () =>
  inject(AppStateService).ingredients().length > 0 || inject(Router).parseUrl('/generate');

/**
 * Allows the generation page only after ingredients and preferences are available.
 * Missing ingredients return to `/generate`; missing preferences return to `/preferences`.
 * @returns {boolean|UrlTree} True while generation may be shown, otherwise the required previous step.
 */
export const generationGuard: CanActivateFn = () => {
  const state = inject(AppStateService);
  const router = inject(Router);
  if (!state.ingredients().length) return router.parseUrl('/generate');
  if (!state.preferences() || state.status() === 'idle') return router.parseUrl('/preferences');
  return true;
};

/**
 * Prevents direct results access until recipes exist in the current application state.
 * Active or failed generation returns to `/generating`; incomplete input returns to the last valid form step.
 * @returns {boolean|UrlTree} True when recipes exist, otherwise the route that can restore a valid flow.
 */
export const recipesGuard: CanActivateFn = () => {
  const state = inject(AppStateService);
  const router = inject(Router);
  if (state.recipes().length) return true;
  if (state.status() === 'generating' || state.status() === 'error') return router.parseUrl('/generating');
  return router.parseUrl(state.ingredients().length ? '/preferences' : '/generate');
};
