import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { N8N_PUBLIC_CONFIG } from '../../environments/runtime-config';
import { N8N_PATHS } from '../constants/recipe-flow.constants';
import { QuotaStatus } from '../models/app.models';

/** Loads the current daily recipe quota through the public n8n endpoint. */
@Injectable({ providedIn: 'root' })
export class QuotaService {
  private readonly http = inject(HttpClient);

  /** Loads the current per-IP and global daily quota status.
   * @returns {Promise<QuotaStatus|null>} The quota status, or null when n8n is not configured.
   * @throws {Error} When the quota endpoint cannot be loaded. */
  async getStatus(): Promise<QuotaStatus | null> {
    if (!N8N_PUBLIC_CONFIG.webhookBaseUrl) return null;
    const url = `${N8N_PUBLIC_CONFIG.webhookBaseUrl}/${N8N_PATHS.quota}`;
    try {
      return await firstValueFrom(this.http.get<QuotaStatus>(url));
    } catch {
      throw new Error('Quota status could not be loaded.');
    }
  }
}
