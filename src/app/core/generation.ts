import { inject, Injectable, InjectionToken, isDevMode } from '@angular/core';
import { N8N_PUBLIC_CONFIG } from '../../environments/runtime-config';
import {
  CUISINE_DEMO,
  CUISINE_LABELS,
  DIFFICULTIES,
  LIMITS,
  N8N_PATHS,
  SCHEMA_VERSION,
} from './config';
import {
  AdditionalIngredient,
  Direction,
  GenerationRequest,
  GenerationResponse,
  Nutrition,
  NutritionValues,
  Recipe,
  RecipeIngredient,
} from './models';
import { validateResponse } from './response-validation';

export interface GenerationProvider {
  /** Liefert untrusted Daten; erst GenerationService darf diese als Rezepte übernehmen. */
  generate(request: GenerationRequest): Promise<unknown>;
}

type MockVariant = { readonly title: string; readonly instruction: string };
type MockRecipeBase = Pick<
  Recipe,
  | 'id'
  | 'title'
  | 'cuisine'
  | 'difficulty'
  | 'diet'
  | 'servings'
  | 'cookCount'
  | 'rank'
  | 'cookingTimeMinutes'
>;
type MockRecipeSeed = { request: GenerationRequest; variant: MockVariant; index: number };

const variants: readonly MockVariant[] = [
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
];

const preparationTitles = [
  'Zutaten vorbereiten',
  'Arbeitsfläche und Geräte vorbereiten',
  'Anrichten vorbereiten',
] as const;

/** Skaliert einen synthetischen Portionswert mathematisch auf das Gesamtrezept. */
function totalNutrition(perServing: NutritionValues, servings: number): NutritionValues {
  return {
    energyKcal: perServing.energyKcal * servings,
    protein: { grams: perServing.protein.grams * servings, percent: perServing.protein.percent },
    carbs: { grams: perServing.carbs.grams * servings, percent: perServing.carbs.percent },
    fat: { grams: perServing.fat.grams * servings, percent: perServing.fat.percent },
  };
}

/** Erzeugt ausdrücklich synthetische Nährwerte; Prozent meint den Anteil an Demo-Makroenergie. */
function mockNutrition(servings: number): Nutrition {
  const perServing: NutritionValues = {
    energyKcal: 400,
    protein: { grams: 20, percent: 20 },
    carbs: { grams: 50, percent: 50 },
    fat: { grams: 40 / 3, percent: 30 },
  };
  return { perServing, total: totalNutrition(perServing, servings) };
}

/** Formuliert die Demo-Anweisung für genau einen Vorbereitungsschritt. */
function preparationInstruction(request: GenerationRequest, index: number): string {
  if (index !== 0) {
    return 'Den eigenen Arbeitsbereich für die anschließende gemeinsame Zubereitung vorbereiten.';
  }
  const ingredients = request.ingredients.map((ingredient) => ingredient.name).join(', ');
  return `Vorhandene Zutaten prüfen: ${ingredients}.`;
}

/** Erstellt genau eine unabhängige Vorbereitungsaufgabe für einen verfügbaren Koch. */
function preparationDirection(request: GenerationRequest, index: number): Direction {
  return {
    step: index + 1,
    title: preparationTitles[index],
    instruction: preparationInstruction(request, index),
    assignedCooks: [index + 1],
    ...(request.cookCount > 1 ? { parallelGroup: 'vorbereitung' } : {}),
  };
}

/** Erstellt den gemeinsamen abschließenden Demo-Schritt nach allen Vorbereitungen. */
function finalDirection(request: GenerationRequest, variant: MockVariant): Direction {
  const cuisine = CUISINE_DEMO[request.preferences.cuisine];
  return {
    step: request.cookCount + 1,
    title: variant.title,
    instruction: `${variant.instruction} ${cuisine} Technische Demo, keine geprüfte Kochanleitung.`,
    assignedCooks: [1],
    waitingTimeMinutes: 5,
  };
}

/** Verteilt unabhängige Vorbereitungen auf verfügbare Personen; danach folgt die Zubereitung. */
function mockDirections(request: GenerationRequest, variant: MockVariant): Direction[] {
  const preparation = Array.from({ length: request.cookCount }, (_, index) =>
    preparationDirection(request, index),
  );
  return [...preparation, finalDirection(request, variant)];
}

/** Skaliert Demo-Mengen linear, ohne den angegebenen Vorrat zu überschreiten. */
function mockIngredients(request: GenerationRequest): RecipeIngredient[] {
  const factor = request.servings / LIMITS.servings.max;
  return request.ingredients.map((ingredient) => ({
    sourceIngredientId: ingredient.id,
    name: ingredient.name,
    amount: ingredient.amount * factor,
    unit: ingredient.unit,
  }));
}

/** Fügt je Demo-Variante höchstens eine klar getrennte Basiszutat hinzu. */
function mockAdditional(index: number, servings: number): AdditionalIngredient[] {
  if (index === 0) return [];
  const water = { name: 'Wasser', amount: 50 * servings, unit: 'ml' as const };
  const oil = { name: 'Öl', amount: 5 * servings, unit: 'ml' as const };
  return [index === 1 ? water : oil];
}

/** Liefert die Demo-Kochzeit passend zur gewählten Komplexität und Variante. */
function mockCookingTime(request: GenerationRequest, index: number): number {
  return DIFFICULTIES[request.preferences.difficulty].mockMinutes + index;
}

