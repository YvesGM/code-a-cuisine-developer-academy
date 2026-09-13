import { Injectable, signal } from '@angular/core';
import { N8N_PUBLIC_CONFIG } from '../../environments/runtime-config';
import { N8N_PATHS } from './config';
import { IngredientCatalogItem } from './models';

type JsonRecord = Record<string, unknown>;

/** Baut den öffentlichen Ingredient-Catalog-Endpunkt aus der Runtime-Basis. */
function catalogEndpoint(): string {
  return `${N8N_PUBLIC_CONFIG.webhookBaseUrl}/${N8N_PATHS.ingredients}`;
}

/** Erzwingt ein JSON-Objekt für externe Catalog-Antworten. */
function asRecord(value: unknown): JsonRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Ungültige Ingredient-Catalog-Antwort.');
  }
  return value as JsonRecord;
}

/** Prüft genau einen Catalog-Eintrag aus der n8n-Antwort. */
function parseCatalogItem(value: unknown): IngredientCatalogItem {
  const row = asRecord(value);
  if (typeof row['name'] !== 'string' || !row['name'].trim()) {
    throw new Error('Ungültiger Ingredient-Name.');
  }
  if (typeof row['usageCount'] !== 'number' || !Number.isInteger(row['usageCount'])) {
    throw new Error('Ungültiger Ingredient-Zähler.');
  }
  if (row['usageCount'] < 0) throw new Error('Ungültiger Ingredient-Zähler.');
  return { name: row['name'].trim(), usageCount: row['usageCount'] };
}

/** Prüft den vollständigen, bereits nach Nutzung sortierten Catalog. */
function parseCatalog(value: unknown): readonly IngredientCatalogItem[] {
  const row = asRecord(value);
  if (!Array.isArray(row['items'])) throw new Error('Ungültige Ingredient-Catalog-Antwort.');
  return row['items'].map((item) => parseCatalogItem(item));
}

/** Prüft die Antwort einer atomaren Ingredient-Registrierung. */
function parseRegisteredItem(value: unknown): IngredientCatalogItem {
  const row = asRecord(value);
  return parseCatalogItem(row['item']);
}

/** Wirft einen kontrollierten Fehler für fehlgeschlagene Catalog-Aufrufe. */
async function requireOk(response: Response): Promise<void> {
  if (!response.ok) throw new Error(`Ingredient Catalog API fehlgeschlagen (${response.status}).`);
}

/** Sendet genau eine Catalog-Aktion an n8n; Browser-Credentials werden nicht benötigt. */
async function catalogRequest(body: JsonRecord): Promise<unknown> {
  const response = await fetch(catalogEndpoint(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  await requireOk(response);
  return (await response.json()) as unknown;
}

/** Sortiert nach realer Nutzung; die bestehende Reihenfolge entscheidet Gleichstände stabil. */
function sortCatalog(items: readonly IngredientCatalogItem[]): readonly IngredientCatalogItem[] {
  return [...items].sort((left, right) => right.usageCount - left.usageCount);
}

/** Ersetzt einen vorhandenen Namen case-insensitiv oder ergänzt einen neuen Catalog-Eintrag. */
function mergeCatalogItem(
  items: readonly IngredientCatalogItem[],
  incoming: IngredientCatalogItem,
): readonly IngredientCatalogItem[] {
  const key = incoming.name.toLocaleLowerCase();
  const existing = items.some((item) => item.name.toLocaleLowerCase() === key);
  const merged = existing
    ? items.map((item) => (item.name.toLocaleLowerCase() === key ? incoming : item))
    : [...items, incoming];
  return sortCatalog(merged);
}

@Injectable({ providedIn: 'root' })
export class IngredientCatalogService {
  private readonly catalog = signal<readonly IngredientCatalogItem[]>([]);
  private loading?: Promise<void>;
  private loaded = false;
  readonly items = this.catalog.asReadonly();

  /** Lädt den gesamten Catalog genau einmal pro App-Sitzung für lokale Sofortfilterung. */
  load(): Promise<void> {
    if (this.loaded || !N8N_PUBLIC_CONFIG.webhookBaseUrl) return Promise.resolve();
    this.loading ??= this.loadCatalog();
    return this.loading;
  }

  /** Registriert eine neue Verwendung atomar und aktualisiert anschließend den lokalen Catalog. */
  async recordUsage(name: string): Promise<void> {
    if (!N8N_PUBLIC_CONFIG.webhookBaseUrl) return;
    const value = await catalogRequest({ action: 'register', name: name.trim() });
    this.catalog.update((items) => mergeCatalogItem(items, parseRegisteredItem(value)));
  }

  /** Holt den Catalog über genau einen Request und gibt bei Fehlern einen späteren Retry frei. */
  private async loadCatalog(): Promise<void> {
    try {
      this.catalog.set(parseCatalog(await catalogRequest({ action: 'list' })));
      this.loaded = true;
    } finally {
      this.loading = undefined;
    }
  }
}
