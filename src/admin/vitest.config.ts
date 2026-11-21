import { defineConfig } from 'vitest/config'
import { defineVitestProject } from '@nuxt/test-utils/config'

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          include: ['test/unit/*.{test,spec}.ts'],
          environment: 'node',
        },
      },
      {
        test: {
          name: 'e2e',
          include: ['test/e2e/*.{test,spec}.ts'],
          environment: 'node',
        },
      },
      await defineVitestProject({
        test: {
          name: 'nuxt',
          include: ['test/nuxt/*.{test,spec}.ts'],
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
