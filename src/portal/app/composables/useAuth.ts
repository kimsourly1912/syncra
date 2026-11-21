import type { ShallowRef } from 'vue'
import { phoneCodes } from '@/data/common.data'
import type { FormSchema, Form } from '@nuxt/ui'
import type { AcceptLiteral } from '~/types/common'
import type { IQueryValue } from '@/data/auth.data'
import type { UserStatus } from '@/types/dto/auth.dto'
import { useFeatureFlags } from '~/composables/useFeatureFlags'
import { QUERY_KEY, tabItems, emailOnlyTabItems } from '@/data/auth.data'

interface AuthCredential {
  username?: string
  status?: AcceptLiteral<UserStatus> | null
  signType?: AcceptLiteral<'email' | 'phone'>
  fromRoute?: AcceptLiteral<'sign-in' | 'sign-up'>
}

export function useAuth() {
  const route = useRoute()
  const router = useRouter()

  const cookieKeys = {
    authCredential: 'auth-credential',
  }

  const authCredential = useCookie<AuthCredential | null>(cookieKeys.authCredential)

  const { hidePhoneSignUp } = useFeatureFlags()
  const fromQuery = route.query[QUERY_KEY.type] as IQueryValue
  const selectedTab = shallowRef<IQueryValue>(fromQuery ?? tabItems[0]!.value)

  const currentTabItems = computed(() =>
    hidePhoneSignUp.value ? emailOnlyTabItems : tabItems,
  )

  function inlineFormErrorMessage(el: Readonly<ShallowRef<unknown>>, name: string, message: string) {
    if (!el.value) return
    const e = el.value as Form<FormSchema>
    e.setErrors([{ name, message }], name)
  }

  function setCookie(data: AuthCredential | null) {
    authCredential.value = data
    refreshCookie(cookieKeys.authCredential)
  }

  watch(
    selectedTab,
    (type) => {
      router.replace({
        query: { [QUERY_KEY.type]: type },
      })
    },
    { immediate: true },
  )

  return {
    tabItems: currentTabItems,
    phoneCodes,
    selectedTab,
    fromQuery,
    authCredential,
    setCookie,
    inlineFormErrorMessage,
  }
}
