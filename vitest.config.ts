import path from 'path';
import { defineConfig } from 'vitest/config';

// Separate from vite.config.ts — intentionally omits reactRouter() plugin,
// which is incompatible with the Vitest runner.
export default defineConfig({
  resolve: {
    alias: {
      '~': path.resolve(__dirname, 'app'),
    },
  },
  test: {
    environment: 'node',
    include: ['app/**/*.test.ts', 'app/**/*.test.tsx'],
  },
});
