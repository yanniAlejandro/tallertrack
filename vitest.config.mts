import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'supabase/tests/**/*.test.ts'],
    // Las pruebas SQL arrancan un Postgres en WASM: dar margen en CI.
    testTimeout: 30_000,
    hookTimeout: 60_000,
    passWithNoTests: true,
    coverage: { include: ['src/domain/**', 'src/server/cripto-nucleo.ts', 'src/seed/generar.ts'] },
  },
});
