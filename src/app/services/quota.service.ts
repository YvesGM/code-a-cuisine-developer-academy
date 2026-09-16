import { Injectable } from '@angular/core';
import { N8N_PUBLIC_CONFIG } from '../../environments/runtime-config';
import { N8N_PATHS } from '../config/app.constants';
import { QuotaStatus } from '../models/app.models';

/** Loads the current daily quota status through the public n8n endpoint. */
@Injectable({ providedIn: 'root' })
export class QuotaService {
  /**
   * Loads the current daily quota from Firebase through n8n.
   *
   * @returns {Promise<QuotaStatus|null>} A promise resolving to the current quota status, or null when n8n is not configured.
   * @throws {Error} When the quota endpoint returns an unsuccessful response.
   */
  async getStatus(): Promise<QuotaStatus | null> {
    if (!N8N_PUBLIC_CONFIG.webhookBaseUrl) return null;
    const response = await fetch(`${N8N_PUBLIC_CONFIG.webhookBaseUrl}/${N8N_PATHS.quota}`);
    if (!response.ok) throw new Error('Quota status could not be loaded.');
    return (await response.json()) as QuotaStatus;
  }
}
