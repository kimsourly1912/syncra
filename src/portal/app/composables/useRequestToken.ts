import type { FormSubmitEvent } from '@nuxt/ui'
import { createRequestToken } from '@/services/contact-sale.service'
import type { IContactSaleForTokenSchema } from '@/schema/contact-sale-token'

interface OpenItem {
  success: boolean
  request: boolean
}

export function useRequestToken() {
  const profileStore = useProfileStore()
  const { toast } = useAppToast()
  const status = shallowRef<'idle' | 'success' | 'error' | 'pending'>('idle')

  const state = reactive<IContactSaleForTokenSchema>({
    amount: '',
    message: '',
  })

  const loading = shallowRef(false)
  const open = useState<OpenItem>('request-token-open', () => ({
    request: false,
    success: false,
  }))

  function setOpen(key: keyof OpenItem, v: boolean) {
    open.value[key] = v
  }

  async function onSubmit(evt: FormSubmitEvent<IContactSaleForTokenSchema>) {
    try {
      status.value = 'pending'
      loading.value = true
      await createRequestToken({
        tokenAmount: +evt.data.amount,
        customerMessage: evt.data.message,
        emailAddress: profileStore.data?.email ?? '',
        requestedByName: profileStore.data?.firstName ?? '',
      })
      status.value = 'success'
      setOpen('request', false)
      setOpen('success', true)
    }
    catch (e) {
      status.value = 'error'
      toast.addException(e)
    }
    finally {
      loading.value = false
    }
  }

  function clear() {
    status.value = 'idle'
    Object.assign(state, {
      amount: '',
      message: '',
    })
  }

  watch(() => open.value.request, (v) => {
    if (v)
      clear()
  })

  return {
    open,
    status,
    state,
    loading,
    setOpen,
    onSubmit,
  }
}
