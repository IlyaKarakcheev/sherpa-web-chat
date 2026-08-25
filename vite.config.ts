/// <reference types="vitest" />
import { createRequire } from 'node:module';
import { defineConfig, type UserConfig } from 'vite';
import react from '@vitejs/plugin-react';

const require = createRequire(import.meta.url);
const devCerts = require('office-addin-dev-certs') as {
  getHttpsServerOptions: () => Promise<{ ca: Buffer; key: Buffer; cert: Buffer }>;
};

async function getHttpsOptions() {
  try {
    const httpsOptions = await devCerts.getHttpsServerOptions();
    return { ca: httpsOptions.ca, key: httpsOptions.key, cert: httpsOptions.cert };
  } catch (err) {
    console.warn('Could not load office-addin-dev-certs, falling back to default HTTPS:', err);
    return {};
  }
}

export default defineConfig(async ({ command }): Promise<UserConfig> => {
  const https =
    process.env.VITEST || command === 'build' ? undefined : await getHttpsOptions();

  return {
    plugins: [react()],
    server: {
      port: 3011,
      https,
      open: true,
    },
    preview: {
      port: 3011,
      https,
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './tests/setup.ts',
      pool: 'forks',
      server: {
        deps: {
          inline: [/@fluentui/, /tabster/],
        },
      },
    },
  };
});
