import type { FetchError } from 'ofetch'
import { ApiContractError } from '@/api'
import type { ApiErrorBody } from '@/api'

export function useAppToast() {
  const toast = useToast()

  function success(description: string) {
    return toast.add({ title: 'Success', description, color: 'success' })
  }

  function failed(description: string) {
    return toast.add({ title: 'Failed', description, color: 'error' })
  }

  function exception(e: unknown) {
    if (e instanceof ApiContractError) {
      console.error(e)
      return failed(e.message)
    }
    const err = e as FetchError<ApiErrorBody>
    if (err instanceof Error && err.name !== 'FetchError') return failed(err.message)
    return failed(err.data?.reason ?? err.data?.detail ?? 'Internal Server error')
  }

  return {
    base: toast,
    failed,
    success,
    exception,
  }
}
