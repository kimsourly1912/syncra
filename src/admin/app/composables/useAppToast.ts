import type { FetchError } from 'ofetch'
import type { BaseRes, BaseError } from '@/types/dto/base.dto'

export function useAppToast() {
  const toast = useToast()

  function success(description: string) {
    return toast.add({ title: 'Success', description, color: 'success' })
  }

  function failed(description: string) {
    return toast.add({ title: 'Failed', description, color: 'error' })
  }

  function exception(e: unknown) {
    const err = e as FetchError<BaseRes<null> & BaseError>
    return failed(err.data?.reason ?? err.data?.detail ?? 'Internal Server error')
  }

  return {
    base: toast,
    failed,
    success,
    exception,
  }
}
