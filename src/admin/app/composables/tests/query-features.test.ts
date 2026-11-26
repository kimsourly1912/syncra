import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { QUERY_FEATURES } from '../useApiQuery'

describe('query features', () => {
  it.each(QUERY_FEATURES)('%s is a feature folder, so its keys match what invalidate names', (feature) => {
    expect(existsSync(new URL(`../../features/${feature}/index.ts`, import.meta.url))).toBe(true)
  })
})
