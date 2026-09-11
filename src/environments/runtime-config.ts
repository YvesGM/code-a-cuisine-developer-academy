/**
 * Öffentliche Laufzeitkonfiguration für die statisch ausgelieferte Angular-App.
 * Secrets bleiben ausschließlich in n8n/Firebase-Credentials; der Browser kennt nur die n8n-Webhook-Basis.
 */
export interface RuntimeConfig {
  readonly n8nWebhookBaseUrl?: string;
}

declare global {
  // eslint-disable-next-line no-var
  var __CODE_A_CUISINE_CONFIG__: RuntimeConfig | undefined;
}

const runtime = globalThis.__CODE_A_CUISINE_CONFIG__;

/** Öffentliche n8n-Basis-URL; enthält keine API-Secrets. */
export const N8N_PUBLIC_CONFIG = {
  webhookBaseUrl: runtime?.n8nWebhookBaseUrl?.trim().replace(/\/+$/, '') ?? '',
} as const;
