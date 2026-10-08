import { defineConfig } from 'vite';
import vinext from 'vinext';

// Local development uses only the local D1 and R2 emulators.
export default defineConfig(async () => {
  process.env.CLOUDFLARE_CF_FETCH_ENABLED ??= 'false';
  process.env.WRANGLER_SEND_METRICS ??= 'false';
  const { cloudflare } = await import('@cloudflare/vite-plugin');
  return {
    plugins: [
      vinext(),
      cloudflare({
        configPath: './wrangler.jsonc',
        viteEnvironment: { name: 'rsc', childEnvironments: ['ssr'] },
        inspectorPort: false,
        persistState: { path: '.wrangler/state' },
      }),
    ],
  };
});
