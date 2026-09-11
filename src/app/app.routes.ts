import { Routes } from '@angular/router';
import { generationGuard, ingredientsGuard, recipesGuard } from './core/guards';
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./pages/landing').then((m) => m.LandingPage),
  },
  {
    path: 'generate',
    loadComponent: () => import('./pages/ingredients').then((m) => m.IngredientsPage),
  },
  {
    path: 'preferences',
    canActivate: [ingredientsGuard],
    loadComponent: () => import('./pages/preferences').then((m) => m.PreferencesPage),
  },
  {
    path: 'generating',
    canActivate: [generationGuard],
    loadComponent: () => import('./pages/generating').then((m) => m.GeneratingPage),
  },
  {
    path: 'results',
    canActivate: [recipesGuard],
    loadComponent: () => import('./pages/results').then((m) => m.ResultsPage),
  },
  {
    path: 'recipe/:id',
    loadComponent: () => import('./pages/recipe-detail').then((m) => m.RecipeDetailPage),
  },
  {
    path: 'cookbook',
    loadComponent: () => import('./pages/cookbook').then((m) => m.CookbookPage),
  },
  {
    path: 'cookbook/:cuisine',
    loadComponent: () => import('./pages/cuisine').then((m) => m.CuisinePage),
  },
  {
    path: 'impressum',
    loadComponent: () => import('./pages/impressum').then((m) => m.ImpressumPage),
  },
  { path: '**', redirectTo: '' },
];
