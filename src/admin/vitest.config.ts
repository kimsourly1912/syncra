import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import { defineVitestProject } from '@nuxt/test-utils/config'

// Tests sit in a `tests/` folder beside the code they cover; the suffix picks the environment
// (docs/testing.md, decision 0016). `test/` holds only the app shell, shared helpers, and e2e.
const NUXT_TESTS = ['app/**/*.nuxt.test.ts', 'test/app-shell/**/*.nuxt.test.ts']

export default defineConfig({
  test: {
    projects: [
      {
        // `@/` as in the app; the Node project has no other Nuxt alias or auto-import.
        resolve: { alias: { '@': fileURLToPath(new URL('./app', import.meta.url)) } },
        test: {
          name: 'unit',
          include: ['app/**/*.test.ts'],
          exclude: NUXT_TESTS,
          environment: 'node',
        },
      },
      {
        test: {
          name: 'e2e',
          include: ['test/e2e/**/*.test.ts'],
          environment: 'node',
          // A browser flow against the built app; `setup()` builds it first (`pnpm test:e2e`).
          testTimeout: 60_000,
        },
      },
      await defineVitestProject({
        test: {
          name: 'nuxt',
          include: NUXT_TESTS,
          environment: 'nuxt',
          // Booting the Nuxt app (Nuxt UI, icons) takes ~15s on a cold Windows run.
          hookTimeout: 60_000,
          environmentOptions: {
            nuxt: {
              // The profile plugin requests the API on boot; never let tests reach a real one.
              overrides: { runtimeConfig: { public: { apiURL: 'http://api.test.invalid' } } },
            },
          },
        },
      }),
    ],
  },
})
