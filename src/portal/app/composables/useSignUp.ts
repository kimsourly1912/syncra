import { phoneCodes } from '@/data/common.data'
import * as authServices from '@/services/auth.service'
import type { ISignUpEmailSchema, ISignUpPhoneSchema } from '@/schema/auth.schema'

export function useSignUp() {
  const { toast } = useAppToast()
  const defaultCode = phoneCodes[0] ?? ''
  const { setCookie } = useAuth()
  const { password } = useAppState()

  const verifyMsg = (msg: string) => `We've sent a verification code to: ${msg}`

  function emailProps() {
    const data = reactive<ISignUpEmailSchema>({
      email: '',
      password: '',
      confirmPassword: '',
    })

    const { execute, pending } = useAsyncData(async () => {
      if (data.password !== data.confirmPassword) {
        toast.add('error', { title: 'Failed', description: 'Passwords do not match' })
        return
      }
      else {
        try {
          const { data: signData, success, reason } = await authServices.signUpByEmail({
            email: data.email,
            password: data.password,
            confirmPassword: data.password,
          })
          const { message, userStatus } = signData

          if (success) {
            if (userStatus === 'CONFIRMED') {
              toast.add('error', { title: 'Failed', description: message })
              return
            }

            password.value = data.password
            setCookie({
              signType: 'email',
              status: userStatus,
              fromRoute: 'sign-up',
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
      }
    }, { immediate: false })

    function clear() {
      data.email = ''
      data.password = ''
      data.confirmPassword = ''
    }

    return {
      data,
      clear,
      execute,
      pending,
    }
  }

  function phoneProps() {
    const data = reactive<ISignUpPhoneSchema>({
      phone: '',
      password: '',
      confirmPassword: '',
      code: defaultCode,
    })

    const phoneNumber = computed(() => `${data.code}${data.phone}`)

    const { execute, pending } = useAsyncData(async () => {
      if (data.password !== data.confirmPassword) {
        toast.add('error', { title: 'Failed', description: 'Passwords do not match' })
        return
      }
      else {
        try {
          const { data: signData, success, reason } = await authServices.signUpByPhone({
            password: data.password,
            phoneNumber: phoneNumber.value,
            confirmPassword: data.confirmPassword,
          })
          const { message, userStatus } = signData

          if (success) {
            if (userStatus === 'CONFIRMED') {
              toast.add('error', { title: 'Failed', description: message })
              return
            }

            password.value = data.password
            setCookie({
              signType: 'phone',
              status: userStatus,
              fromRoute: 'sign-up',
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
      }
    }, { immediate: false })

    function clear() {
      data.phone = ''
      data.password = ''
      data.confirmPassword = ''
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
    emailProps,
    phoneProps,
  }
}
