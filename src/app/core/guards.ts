import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { FlowState } from './flow-state';
/** Verhindert Preferences ohne mindestens einen gespeicherten Vorrat. */
export const ingredientsGuard: CanActivateFn = () =>
  inject(FlowState).ingredients().length > 0 || inject(Router).parseUrl('/generate');
/** Gibt nur einen tatsächlich gestarteten Generation-Flow frei. */
export const generationGuard: CanActivateFn = () => {
  const state = inject(FlowState);
  const router = inject(Router);
  if (!state.ingredients().length) return router.parseUrl('/generate');
  if (!state.preferences() || state.status() === 'idle') return router.parseUrl('/preferences');
  return true;
};
/** Schützt ausschließlich aktuelle Results; die öffentliche Bibliothek benötigt keinen Flow. */
export const recipesGuard: CanActivateFn = () => {
  const state = inject(FlowState);
  const router = inject(Router);
  if (state.recipes().length) return true;
  if (state.status() === 'generating' || state.status() === 'error')
    return router.parseUrl('/generating');
  return router.parseUrl(state.ingredients().length ? '/preferences' : '/generate');
};
