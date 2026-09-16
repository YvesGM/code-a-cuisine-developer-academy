import { Injectable, signal } from '@angular/core';
import { N8N_PUBLIC_CONFIG } from '../../environments/runtime-config';
import { N8N_PATHS } from '../config/app.constants';
import { IngredientCatalogItem } from '../models/app.models';

/** Encapsulates loading and updating the ingredient catalog through n8n. */
@Injectable({ providedIn: 'root' })
export class IngredientService {
  private readonly catalog = signal<readonly IngredientCatalogItem[]>([]);
  private loaded = false;
  readonly items = this.catalog.asReadonly();

  /**
   * Loads the ingredient catalog once from Firebase through n8n.
   *
   * @returns {Promise<void>} A promise that resolves after the catalog has been loaded.
   * @throws {Error} When the ingredient catalog request fails.
   */
  async load(): Promise<void> {
    if (this.loaded || !N8N_PUBLIC_CONFIG.webhookBaseUrl) return;
    const response = await this.request({ action: 'list' });
    const data = response as { items?: IngredientCatalogItem[] };
    this.catalog.set(data.items ?? []);
    this.loaded = true;
  }

  /**
   * Registers ingredient usage and updates the local catalog.
   *
   * @param {string} name - The ingredient name whose usage should be recorded.
   * @returns {Promise<void>} A promise that resolves after the usage count and local catalog are updated.
   * @throws {Error} When the ingredient usage request fails.
   */
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

  /**
   * Sends exactly one catalog action to the n8n/Firebase owner.
   *
   * @param {object} body - The request body sent to n8n.
   * @returns {Promise<unknown>} A promise resolving to the parsed n8n response body.
   * @throws {Error} When the ingredient catalog request fails.
   */
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
