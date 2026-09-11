import { Injectable } from '@angular/core';
import { N8N_PATHS } from './config';
import { QuotaStatus } from './models';
import { N8N_PUBLIC_CONFIG } from '../../environments/runtime-config';

type JsonRecord = Record<string, unknown>;

/** Prüft die öffentliche Quota-Antwort streng, bevor sie in der UI angezeigt wird. */
function parseQuota(value: unknown): QuotaStatus {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Ungültige Quota-Antwort.');
  const row = value as JsonRecord;
  const numbers = [
    'ipUsedRecipes',
    'ipLimitRecipes',
    'ipRemainingRecipes',
    'globalUsedRecipes',
    'globalLimitRecipes',
    'globalRemainingRecipes',
  ] as const;
  if (typeof row['dayKey'] !== 'string' || typeof row['generationAllowed'] !== 'boolean')
    throw new Error('Ungültige Quota-Antwort.');
  for (const key of numbers)
    if (typeof row[key] !== 'number' || !Number.isInteger(row[key]) || row[key] < 0)
      throw new Error('Ungültige Quota-Antwort.');
  if (row['reason'] !== null && typeof row['reason'] !== 'string')
    throw new Error('Ungültige Quota-Antwort.');
  return structuredClone(row) as unknown as QuotaStatus;
}

@Injectable({ providedIn: 'root' })
export class QuotaService {
  /** Liest die serverseitige IP-/Global-Quota; ohne n8n-Konfiguration bleibt der Mock-Modus neutral. */
  async getStatus(): Promise<QuotaStatus | null> {
    if (!N8N_PUBLIC_CONFIG.webhookBaseUrl) return null;
    const response = await fetch(`${N8N_PUBLIC_CONFIG.webhookBaseUrl}/${N8N_PATHS.quota}`);
    if (!response.ok) throw new Error('Quota-Status konnte nicht geladen werden.');
    return parseQuota((await response.json()) as unknown);
  }
}
