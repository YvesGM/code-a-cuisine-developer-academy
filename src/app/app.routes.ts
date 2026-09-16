import { Routes } from '@angular/router';
import { generationGuard, ingredientsGuard, recipesGuard } from './guards/flow.guards';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./components/landing/landing').then((m) => m.LandingComponent),
  },
  {
    path: 'generate',
    loadComponent: () => import('./components/ingredients/ingredients').then((m) => m.IngredientsComponent),
  },
  {
    path: 'preferences',
    canActivate: [ingredientsGuard],
    loadComponent: () => import('./components/preferences/preferences').then((m) => m.PreferencesComponent),
  },
  {
    path: 'generating',
    canActivate: [generationGuard],
    loadComponent: () => import('./components/generating/generating').then((m) => m.GeneratingComponent),
  },
  {
    path: 'results',
    canActivate: [recipesGuard],
    loadComponent: () => import('./components/results/results').then((m) => m.ResultsComponent),
  },
  {
    path: 'recipe/:id',
    loadComponent: () => import('./components/recipe-detail/recipe-detail').then((m) => m.RecipeDetailComponent),
  },
  {
    path: 'cookbook',
    loadComponent: () => import('./components/cookbook/cookbook').then((m) => m.CookbookComponent),
  },
  {
    path: 'cookbook/:cuisine',
    loadComponent: () => import('./components/cuisine/cuisine').then((m) => m.CuisineComponent),
  },
  {
    path: 'legal-notice',
    loadComponent: () => import('./components/legal-notice/legal-notice').then((m) => m.LegalNoticeComponent),
  },
  { path: '**', redirectTo: '' },
];
