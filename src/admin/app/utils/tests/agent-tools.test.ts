import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { AGENT_LIST_ROWS, describeListPage, whenListSettles } from '../agent-tools'

describe('describeListPage', () => {
  it('lists at most AGENT_LIST_ROWS rows and counts the rest', () => {
    const rows = Array.from({ length: AGENT_LIST_ROWS + 3 }, (_, i) => `row ${i + 1}`)
    const text = describeListPage({ noun: 'leads', page: 2, totalPages: 4, query: '"acme"', rows })

    expect(text.split('\n')[0]).toBe('Page 2 of 4 of leads matching "acme", 13 on this page:')
    expect(text).toContain(`- row ${AGENT_LIST_ROWS}`)
    expect(text).not.toContain(`- row ${AGENT_LIST_ROWS + 1}`)
    expect(text.split('\n').at(-1)).toBe('…and 3 more on this page.')
  })

  it('says when nothing matches', () => {
    expect(describeListPage({ noun: 'accounts', page: 1, totalPages: 0, query: 'no search', rows: [] }))
      .toBe('No accounts match no search.')
  })
})

describe('whenListSettles', () => {
  it('waits for the current state\'s rows, not a load that is merely idle', async () => {
    const list = { pending: ref(false), loaded: ref(false), error: ref<{ message: string }>() }
    const settled = whenListSettles(list)
    list.pending.value = true
    list.loaded.value = true
    list.pending.value = false

    await expect(settled).resolves.toBeUndefined()
  })

  it('answers with the load error', async () => {
    const list = { pending: ref(false), loaded: ref(false), error: ref<{ message: string }>({ message: 'Server error' }) }

    const failed = await whenListSettles(list)

    expect(failed).toBeInstanceOf(Error)
    expect(failed?.message).toBe('The list could not load: Server error')
  })
})
