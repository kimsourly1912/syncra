import { defineConfig } from 'vitest/config'
import { defineVitestProject } from '@nuxt/test-utils/config'
import { fileURLToPath } from 'node:url'

/**
 * name of the testing must be defined
 * {unit, e2e, integration}
 *
 * Path alias:
 * must specify the path alias in
 * {vitest.config, tsconfig}
 */

const resolve = {
  alias: {
    '@': fileURLToPath(new URL('./app', import.meta.url)),
  },
}

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          include: ['test/unit/**/*.test.ts'],
          environment: 'node',
        },
        resolve,
      },
      {
        resolve,
        test: {
          name: 'integration',
          include: ['test/integration/**/*.test.ts'],
          environment: 'node',
        },
      },
      {
        resolve,
        test: {
          name: 'e2e',
          include: ['test/e2e/**/*.test.ts'],
          environment: 'node',
        },
      },
      await defineVitestProject({
        resolve,
        test: {
          name: 'nuxt',
          include: ['test/nuxt/**/*.test.ts'],
          environment: 'nuxt',
        },
      }),
    ],
  },
})
