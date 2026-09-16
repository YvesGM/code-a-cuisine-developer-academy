/** Public runtime values exposed by the static host before Angular starts. */
export interface RuntimeConfig {
  readonly n8nWebhookBaseUrl?: string;
}

type RuntimeGlobal = typeof globalThis & {
  __CODE_A_CUISINE_CONFIG__?: RuntimeConfig;
};

const runtime = (globalThis as RuntimeGlobal).__CODE_A_CUISINE_CONFIG__;

/** Public n8n base URL; contains no API secrets or credentials. */
export const N8N_PUBLIC_CONFIG = {
  webhookBaseUrl: runtime?.n8nWebhookBaseUrl?.trim().replace(/\/+$/, '') ?? '',
} as const;
