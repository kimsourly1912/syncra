import { ApiError } from '@/api'

export function useAppToast() {
  const toast = useToast()

  function success(description: string, title = 'Success') {
    return toast.add({ title, description, color: 'success', icon: 'lucide:circle-check' })
  }

  function failed(description: string, title = 'Failed') {
    return toast.add({ title, description, color: 'error', icon: 'lucide:circle-alert' })
  }

  /** Shows any thrown error by its user-safe message. Cancelled requests and an ended session show nothing. */
  function error(e: unknown, title?: string) {
    const err = ApiError.from(e)
    if (err.silent) return
    if (err.kind === 'contract' || err.kind === 'unknown') console.error(err)
    return failed(err.message, title)
  }

  return {
    base: toast,
    failed,
    success,
    error,
  }
}
