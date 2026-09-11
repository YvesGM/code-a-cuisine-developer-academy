import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const outputDirectory = resolve('public');
const outputFile = resolve(outputDirectory, 'runtime-config.js');
const environment = globalThis.process?.env ?? {};
const config = {
  supabaseUrl: environment.CODE_A_CUISINE_SUPABASE_URL?.trim() ?? '',
  supabasePublishableKey: environment.CODE_A_CUISINE_SUPABASE_PUBLISHABLE_KEY?.trim() ?? '',
  supabaseSchema: environment.CODE_A_CUISINE_SUPABASE_SCHEMA?.trim() || 'code_a_cuisine',
};

await mkdir(outputDirectory, { recursive: true });
await writeFile(
  outputFile,
  `globalThis.__CODE_A_CUISINE_CONFIG__ = Object.freeze(${JSON.stringify(config)});\n`,
  'utf8',
);

const enabled = Boolean(config.supabaseUrl && config.supabasePublishableKey);
globalThis.console.log(
  `Runtime-Konfiguration erzeugt: Supabase ${enabled ? 'aktiv' : 'nicht konfiguriert'}.`,
);
