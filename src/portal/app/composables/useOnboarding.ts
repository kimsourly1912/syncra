import { phoneCodes } from '@/data/common.data'
import type { OnboardingDTO } from '@/types/dto'
import type { StepperItem, FormSubmitEvent } from '@nuxt/ui'
import type { ICompanySchema, IRepresentativeSchema } from '@/schema/onboarding.schema'

export type UseOnboardingStepperType = 'company-details' | 'representative-details'

type StepperItemWithType<T, V = UseOnboardingStepperType> = {
  [K in keyof T]: K extends 'slot' | 'value' ? V : T[K]
}

type StepperItemWithValue = StepperItemWithType<StepperItem>

export function useOnboarding() {
  const profileStore = useProfileStore()

  const ASYNC_DATA = {
    onboardingPage: {
      company: 'company-onboarding',
      representative: 'representative-onboarding',
    },
    indexPage: {
      company: 'company-index',
      representative: 'representative-index',
    },
  }

  const defaultCode = phoneCodes[0] ?? ''
  const id = computed(() => profileStore.companyId)
  const step = shallowRef<UseOnboardingStepperType>('representative-details')

  const stepItems = computed(() => [
    {
      title: 'Representative Details',
      slot: 'representative-details' as const,
      description: 'Tell us about yourself and how can we reach you',
      value: 'representative-details',
    },
    {
      title: 'Company Details',
      slot: 'company-details' as const,
      description: 'Tell us about company',
      value: 'company-details',
    },
  ] satisfies StepperItemWithValue[])

  function representativeProps() {
    const data = reactive<IRepresentativeSchema>({
      phone: '',
      email: '',
      firstName: '',
      lastName: '',
      rolePosition: '',
      code: defaultCode,
    })

    const FIELD_NAME: IRepresentativeSchema = {
      code: 'code',
      phone: 'phone',
      email: 'email',
      lastName: 'lastName',
      firstName: 'firstName',
      rolePosition: 'rolePosition',
    }

    const phoneNumber = computed(() => `${data.code}${data.phone}`)

    const body = computed<OnboardingDTO.RepresentiveReq>(() => ({
      companyId: id.value,
      workEmail: data.email,
      countryCode: data.code,
      lastName: data.lastName,
      firstName: data.firstName,
      contactNumber: data.phone,
      rolePosition: data.rolePosition,
    }))

    function submit(fn: () => void = noop) {
      return async (_: FormSubmitEvent<IRepresentativeSchema>) => {
        fn()
      }
    }

    function clearAll() {
      data.phone = ''
      data.email = ''
      data.lastName = ''
      data.firstName = ''
      data.rolePosition = ''
      data.code = defaultCode
    }

    return {
      data,
      phoneNumber,
      FIELD_NAME,
      body,
      clearAll,
      submit,
    }
  }

  function companyProps() {
    const data = reactive<ICompanySchema>({
      name: '',
      size: '',
      phone: '',
      email: '',
      address: '',
      country: '',
      industry: '',
      code: defaultCode,
    })

    const FIELD_NAME: ICompanySchema = {
      code: 'code',
      name: 'name',
      size: 'size',
      phone: 'phone',
      email: 'email',
      address: 'address',
      country: 'country',
      industry: 'industry',
    }

    const phoneNumber = computed(() => `${data.code}${data.phone}`)

    const body = computed<OnboardingDTO.CompanyDetailReq>(() => ({
      companyId: id.value,
      companyName: data.name,
      companySize: data.size,
      industryType: data.industry,
      countryRegion: data.country,
      companyContact: data.phone,
      contactCountryCode: data.code,
      companyAddress: data.address,
      companyEmailAddress: data.email,
    }))

    function submit(fn: () => void = noop) {
      return async (_: FormSubmitEvent<ICompanySchema>) => {
        fn()
      }
    }

    function clearAll() {
      data.name = ''
      data.size = ''
      data.phone = ''
      data.email = ''
      data.address = ''
      data.country = ''
      data.industry = ''
      data.code = defaultCode
    }

    return {
      data,
      phoneNumber,
      FIELD_NAME,
      body,
      clearAll,
      submit,
    }
  }

  return {
    step,
    ASYNC_DATA,
    stepItems,
    phoneCodes,
    companyProps,
    representativeProps,
  }
}
