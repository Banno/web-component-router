import { defineConfig } from 'vite';

export default defineConfig((env) => ({
  cacheDir: '.vitest/web-component-router',
  build: {},
  optimzeDeps: {
    include: ['path-to-regexp'],
  },
  test: {
    include: ["test/**/*-spec.js"],
    browser: {
      provider: 'playwright',
      enabled: true,
      headless: !!process.env.CI,
      instances: [{
        browser: 'chromium',
      }],
    },
    globals: true,
    coverage: {
      enabled: false,
      all: true,
      provider: 'v8',
      reporter: ['lcov', 'json', 'json-summary', 'html'],
      include: [],
      exclude: [],
      lines: 80,
      branches: 80,
      functions: 80,
      statements: 80,
    },
  },
}));
