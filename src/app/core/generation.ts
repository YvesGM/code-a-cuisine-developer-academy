import { inject, Injectable, InjectionToken } from '@angular/core';
import { CUISINE_DEMO, CUISINE_LABELS, DIFFICULTIES, LIMITS, SCHEMA_VERSION } from './config';
import { Direction, GenerationRequest, GenerationResponse, Nutrition, Recipe } from './models';
import { validateResponse } from './response-validation';
export interface GenerationProvider {
  /** Liefert untrusted Daten; erst GenerationService darf diese als Rezepte übernehmen. */
  generate(request: GenerationRequest): Promise<unknown>;
}
const variants = [
  {
    title: 'Pfannenvariante',
    instruction: 'Die vorbereiteten Zutaten portionsweise in einer Pfanne verarbeiten.',
  },
  {
    title: 'Gedämpfte Variante',
    instruction: 'Die vorbereiteten Zutaten getrennt dämpfen und anschließend zusammen anrichten.',
  },
  {
    title: 'Ofenvariante',
    instruction: 'Die vorbereiteten Zutaten in einer Ofenform gemeinsam verarbeiten.',
  },
] as const;
/** Erzeugt ausdrücklich synthetische Nährwerte; Prozent meint den Anteil an Demo-Makroenergie. */
function mockNutrition(servings: number): Nutrition {
  const perServing = {
    energyKcal: 400,
    protein: { grams: 20, percent: 20 },
    carbs: { grams: 50, percent: 50 },
    fat: { grams: 40 / 3, percent: 30 },
  };
  return {
    perServing,
    total: {
      energyKcal: perServing.energyKcal * servings,
      protein: { grams: perServing.protein.grams * servings, percent: perServing.protein.percent },
      carbs: { grams: perServing.carbs.grams * servings, percent: perServing.carbs.percent },
      fat: { grams: perServing.fat.grams * servings, percent: perServing.fat.percent },
    },
  };
}
/** Verteilt unabhängige Vorbereitungen auf verfügbare Personen; danach folgt die Zubereitung. */
function mockDirections(
  request: GenerationRequest,
  variant: (typeof variants)[number],
): Direction[] {
  const tasks = [
    'Zutaten vorbereiten',
    'Arbeitsfläche und Geräte vorbereiten',
    'Anrichten vorbereiten',
  ];
  const preparation: Direction[] = Array.from({ length: request.cookCount }, (_, index) => ({
    step: index + 1,
    title: tasks[index],
    instruction:
      index === 0
        ? 'Vorhandene Zutaten prüfen: ' + request.ingredients.map((i) => i.name).join(', ') + '.'
        : 'Den eigenen Arbeitsbereich für die anschließende gemeinsame Zubereitung vorbereiten.',
    assignedCooks: [index + 1],
    ...(request.cookCount > 1 ? { parallelGroup: 'vorbereitung' } : {}),
  }));
  return [
    ...preparation,
    {
      step: preparation.length + 1,
      title: variant.title,
      instruction:
        variant.instruction +
        ' ' +
        CUISINE_DEMO[request.preferences.cuisine] +
        ' Technische Demo, keine geprüfte Kochanleitung.',
      assignedCooks: [1],
      waitingTimeMinutes: 5,
    },
  ];
}
/** Liefert exakt drei verschiedene Demo-Verfahren mit 100 % Zutatenabdeckung und Request-Preferences. */
export function mockResponse(request: GenerationRequest): GenerationResponse {
  const recipes: Recipe[] = variants.map((variant, index) => ({
    id: request.clientRequestId + '-' + index,
    title: CUISINE_LABELS[request.preferences.cuisine] + ': ' + variant.title,
    ...request.preferences,
    servings: request.servings,
    cookCount: request.cookCount,
    rank: index + 1,
    cookingTimeMinutes: DIFFICULTIES[request.preferences.difficulty].mockMinutes + index,
    nutrition: mockNutrition(request.servings),
    ingredients: request.ingredients.map((i) => ({
      sourceIngredientId: i.id,
      name: i.name,
      amount: i.amount * (request.servings / LIMITS.servings.max),
      unit: i.unit,
    })),
    additionalIngredients:
      index === 0
        ? []
        : [
            {
              name: index === 1 ? 'Wasser' : 'Öl',
              amount: (index === 1 ? 50 : 5) * request.servings,
              unit: 'ml',
            },
          ],
    directions: mockDirections(request, variant),
  }));
  return { schemaVersion: SCHEMA_VERSION, clientRequestId: request.clientRequestId, recipes };
}
@Injectable({ providedIn: 'root' })
export class MockGenerationProvider implements GenerationProvider {
  /** Simuliert Latenz, ohne Zufallsdaten oder Netzwerkzugriff. */
  async generate(request: GenerationRequest): Promise<unknown> {
    await new Promise<void>((resolve) => setTimeout(resolve, LIMITS.mockDelayMs));
    return mockResponse(request);
  }
}
export const GENERATION_PROVIDER = new InjectionToken<GenerationProvider>('GENERATION_PROVIDER', {
  providedIn: 'root',
  factory: () => inject(MockGenerationProvider),
});
@Injectable({ providedIn: 'root' })
export class GenerationService {
  private readonly provider = inject(GENERATION_PROVIDER);
  /** Validiert jeden Provider einschließlich Mock; ungültige Antworten werden vollständig verworfen. */
  async generate(request: GenerationRequest): Promise<GenerationResponse> {
    return validateResponse(await this.provider.generate(request), request);
  }
}
