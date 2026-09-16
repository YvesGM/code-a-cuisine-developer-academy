import { Cuisine } from '../models/app.models';

/** Local Figma category images; no images of individual generated recipes. */
export const CUISINE_ASSETS = {
  german: 'assets/img/german-cuisine.png',
  italian: 'assets/img/italian-cuisine.png',
  japanese: 'assets/img/japanese-cuisine.png',
  indian: 'assets/img/india-cuisine.png',
  gourmet: 'assets/img/gourmet-cuisine.png',
  fusion: 'assets/img/fusion-cuisine.png',
} as const satisfies Record<Cuisine, string>;

/** Wide Figma banners for the individual cuisine list view. */
export const CUISINE_BANNERS = {
  german: 'assets/img/german-cuisine-banner.png',
  italian: 'assets/img/italian-cuisine-banner.png',
  japanese: 'assets/img/japanese-cuisine-banner.png',
  indian: 'assets/img/indian-cuisine-banner.png',
  gourmet: 'assets/img/gourmet-cuisine-banner.png',
  fusion: 'assets/img/fusion-cuisine-banner.png',
} as const satisfies Record<Cuisine, string>;

/** Mobile Figma banners for the individual cuisine list view. */
export const CUISINE_MOBILE_BANNERS = {
  german: 'assets/img/german-cuisine-banner-mobile.png',
  italian: 'assets/img/italian-cuisine-banner-mobile.png',
  japanese: 'assets/img/japanese-cuisine-banner-mobile.png',
  indian: 'assets/img/indian-cuisine-banner-mobile.png',
  gourmet: 'assets/img/gourmet-cuisine-banner-mobile.png',
  fusion: 'assets/img/fusion-cuisine-banner-mobile.png',
} as const satisfies Record<Cuisine, string>;

/** Small Figma category icons for cookbook headings. */
export const CUISINE_COOKBOOK_ICONS = {
  german: 'assets/img/german-cookbook.png',
  italian: 'assets/img/italian-cookbook.png',
  japanese: 'assets/img/japanese-cookbook.png',
  indian: 'assets/img/indian-cookbook.png',
  gourmet: 'assets/img/gourmet-cookbook.png',
  fusion: 'assets/img/fusion-cookbook.png',
} as const satisfies Record<Cuisine, string>;
