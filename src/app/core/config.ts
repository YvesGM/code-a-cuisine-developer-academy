export const OPTIONS = {
  units: ['piece', 'ml', 'g'],
  difficulties: ['quick', 'medium', 'complex'],
  cuisines: ['german', 'italian', 'indian', 'japanese', 'gourmet', 'fusion'],
  diets: ['vegetarian', 'vegan', 'keto', 'none'],
} as const;
export const LIMITS = {
  generationRecipes: 3,
  libraryPageSize: 20,
  mockDelayMs: 800,
  servings: { min: 1, max: 12, default: 2 },
  cookCount: { min: 1, max: 3, default: 1 },
  ingredientCoverage: 0.7,
  additionalIngredients: 3,
} as const;
export const SCHEMA_VERSION = 2 as const;
export const N8N_PATHS = {
  generate: 'code-a-cuisine-generate',
  quota: 'code-a-cuisine-quota',
  library: 'code-a-cuisine-library',
  ingredients: 'code-a-cuisine-ingredients',
} as const;
export const DIFFICULTIES = {
  quick: {
    key: 'quick',
    label: 'Quick',
    range: 'up to 20min',
    min: 0,
    max: 20,
    mockMinutes: 15,
  },
  medium: {
    key: 'medium',
    label: 'Medium',
    range: '20–45min',
    min: 20,
    max: 45,
    mockMinutes: 30,
  },
  complex: {
    key: 'complex',
    label: 'Complex',
    range: 'over 45min',
    min: 45,
    max: Infinity,
    mockMinutes: 50,
  },
} as const;
export const CUISINE_LABELS = {
  german: 'German',
  italian: 'Italian',
  japanese: 'Japanese',
  indian: 'Indian',
  gourmet: 'Gourmet',
  fusion: 'Fusion',
} as const;
export const DIET_LABELS = {
  vegetarian: 'Vegetarian',
  vegan: 'Vegan',
  keto: 'Keto',
  none: 'No preferences',
} as const;
/** Kontrollierte Demo-Präsentation; keine Behauptung kulinarischer Authentizität. */
export const CUISINE_DEMO = {
  german: 'Die Komponenten nebeneinander anrichten.',
  italian: 'Die Komponenten vor dem Servieren zusammenführen.',
  japanese: 'Die Komponenten in getrennten kleinen Bereichen anrichten.',
  indian: 'Die Komponenten in einer gemeinsamen Schale servieren.',
  gourmet: 'Kleine Komponenten einzeln auf dem Teller anrichten.',
  fusion: 'Einen Teil gemischt und einen Teil separat anrichten.',
} as const;
