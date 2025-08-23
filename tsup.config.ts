import { defineConfig } from 'tsup';

export default defineConfig([
  // Core entry point
  {
    entry: { index: 'src/index.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    external: ['react'],
    outDir: 'dist',
  },
  // React entry point - JavaScript only (types generated separately)
  {
    entry: { react: 'src/integrations/react/index.ts' },
    format: ['esm', 'cjs'],
    dts: false, // Types generated via separate TypeScript build
    external: ['react'],
    outDir: 'dist',
    esbuildOptions(options) {
      options.jsx = 'automatic';
    },
  },
]);