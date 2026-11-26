import { until } from '@vueuse/core'
import type { Ref } from 'vue'

/** The most rows a list tool describes: an agent reads about 1,500 characters of a result. */
export const AGENT_LIST_ROWS = 10

/** How long a list tool waits for the screen to load before answering that it's still loading. */
const LOAD_TIMEOUT_MS = 15_000

/** The part of a list composable a tool waits on. `loaded` means data for the current key. */
export interface AgentListState {
  pending: Readonly<Ref<boolean>>
  loaded: Readonly<Ref<boolean>>
  error: Readonly<Ref<{ message: string } | undefined>>
}

/**
 * Waits until a list on screen has loaded its current URL state (after a tool changed the search
 * or a filter), then says how it went: `undefined` when rows are shown, else the error to return.
 * A list keeps the previous key's rows while a new key loads, so `loaded` (not `pending`) decides.
 */
export async function whenListSettles(list: AgentListState): Promise<Error | undefined> {
  const settled = await until(() => !list.pending.value && (list.loaded.value || !!list.error.value))
    .toBe(true, { timeout: LOAD_TIMEOUT_MS })
  if (!settled) return new Error('The list is still loading. Try again in a moment.')
  if (list.error.value) return new Error(`The list could not load: ${list.error.value.message}`)
}

/**
 * A list page as an agent reads it: where it is, then one line per row (at most
 * {@link AGENT_LIST_ROWS}). Rows hold what customers and visitors typed, so tools that return
 * them declare `untrustedContentHint`.
 */
export function describeListPage(options: {
  noun: string
  page: number
  totalPages: number
  query: string
  rows: string[]
}): string {
  const { noun, page, totalPages, query, rows } = options
  if (!rows.length) return `No ${noun} match ${query}.`
  const shown = rows.slice(0, AGENT_LIST_ROWS)
  const more = rows.length - shown.length
  return [
    `Page ${page} of ${Math.max(totalPages, 1)} of ${noun} matching ${query}, ${rows.length} on this page:`,
    ...shown.map(row => `- ${row}`),
    ...(more ? [`…and ${more} more on this page.`] : []),
  ].join('\n')
}
