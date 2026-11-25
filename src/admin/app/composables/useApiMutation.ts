import { ApiError } from '@/api'

export type MutationResult<R> = { ok: true, data: R } | { ok: false, error: ApiError }

export interface ApiMutationOptions<I, R> {
  /** Success toast text, or `false` for none. Default: none. */
  success?: string | false | ((data: R, input: I) => string | false)
  /** Failure toast title; the description is the error's user-safe message. Default: "Failed". */
  error?: string | ((input: I) => string)
  /** Feature keys to refresh after success (`invalidateQueries`). */
  invalidate?: string[]
}

/**
 * Runs a write with the toasts, pending flag, and double-submit guard every write needs, so a
 * feature never writes its own try/catch.
 *
 * - `execute(input)` resolves to `{ ok: true, data }` or `{ ok: false, error }`; it never throws.
 *   Act on success with `if (result.ok)`.
 * - A call while the previous one is still running is skipped (a double click).
 * - Failures show a toast, except silent ones (a cancelled request, an ended session).
 *
 * @example
 * const approve = useApiMutation(
 *   (item: ReviewItem) => api.post('/admin/docai/techpack-reviews/{fileId}/approve', { path: { fileId: item.fileId }, body }),
 *   { success: 'Workbook reviewed and released', error: 'Could not approve the workbook', invalidate: ['techpack-review'] },
 * )
 * if ((await approve.execute(item)).ok) await navigateTo('/techpack-reviews?status=reviewed')
 */
export function useApiMutation<I = void, R = unknown>(fn: (input: I) => Promise<R>, options: ApiMutationOptions<I, R> = {}) {
  const toast = useAppToast()
  const pending = shallowRef(false)
  const error = shallowRef<ApiError>()

  async function execute(input: I): Promise<MutationResult<R>> {
    if (pending.value) return { ok: false, error: new ApiError({ kind: 'aborted', message: 'Already in progress.' }) }
    pending.value = true
    error.value = undefined
    try {
      const data = await fn(input)
      const message = typeof options.success === 'function' ? options.success(data, input) : options.success
      if (message) toast.success(message)
      if (options.invalidate?.length) void invalidateQueries(...options.invalidate)
      return { ok: true, data }
    }
    catch (e) {
      const err = ApiError.from(e)
      error.value = err
      toast.error(err, typeof options.error === 'function' ? options.error(input) : options.error)
      return { ok: false, error: err }
    }
    finally {
      pending.value = false
    }
  }

  return {
    execute,
    pending: readonly(pending),
    /** The last failure, cleared when the next call starts. */
    error: readonly(error),
  }
}
