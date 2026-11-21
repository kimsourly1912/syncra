import { ApiError } from './errors'
import type { ApiErrorKind } from './errors'

/** A renewal that failed with these means the session is over. Anything else is transient. */
const REFUSED = new Set<ApiErrorKind>(['unauthorized', 'forbidden', 'rejected', 'validation'])

export interface SessionRecoveryOptions {
  /** Renews the session cookies. Resolves when renewed; throws `ApiError` otherwise. */
  renew: () => Promise<unknown>
  /** The session can't be renewed. Must be idempotent: every failed request reports it. */
  onExpired: () => unknown
  /** Web Lock name shared by this app's tabs. */
  lockName: string
}

export type Recovery = 'retry' | 'expired'

/**
 * Decides what a request does after a 401.
 * - Concurrent 401s share one renewal; a request that started before the last renewal
 *   finished retries without renewing again (its 401 was for the old cookies).
 * - Tabs renew one at a time, because they share the refresh cookie.
 * - A refused renewal ends the session. A transient failure is thrown and the session stays.
 */
export function createSessionRecovery({ renew, onExpired, lockName }: SessionRecoveryOptions) {
  let renewing: Promise<boolean> | undefined
  let renewals = 0

  function renewOnce() {
    renewing ??= acrossTabs(lockName, renew)
      .then(() => {
        renewals++
        return true
      }, (error: unknown) => {
        const e = ApiError.from(error)
        if (REFUSED.has(e.kind)) return false
        throw e
      })
      .finally(() => {
        renewing = undefined
      })
    return renewing
  }

  return {
    /** Read before sending, and pass to `recover` if the request fails with 401. */
    checkpoint: () => renewals,

    async recover(checkpoint: number): Promise<Recovery> {
      if (checkpoint !== renewals) return 'retry'
      if (await renewOnce()) return 'retry'
      await onExpired()
      return 'expired'
    },

    /** The retried request was refused too. */
    async expire() {
      await onExpired()
    },
  }
}

const OTHER_TAB = Symbol('other tab')

/**
 * Runs `renew` in one tab at a time. A tab that finds another one renewing waits for it and
 * then resolves: its retry uses the cookies the other tab received, and a second 401 ends
 * the session. Without the Web Locks API, it renews directly.
 */
export async function acrossTabs(name: string, renew: () => Promise<unknown>) {
  const locks = globalThis.navigator?.locks
  if (!locks) return renew()

  const result = await locks.request(name, { ifAvailable: true }, lock => lock ? renew() : OTHER_TAB)
  if (result === OTHER_TAB) await locks.request(name, () => {})
  return result
}
