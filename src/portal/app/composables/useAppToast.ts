import type { BaseDTO } from '@/types/dto'

type PartialToast = Partial<Toast>

export interface ToastProp {
  icon: string
  color: PartialToast['color']
}

export interface ToastMap {
  success: ToastProp
  error: ToastProp
  warning: ToastProp
  info: ToastProp
}

export const toastMap: ToastMap = {
  error: {
    color: 'error',
    icon: 'lucide:info',
  },
  success: {
    color: 'success',
    icon: 'lucide:check',
  },
  warning: {
    color: 'warning',
    icon: 'lucide:info',
  },
  info: {
    color: 'info',
    icon: 'lucide:info',
  },
}

export function useAppToast() {
  const toastInstance = useToast()

  function exceptionMessage(e: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const err = e as BaseDTO.OFetchError & BaseDTO.BaseRes<any>
    const title = err.data?.title ?? 'Error'
    const description = err.data?.detail ?? err.data?.reason ?? ''
    return {
      title,
      description,
    }
  }

  function add(type: keyof ToastMap, options: PartialToast = {}) {
    return toastInstance.add({ ...toastMap[type], ...options })
  }

  function addException(e: unknown) {
    const { title, description } = exceptionMessage(e)
    return add('error', { title, description })
  }

  function addServerError() {
    return add('error', { title: 'Failed', description: 'Internal Server Error' })
  }

  function remove(id: string | number) {
    toastInstance.remove(id)
  }

  function clear() {
    toastInstance.clear()
  }

  return {
    toast: {
      toastInstance,
      add,
      remove,
      clear,
      addException,
      addServerError,
    },
  }
}
