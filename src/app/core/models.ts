import { OPTIONS } from './config';
export type Unit = (typeof OPTIONS.units)[number];
export type Cuisine = (typeof OPTIONS.cuisines)[number];
export interface Ingredient {
  readonly id: string;
  readonly name: string;
  readonly amount: number;
  readonly unit: Unit;
}
export type IngredientInput = Omit<Ingredient, 'id'>;
export interface Preferences {
  readonly difficulty: (typeof OPTIONS.difficulties)[number];
  readonly cuisine: Cuisine;
  readonly diet: (typeof OPTIONS.diets)[number];
}
export interface GenerationRequest {
  readonly schemaVersion: 2;
  readonly clientRequestId: string;
  readonly ingredients: readonly Ingredient[];
  readonly preferences: Preferences;
  readonly servings: number;
  readonly cookCount: number;
}
export interface RecipeIngredient extends IngredientInput {
  readonly sourceIngredientId: string;
}
export type AdditionalIngredient = IngredientInput;
export interface MacroNutrient {
  readonly grams: number;
  readonly percent: number;
}
export interface NutritionValues {
  readonly energyKcal: number;
  readonly protein: MacroNutrient;
  readonly fat: MacroNutrient;
  readonly carbs: MacroNutrient;
}
export interface Nutrition {
  readonly perServing: NutritionValues;
  readonly total: NutritionValues;
}
export interface Direction {
  readonly step: number;
  readonly title: string;
  readonly instruction: string;
  readonly assignedCooks: readonly number[];
  readonly parallelGroup?: string;
  readonly waitingTimeMinutes?: number;
}
export interface Recipe extends Preferences {
  readonly id: string;
  readonly title: string;
  readonly cookingTimeMinutes: number;
  readonly servings: number;
  readonly cookCount: number;
  readonly nutrition: Nutrition;
  readonly ingredients: readonly RecipeIngredient[];
  readonly additionalIngredients: readonly AdditionalIngredient[];
  readonly directions: readonly Direction[];
  readonly rank: number;
}
export interface GenerationResponse {
  readonly schemaVersion: 2;
  readonly clientRequestId: string;
  readonly recipes: readonly Recipe[];
}
export interface RecipePage {
  readonly items: readonly Recipe[];
  readonly total: number;
  readonly page: number;
  readonly pages: number;
}
export interface RecipeQuery {
  readonly page?: number;
  readonly cuisine?: Cuisine;
}
