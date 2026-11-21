import { ApiError } from '@/api'

export function useAppToast() {
  const toast = useToast()

  function success(description: string) {
    return toast.add({ title: 'Success', description, color: 'success' })
  }

  function failed(description: string) {
    return toast.add({ title: 'Failed', description, color: 'error' })
  }

  /** Shows any thrown error by its user-safe message. Cancelled requests and an ended session show nothing. */
  function error(e: unknown) {
    const err = ApiError.from(e)
    if (err.silent) return
    if (err.kind === 'contract' || err.kind === 'unknown') console.error(err)
    return failed(err.message)
  }

  return {
    base: toast,
    failed,
    success,
    error,
  }
}
