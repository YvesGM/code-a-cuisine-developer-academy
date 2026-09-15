import { Injectable, signal } from '@angular/core';
import { N8N_PUBLIC_CONFIG } from '../../environments/runtime-config';
import { N8N_PATHS } from '../config/app.constants';
import { IngredientCatalogItem } from '../models/app.models';

/** Kapselt Laden und Aktualisieren des Zutatenkatalogs über n8n. */
@Injectable({ providedIn: 'root' })
export class IngredientService {
  private readonly catalog = signal<readonly IngredientCatalogItem[]>([]);
  private loaded = false;
  readonly items = this.catalog.asReadonly();

  /** Lädt den Zutatenkatalog einmalig über n8n aus Firebase. */
  async load(): Promise<void> {
    if (this.loaded || !N8N_PUBLIC_CONFIG.webhookBaseUrl) return;
    const response = await this.request({ action: 'list' });
    const data = response as { items?: IngredientCatalogItem[] };
    this.catalog.set(data.items ?? []);
    this.loaded = true;
  }

  /** Registriert die Verwendung einer Zutat und aktualisiert den lokalen Katalog. */
  async recordUsage(name: string): Promise<void> {
    if (!N8N_PUBLIC_CONFIG.webhookBaseUrl) return;
    const normalized = name.trim();
    await this.request({ action: 'register', name: normalized });
    const key = normalized.toLocaleLowerCase();
    const existing = this.items().find((entry) => entry.name.toLocaleLowerCase() === key);
    const item = { name: existing?.name ?? normalized, usageCount: (existing?.usageCount ?? 0) + 1 };
    const items = this.items().filter((entry) => entry.name.toLocaleLowerCase() !== key);
    this.catalog.set([...items, item].sort((a, b) => b.usageCount - a.usageCount));
  }

  /** Sendet genau eine Katalogaktion an den n8n/Firebase-Owner. */
  private async request(body: object): Promise<unknown> {
    const url = `${N8N_PUBLIC_CONFIG.webhookBaseUrl}/${N8N_PATHS.ingredients}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error('Ingredient catalog could not be loaded.');
    return (await response.json()) as unknown;
  }
}
