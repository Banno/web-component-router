import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@jack-henry/web-component-router': fileURLToPath(new URL('../', import.meta.url)),
    },
  },
});
