export const OPTIONS = {
  units: ['piece', 'ml', 'g'],
  difficulties: ['quick', 'medium', 'complex'],
  cuisines: ['german', 'italian', 'indian', 'japanese', 'gourmet', 'fusion'],
  diets: ['vegetarian', 'vegan', 'keto', 'none'],
} as const;

export const LIMITS = {
  generationRecipes: 3,
  libraryPageSize: 20,
  servings: { min: 1, max: 12, default: 2 },
  cookCount: { min: 1, max: 3, default: 1 },
} as const;

export const N8N_PATHS = {
  generate: 'code-a-cuisine-generate',
  quota: 'code-a-cuisine-quota',
  library: 'code-a-cuisine-library',
  favorite: 'code-a-cuisine-favorite',
  ingredients: 'code-a-cuisine-ingredients',
} as const;

export const DIFFICULTIES = {
  quick: { key: 'quick', label: 'Quick', range: 'up to 20min' },
  medium: { key: 'medium', label: 'Medium', range: '20–45min' },
  complex: { key: 'complex', label: 'Complex', range: 'over 45min' },
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
