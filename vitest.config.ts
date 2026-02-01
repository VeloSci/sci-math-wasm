import { defineConfig } from 'vitest/config';
import wasm from 'vite-plugin-wasm';

export default defineConfig({
  plugins: [/*wasm()*/],
  test: {
    environment: 'node',
    server: {
      deps: {
        external: [/\/pkg\/node\//],
      },
    },
    pool: 'forks',
  },
});
