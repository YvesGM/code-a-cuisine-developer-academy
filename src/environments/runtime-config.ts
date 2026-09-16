/**
 * Public runtime configuration for the statically delivered Angular app.
 * Secrets remain exclusively in n8n/Firebase credentials; the browser knows only the n8n webhook base URL.
 */
export interface RuntimeConfig {
  readonly n8nWebhookBaseUrl?: string;
}

declare global {
  var __CODE_A_CUISINE_CONFIG__: RuntimeConfig | undefined;
}

const runtime = globalThis.__CODE_A_CUISINE_CONFIG__;

/** Public n8n base URL; contains no API secrets. */
export const N8N_PUBLIC_CONFIG = {
  webhookBaseUrl: runtime?.n8nWebhookBaseUrl?.trim().replace(/\/+$/, '') ?? '',
} as const;
