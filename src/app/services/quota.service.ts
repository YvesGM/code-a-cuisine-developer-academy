import { Injectable } from '@angular/core';
import { N8N_PUBLIC_CONFIG } from '../../environments/runtime-config';
import { N8N_PATHS } from '../config/app.constants';
import { QuotaStatus } from '../models/app.models';

/** Lädt den aktuellen Tagesquota-Status über den öffentlichen n8n-Endpunkt. */
@Injectable({ providedIn: 'root' })
export class QuotaService {
  /** Lädt die aktuelle Tagesquota über n8n aus Firebase. */
  async getStatus(): Promise<QuotaStatus | null> {
    if (!N8N_PUBLIC_CONFIG.webhookBaseUrl) return null;
    const response = await fetch(`${N8N_PUBLIC_CONFIG.webhookBaseUrl}/${N8N_PATHS.quota}`);
    if (!response.ok) throw new Error('Quota-Status konnte nicht geladen werden.');
    return (await response.json()) as QuotaStatus;
  }
}
