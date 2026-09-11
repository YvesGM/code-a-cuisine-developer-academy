import { Injectable } from '@angular/core';
import { N8N_PUBLIC_CONFIG } from '../../environments/runtime-config';
import { N8N_PATHS } from './config';
import { QuotaStatus } from './models';

type JsonRecord = Record<string, unknown>;
const quotaNumbers = [
  'ipUsedRecipes',
  'ipLimitRecipes',
  'ipRemainingRecipes',
  'globalUsedRecipes',
  'globalLimitRecipes',
  'globalRemainingRecipes',
] as const;

/** Erzwingt die Objektform der öffentlichen Quota-Antwort. */
function quotaRecord(value: unknown): JsonRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Ungültige Quota-Antwort.');
  }
  return value as JsonRecord;
}

/** Prüft sämtliche ganzzahligen Quota-Zähler auf nichtnegative Werte. */
function validateQuotaNumbers(row: JsonRecord): void {
  for (const key of quotaNumbers) {
    if (typeof row[key] !== 'number' || !Number.isInteger(row[key]) || row[key] < 0) {
      throw new Error('Ungültige Quota-Antwort.');
    }
  }
}

/** Prüft die öffentliche Quota-Antwort streng, bevor sie in der UI angezeigt wird. */
function parseQuota(value: unknown): QuotaStatus {
  const row = quotaRecord(value);
  if (typeof row['dayKey'] !== 'string' || typeof row['generationAllowed'] !== 'boolean') {
    throw new Error('Ungültige Quota-Antwort.');
  }
  validateQuotaNumbers(row);
  if (row['reason'] !== null && typeof row['reason'] !== 'string') {
    throw new Error('Ungültige Quota-Antwort.');
  }
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
