import { defineConfig } from 'vitest/config';

/// <reference types="vitest/globals" />

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.{js,ts}',
        'eslint.config.js',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
        // Per-file thresholds - main implementation should have high coverage
        './src/event-bus.ts': {
          branches: 85,
          functions: 90,
          lines: 95,
          statements: 95,
        },
        './src/async-event-bus.ts': {
          branches: 80,
          functions: 90,
          lines: 90,
          statements: 90,
        },
        // Allow lower coverage for simple utility files
        './src/types.ts': {
          branches: 0,
          functions: 0,
          lines: 0,
          statements: 0,
        },
        './src/dead-event.ts': {
          branches: 0,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
});