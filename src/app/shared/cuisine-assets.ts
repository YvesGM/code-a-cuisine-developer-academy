import { Cuisine } from '../core/models';

/** Lokale Figma-Kategoriebilder; keine Bilder einzelner generierter Rezepte. */
export const CUISINE_ASSETS = {
  german: 'assets/img/german-cuisine.png',
  italian: 'assets/img/italia-cuisine.png',
  japanese: 'assets/img/japanese-cuisine.png',
  indian: 'assets/img/india-cuisine.png',
  gourmet: 'assets/img/gourmet-cuisine.png',
  fusion: 'assets/img/fusion-cuisine.png',
} as const satisfies Record<Cuisine, string>;
