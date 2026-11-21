import type { ObjectValueToString } from '~/types/common'
import type { ContactSaleDTO } from '@/types/dto'
import * as contactSaleService from '@/services/contact-sale.service'
import type { IContactSaleSchema } from '@/schema/contact-sale.schema'
import type { FormSubmitEvent } from '@nuxt/ui'

export function useContactSale() {
  const profileStore = useProfileStore()
  const { toast } = useAppToast()

  const data = reactive<IContactSaleSchema>({
    helpWith: '',
    interestedProduct: [],
  })

  const FIELD_NAME = {
    helpWith: 'helpWith',
    interestedProduct: 'interestedProduct',
  } satisfies ObjectValueToString<IContactSaleSchema>

  const bodyReq = computed<ContactSaleDTO.ContactSaleReq>(() => ({
    description: data.helpWith.trim(),
    companyId: profileStore.companyId,
    interestedProduct: data.interestedProduct,
    agreedToContact: true,
  }))

  const { execute, pending, status } = useAsyncData(async () => {
    try {
      await contactSaleService.createContactSale(bodyReq.value)
    }
    catch (e) {
      toast.addException(e)
      throw e
    }
  }, { immediate: false })

  function submit(fn: () => void = noop) {
    return async (_: FormSubmitEvent<IContactSaleSchema>) => {
      await execute()
      if (status.value === 'success') {
        fn()
      }
    }
  }

  function clearAll() {
    data.helpWith = ''
    data.interestedProduct = []
  }

  return {
    data,
    status,
    FIELD_NAME,
    bodyReq,
    clearAll,
    execute,
    pending,
    submit,
  }
}
