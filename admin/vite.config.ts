import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Inline PostCSS config: stops Vite walking up to the game app's
  // postcss.config.js (which loads Tailwind — not a dependency here).
  css: { postcss: { plugins: [] } },
});
