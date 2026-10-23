/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const ENV = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};
const BRAND_ID = (ENV.VITE_BRAND ?? 'legends').trim().toLowerCase();
const MANIFEST = BRAND_ID === 'kraalboss'
  ? { name: 'Morabaraba: Kraal Boss', short_name: 'Kraal Boss', description: 'Own the board. Become the Boss.',
      theme_color: '#080808', background_color: '#080808', icon: '/favicon-kraalboss.svg' }
  : { name: 'Morabaraba', short_name: 'Morabaraba', description: 'African strategy board game',
      theme_color: '#7A2E0E', background_color: '#5C1F08', icon: '/favicon.svg' };

export default defineConfig({
  // Build identity for crash reports (Vercel sets VERCEL_GIT_COMMIT_SHA).
  define: {
    __APP_COMMIT__: JSON.stringify(
      String(ENV.VERCEL_GIT_COMMIT_SHA ?? 'dev').slice(0, 12),
    ),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon-kraalboss.svg', 'robots.txt'],
      manifest: {
        name: MANIFEST.name,
        short_name: MANIFEST.short_name,
        description: MANIFEST.description,
        theme_color: MANIFEST.theme_color,
        background_color: MANIFEST.background_color,
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: MANIFEST.icon,
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
