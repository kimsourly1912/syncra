import { createContactSale } from '@/services/contact-sale.service'
import type { IContactSaleSchema } from '@/schema/contact-sale.schema'
import { phoneCodes } from '@/assets/data/data'
import type { FetchError } from 'ofetch'
import type { ObjectValueToString } from '@/types/common'
import type { FormSubmitEvent } from '@nuxt/ui'

interface OpenItem {
  contactSale: boolean
  success: boolean
}

const noop = () => {}

export function useContactSale() {
  const toast = useToast()
  const defaultCode = phoneCodes[0] ?? ''
  const pending = shallowRef(false)

  const open = reactive<OpenItem>({
    success: false,
    contactSale: false,
  })

  const data = reactive<IContactSaleSchema>({
    email: '',
    name: '',
    phone: '',
    helpWith: '',
    companyName: '',
    modules: [],
    phoneCode: defaultCode,
  })

  const FIELD_NAME = {
    name: 'name',
    email: 'email',
    phone: 'phone',
    modules: 'modules',
    helpWith: 'helpWith',
    phoneCode: 'phoneCode',
    companyName: 'companyName',
  } satisfies ObjectValueToString<IContactSaleSchema>

  const phoneNumber = computed(() => `${data.phoneCode}${data.phone}`)

  async function execute() {
    pending.value = true
    try {
      const { success, reason } = await createContactSale({
        country: '',
        companySize: '',
        documentTypes: '',
        industryType: '',
        fullName: data.name,
        agreedToContact: true,
        workEmail: data.email,
        mainGoals: data.helpWith,
        companyName: data.companyName,
        phoneNumber: phoneNumber.value,
        interestedProduct: data.modules,
      })
      if (success) {
        // toast.add({
        //   title: 'Success',
        //   description: reason || 'Thanks for reaching out! We\'ll message you shortly',
        //   color: 'success',
        // })
      }
      else {
        toast.add({
          title: 'Failed',
          description: reason,
          color: 'error',
        })
      }
    }
    catch (err) {
      const e = err as FetchError
      toast.add({
        title: 'Failed',
        color: 'error',
        description: e.data?.reason ?? 'Internal server error',
      })
    }
    finally {
      pending.value = false
    }
  }

  function onSuccess() {
    open.contactSale = false
    open.success = true
    clearAll()
  }

  function submit(fn: () => void = noop) {
    return async (_: FormSubmitEvent<IContactSaleSchema>) => {
      await execute()
      onSuccess()
      fn()
    }
  }

  function clearAll() {
    data.name = ''
    data.phone = ''
    data.email = ''
    data.modules = []
    data.helpWith = ''
    data.companyName = ''
    data.phoneCode = defaultCode
  }

  return {
    open,
    data,
    FIELD_NAME,
    pending,
    clearAll,
    execute,
    submit,
  }
}
