import { describe, expect, it } from 'vitest'
import { activityBrandStyles } from '../../app/features/workspace/utils/activity-brand-styles'

describe('activity Brand / Style pairs', () => {
  it('handles missing data from older API responses', () => {
    expect(activityBrandStyles(undefined, 'COMPLETED')).toEqual([])
    expect(activityBrandStyles(null, 'COMPLETED')).toEqual([])
    expect(activityBrandStyles([], 'REJECTED')).toEqual([])
  })

  it('hides partial metadata until processing finishes', () => {
    for (const status of ['DRAFT', 'PENDING', 'PROCESSING'] as const) {
      expect(activityBrandStyles([{ brand: 'Brand', style: 'S1' }], status)).toEqual([])
    }
  })

  it('deduplicates complete pairs while preserving the first uploaded pair', () => {
    expect(activityBrandStyles([
      { brand: 'Tommy Bahama', style: 'S1' },
      { brand: 'Tommy Bahama', style: 'S1' },
      { brand: 'Tommy Bahama', style: 'S2' },
      { brand: 'Veronica Beard', style: 'S1' },
    ], 'COMPLETED')).toEqual([
      { brand: 'Tommy Bahama', style: 'S1' },
      { brand: 'Tommy Bahama', style: 'S2' },
      { brand: 'Veronica Beard', style: 'S1' },
    ])
  })

  it('keeps missing halves for N/A rendering and skips completely empty pairs', () => {
    expect(activityBrandStyles([
      { brand: ' Brand ', style: null },
      { brand: null, style: ' S2 ' },
      { brand: 'N/A', style: ' ' },
    ], 'REJECTED')).toEqual([
      { brand: 'Brand', style: null },
      { brand: null, style: 'S2' },
    ])
  })

  it('does not collide when values contain separators', () => {
    expect(activityBrandStyles([
      { brand: 'A/B', style: 'C' },
      { brand: 'A', style: 'B/C' },
    ], 'FAILED')).toHaveLength(2)
  })
})
