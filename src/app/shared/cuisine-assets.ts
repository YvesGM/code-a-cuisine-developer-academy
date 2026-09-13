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

/** Kleine Figma-Kategorieicons für die Cookbook-Überschriften. */
export const CUISINE_COOKBOOK_ICONS = {
  german: 'assets/img/german-cookbook.png',
  italian: 'assets/img/italian-cookbook.png',
  japanese: 'assets/img/japanese-cookbook.png',
  indian: 'assets/img/indian-cookbook.png',
  gourmet: 'assets/img/gourmet-cookbook.png',
  fusion: 'assets/img/fusion-cookbook.png',
} as const satisfies Record<Cuisine, string>;