/** Baut die stabilen Identitäts- und Preference-Felder einer Demo-Recipe. */
function mockRecipeBase({ request, variant, index }: MockRecipeSeed): MockRecipeBase {
  return {
    id: `${request.clientRequestId}-${index}`,
    title: `${CUISINE_LABELS[request.preferences.cuisine]}: ${variant.title}`,
    ...request.preferences,
    servings: request.servings,
    cookCount: request.cookCount,
    rank: index + 1,
    cookingTimeMinutes: mockCookingTime(request, index),
  };
}

/** Baut genau ein deterministisches Demo-Rezept aus dem finalen Request-Vertrag. */
function mockRecipe(request: GenerationRequest, variant: MockVariant, index: number): Recipe {
  return {
    ...mockRecipeBase({ request, variant, index }),
    nutrition: mockNutrition(request.servings),
    ingredients: mockIngredients(request),
    additionalIngredients: mockAdditional(index, request.servings),
    directions: mockDirections(request, variant),
  };
}

/** Liefert exakt drei verschiedene Demo-Verfahren mit 100 % Zutatenabdeckung und Request-Preferences. */
export function mockResponse(request: GenerationRequest): GenerationResponse {
  const recipes = variants.map((variant, index) => mockRecipe(request, variant, index));
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

/** Fehlervertrag eines n8n-Webhooks, der als verständliche UI-Meldung weitergegeben werden darf. */
export class GenerationProviderError extends Error {
  /** Initialisiert einen UI-sicheren Providerfehler mit stabilem Code und HTTP-Status. */
  constructor(
    message: string,
    readonly code: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'GenerationProviderError';
  }
}

/** Baut einen stabilen Production-Webhook-Pfad aus der nicht geheimen Runtime-Basis-URL. */
function n8nWebhookUrl(path: string): string {
  return `${N8N_PUBLIC_CONFIG.webhookBaseUrl}/${path}`;
}

/** Liefert die sichere Standardmeldung eines fehlgeschlagenen n8n-Aufrufs. */
function fallbackProviderError(status: number): GenerationProviderError {
  return new GenerationProviderError(
    'Die Rezeptgenerierung ist aktuell nicht verfügbar. Bitte später erneut versuchen.',
    'generation_failed',
    status,
  );
}

/** Extrahiert nur den kontrollierten Fehlervertrag aus einem beliebigen JSON-Body. */
function providerErrorFromBody(body: unknown, status: number): GenerationProviderError | null {
  if (!body || typeof body !== 'object' || Array.isArray(body) || !('error' in body)) return null;
  const error = (body as { error?: unknown }).error;
  if (!error || typeof error !== 'object' || Array.isArray(error)) return null;
  const candidate = error as { code?: unknown; message?: unknown };
  if (typeof candidate.code !== 'string' || typeof candidate.message !== 'string') return null;
  if (!candidate.code.trim() || !candidate.message.trim()) return null;
  return new GenerationProviderError(candidate.message, candidate.code, status);
}

/** Extrahiert den kontrollierten Fehlervertrag, ohne beliebige Backend-Antworten in der UI auszugeben. */
async function providerError(response: Response): Promise<GenerationProviderError> {
  const fallback = fallbackProviderError(response.status);
  try {
    return providerErrorFromBody((await response.json()) as unknown, response.status) ?? fallback;
  } catch {
    return fallback;
  }
}

@Injectable({ providedIn: 'root' })
export class N8nGenerationProvider implements GenerationProvider {
  /** Sendet ausschließlich den versionierten GenerationRequest an den produktiven n8n-Webhook. */
  async generate(request: GenerationRequest): Promise<unknown> {
    const response = await fetch(n8nWebhookUrl(N8N_PATHS.generate), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw await providerError(response);
    return (await response.json()) as unknown;
  }
}

@Injectable({ providedIn: 'root' })
export class UnavailableGenerationProvider implements GenerationProvider {
  /** Verhindert in einer deployten App einen stillen Rückfall auf Demo-Rezepte ohne n8n. */
  async generate(_request: GenerationRequest): Promise<unknown> {
    throw new GenerationProviderError(
      'Der Rezept-Workflow ist noch nicht mit n8n verbunden.',
      'n8n_not_configured',
      503,
    );
  }
}

/** Wählt genau einen Provider; produktive Deployments erhalten niemals stillschweigend Mock-Daten. */
function generationProviderFactory(): GenerationProvider {
  if (N8N_PUBLIC_CONFIG.webhookBaseUrl) return inject(N8nGenerationProvider);
  if (isDevMode()) return inject(MockGenerationProvider);
  return inject(UnavailableGenerationProvider);
}

export const GENERATION_PROVIDER = new InjectionToken<GenerationProvider>('GENERATION_PROVIDER', {
  providedIn: 'root',
  factory: generationProviderFactory,
});

@Injectable({ providedIn: 'root' })
export class GenerationService {
  private readonly provider = inject(GENERATION_PROVIDER);

  /** Validiert jeden Provider einschließlich Mock; ungültige Antworten werden vollständig verworfen. */
  async generate(request: GenerationRequest): Promise<GenerationResponse> {
    return validateResponse(await this.provider.generate(request), request);
  }
}
