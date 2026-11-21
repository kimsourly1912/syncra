import { expect, it } from 'vitest'
import { activityFilter, typeItems } from '../../app/features/token/data'

it('requests all wallet credits for Received and preserves the other activity filters', () => {
  const filters = Object.fromEntries(typeItems.map(tab => [tab.label, activityFilter(String(tab.value))]))
  expect(filters).toEqual({
    All: {},
    Consumed: { type: 'USAGE' },
    Received: { direction: 'RECEIVED' },
  })
})
