export const OPTIONS = {
  units: ['g', 'kg', 'ml', 'l', 'piece'],
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
export const DIFFICULTIES = {
  quick: {
    key: 'quick',
    label: 'Schnell',
    range: 'bis 20 Minuten',
    min: 0,
    max: 20,
    mockMinutes: 15,
  },
  medium: {
    key: 'medium',
    label: 'Mittel',
    range: '20–45 Minuten',
    min: 20,
    max: 45,
    mockMinutes: 30,
  },
  complex: {
    key: 'complex',
    label: 'Aufwendig',
    range: 'ab 45 Minuten',
    min: 45,
    max: Infinity,
    mockMinutes: 50,
  },
} as const;
export const CUISINE_LABELS = {
  german: 'Deutsche Küche',
  italian: 'Italienische Küche',
  japanese: 'Japanische Küche',
  indian: 'Indische Küche',
  gourmet: 'Gourmet / Fine Dining',
  fusion: 'Fusion',
} as const;
export const DIET_LABELS = {
  vegetarian: 'Vegetarisch',
  vegan: 'Vegan',
  keto: 'Keto',
  none: 'Keine Einschränkung',
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
