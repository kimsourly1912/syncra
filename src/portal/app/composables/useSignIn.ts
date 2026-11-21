import type { AuthDTO } from '@/types/dto'
import { phoneCodes } from '@/data/common.data'
import * as authServices from '@/services/auth.service'
import type { ISignInEmailSchema, ISignInPhoneSchema } from '@/schema/auth.schema'
import { AUTH_STATUS } from '@/constants/key'

export function useSignIn() {
  const { toast } = useAppToast()
  const profileStore = useProfileStore()
  const defaultCode = phoneCodes[0] ?? ''
  const { setCookie } = useAuth()
  const { password } = useAppState()

  const verifyMsg = (msg: string) => `We've sent a verification code to: ${msg}`

  async function onSuccess(_data: AuthDTO.SignInData) {
    profileStore.authStatus = AUTH_STATUS.AUTHENTICATED
    setCookie(null)
    await profileStore.execute()
    if (profileStore.onboarded || !profileStore.isAdmin) {
      navigateTo({ path: toRoute('/'), replace: true })
      toast.add('success', { title: 'Welcome Back', description: 'Good to see you again. 🌟' })
    }
    else {
      navigateTo({ path: toRoute('/onboarding'), replace: true })
      toast.add('success', { title: 'Welcome Onboarding', description: 'Good to see you. 🌟' })
    }
  }

  function emailProps() {
    const data = reactive<ISignInEmailSchema>({
      email: '',
      password: '',
    })

    const { execute, pending } = useAsyncData(async () => {
      try {
        // Clear old auth state before new login attempt
        // This prevents stale cookies from interfering with the new session
        profileStore.clear()

        const { success, reason, data: signData } = await authServices.signInByEmail({
          email: data.email,
          password: data.password,
        })
        const { userStatus } = signData

        if (success) {
          if (userStatus === 'CONFIRMED') {
            onSuccess(signData)
            return
          }

          password.value = data.password
          setCookie({
            signType: 'email',
            status: userStatus,
            fromRoute: 'sign-in',
            username: data.email,
          })
          navigateTo(toRoute('/auth/verify'))
          toast.add('success', { title: 'Verification Code', description: verifyMsg(data.email) })
        }
        else {
          toast.add('error', { title: 'Failed', description: reason })
        }
      }
      catch (e) {
        toast.addException(e)
      }
    }, { immediate: false })

    function clear() {
      data.email = ''
      data.password = ''
    }

    return {
      data,
      pending,
      clear,
      execute,
    }
  }

  function phoneProps() {
    const data = reactive<ISignInPhoneSchema>({
      phone: '',
      password: '',
      code: defaultCode,
    })

    const phoneNumber = computed(() => `${data.code}${data.phone}`)

    const { execute, pending } = useAsyncData(async () => {
      try {
        profileStore.clear()

        const { success, data: signData, reason } = await authServices.signInByPhone({
          phone: phoneNumber.value,
          password: data.password,
        })
        const { userStatus } = signData

        if (success) {
          if (userStatus === 'CONFIRMED') {
            onSuccess(signData)
            return
          }

          password.value = data.password
          setCookie({
            signType: 'phone',
            status: userStatus,
            fromRoute: 'sign-in',
            username: phoneNumber.value,
          })
          navigateTo(toRoute('/auth/verify'))
          toast.add('success', { title: 'Verification Code', description: verifyMsg(phoneNumber.value) })
        }
        else {
          toast.add('error', { title: 'Failed', description: reason })
        }
      }
      catch (e) {
        toast.addException(e)
      }
    }, { immediate: false })

    function clear() {
      data.phone = ''
      data.password = ''
      data.code = defaultCode
    }

    return {
      data,
      pending,
      phoneNumber,
      clear,
      execute,
    }
  }

  return {
    onSuccess,
    emailProps,
    phoneProps,
  }
}
