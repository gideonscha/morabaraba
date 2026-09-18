/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // Build identity for crash reports (Vercel sets VERCEL_GIT_COMMIT_SHA).
  define: {
    __APP_COMMIT__: JSON.stringify(
      String((globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.VERCEL_GIT_COMMIT_SHA ?? 'dev').slice(0, 12),
    ),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt'],
      manifest: {
        name: 'Morabaraba',
        short_name: 'Morabaraba',
        description: 'African strategy board game',
        theme_color: '#7A2E0E',
        background_color: '#5C1F08',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/favicon.svg',
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
