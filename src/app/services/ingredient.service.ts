import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { N8N_PUBLIC_CONFIG } from '../../environments/runtime-config';
import { N8N_PATHS } from '../constants/recipe-flow.constants';
import { IngredientCatalogItem } from '../models/app.models';

/** Loads and updates the Firebase-backed ingredient catalog through n8n. */
@Injectable({ providedIn: 'root' })
export class IngredientService {
  private readonly http = inject(HttpClient);
  private readonly catalog = signal<readonly IngredientCatalogItem[]>([]);
  private loaded = false;
  readonly items = this.catalog.asReadonly();

  /** Loads the ingredient catalog once for autocomplete.
   * @returns {Promise<void>} Resolves after the catalog is available locally.
   * @throws {Error} When the n8n ingredient-catalog request fails. */
  async load(): Promise<void> {
    if (this.loaded || !N8N_PUBLIC_CONFIG.webhookBaseUrl) return;
    const data = await this.request<{ items?: IngredientCatalogItem[] }>({ action: 'list' });
    this.catalog.set(data.items ?? []);
    this.loaded = true;
  }

  /** Registers ingredient usage and mirrors the updated counter locally.
   * @param {string} name - The ingredient name whose usage should be recorded.
   * @returns {Promise<void>} Resolves after Firebase confirms the update.
   * @throws {Error} When the n8n ingredient-catalog request fails. */
  async recordUsage(name: string): Promise<void> {
    if (!N8N_PUBLIC_CONFIG.webhookBaseUrl) return;
    const normalized = name.trim();
    await this.request({ action: 'register', name: normalized });
    this.updateLocalUsage(normalized);
  }

  /** Updates the local catalog after a successful server-side usage increment.
   * @param {string} name - The normalized ingredient name that was registered.
   * @returns {void} Nothing is returned. */
  private updateLocalUsage(name: string): void {
    const key = name.toLocaleLowerCase();
    const existing = this.items().find((entry) => entry.name.toLocaleLowerCase() === key);
    const item = { name: existing?.name ?? name, usageCount: (existing?.usageCount ?? 0) + 1 };
    const items = this.items().filter((entry) => entry.name.toLocaleLowerCase() !== key);
    this.catalog.set([...items, item].sort((a, b) => b.usageCount - a.usageCount));
  }

  /** Sends one ingredient-catalog operation to n8n.
   * @template T - The expected response body type.
   * @param {object} body - The request body sent to the ingredient webhook.
   * @returns {Promise<T>} The parsed n8n response body.
   * @throws {Error} When the HTTP request fails. */
  private async request<T>(body: object): Promise<T> {
    const url = `${N8N_PUBLIC_CONFIG.webhookBaseUrl}/${N8N_PATHS.ingredients}`;
    try {
      return await firstValueFrom(this.http.post<T>(url, body));
    } catch {
      throw new Error('Ingredient catalog could not be loaded.');
    }
  }
}
