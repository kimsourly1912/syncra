import { QUERY_VALUE } from '@/data/auth.data'
import { phoneCodes } from '@/data/common.data'
import type { FormSubmitEvent } from '@nuxt/ui'
import { forgotEmailSchema, forgotPhoneSchema, forgotPasswordSchema, forgotOtpSchema } from '@/schema/auth.schema'
import type { IForgotEmailSchema, IForgotOtpSchema, IForgotPasswordSchema, IForgotPhoneSchema } from '@/schema/auth.schema'
import type { AuthDTO, BaseDTO } from '@/types/dto'
import * as authServices from '@/services/auth.service'

interface ShowItem {
  reset: boolean
  otp: boolean
  confirm: boolean
  success: boolean
}

export function useForgotPassword() {
  const { selectedTab } = useAuth()
  const { toast } = useAppToast()
  const signOTP = otpProps()
  const signEmail = emailProps()
  const signPhone = phoneProps()
  const signPassword = passwordProps()

  const show = reactive<ShowItem>({
    reset: false,
    otp: false,
    confirm: false,
    success: false,
  })

  const asyncDataCodeEmail = useAsyncData(
    () => forgotCodeEmail({ email: signEmail.data.email }),
    { immediate: false },
  )

  const asyncDataCodePhone = useAsyncData(
    () => forgotCodePhone({ phoneNumber: signPhone.phoneNumber.value }),
    { immediate: false },
  )

  const asyncDataPassword = useAsyncData(
    () => {
      return selectedTab.value === 'email'
        ? forgotEmail({
            code: signOTP.data.otp,
            email: signOTP.username.value,
            newPassword: signPassword.data.confirmPassword,
          })
        : forgotPhone({
            code: signOTP.data.otp,
            phoneNumber: signOTP.username.value,
            newPassword: signPassword.data.confirmPassword,
          })
    },
    { immediate: false },
  )

  async function onExecute<T>(fn: () => Promise<T>) {
    try {
      const { data, success, reason } = await fn() as BaseDTO.BaseRes<AuthDTO.SignInData>
      if (success) {
        show.success = true
        toast.add('success', { title: 'Update Password', description: reason })
        return data
      }
      else {
        toast.add('error', { title: 'Failed', description: reason })
      }
    }
    catch (e) {
      toast.addException(e)
    }
  }

  async function onExecuteVerifyOTP<T>(fn: () => Promise<T>, successFn: () => void = noop) {
    try {
      const { data, success, reason } = await fn() as BaseDTO.BaseRes<string>
      if (success) {
        show.otp = true
        successFn()
        toast.add('success', { title: 'Verification Code', description: data })
        return data
      }
      else {
        toast.add('error', { title: 'Failed', description: reason })
      }
    }
    catch (e) {
      toast.addException(e)
    }
  }

  async function forgotCodeEmail(req: AuthDTO.ForgotCodeEmailReq) {
    return onExecuteVerifyOTP(
      () => authServices.forgotCodeEmail(req),
      () => signOTP.username.value = req.email,
    )
  }

  async function forgotCodePhone(req: AuthDTO.ForgotCodePhoneReq) {
    return onExecuteVerifyOTP(
      () => authServices.forgotCodePhone(req),
      () => signOTP.username.value = req.phoneNumber,
    )
  }

  function forgotEmail(req: AuthDTO.ForgotEmailReq) {
    return onExecute(() => authServices.forgotEmail(req))
  }

  async function forgotPhone(req: AuthDTO.ForgotPhoneReq) {
    return onExecute(() => authServices.forgotPhone(req))
  }

  function emailProps() {
    const schema = forgotEmailSchema

    const data = reactive<IForgotEmailSchema>({
      email: '',
    })

    function clear() {
      data.email = ''
    }

    function submit(_evt: FormSubmitEvent<IForgotEmailSchema>) {
    }

    return {
      data,
      schema,
      clear,
      submit,
    }
  }

  function phoneProps() {
    const defaultCode = phoneCodes[0] ?? ''

    const schema = forgotPhoneSchema

    const data = reactive<IForgotPhoneSchema>({
      phone: '',
      code: defaultCode,
    })

    const phoneNumber = computed(() => `${data.code}${data.phone}`)

    function clear() {
      data.phone = ''
      data.code = defaultCode
    }

    function submit(_evt: FormSubmitEvent<IForgotPhoneSchema>) {
    }

    return {
      data,
      schema,
      submit,
      clear,
      phoneNumber,
    }
  }

  function passwordProps() {
    const schema = forgotPasswordSchema

    const data = reactive<IForgotPasswordSchema>({
      newPassword: '',
      confirmPassword: '',
    })

    function clear() {
      data.newPassword = ''
      data.confirmPassword = ''
    }

    function submit(_evt: FormSubmitEvent<IForgotPasswordSchema>) {
    }

    return {
      data,
      schema,
      submit,
      clear,
    }
  }

  function otpProps() {
    type ISchema = IForgotOtpSchema

    const schema = forgotOtpSchema

    const data = reactive<ISchema>({
      otp: '',
    })

    const username = shallowRef('')
    const code = shallowRef<string[]>([])

    function submit(_evt: FormSubmitEvent<ISchema>) {
      show.confirm = true
    }

    function clear() {
      data.otp = ''
      code.value = []
      username.value = ''
    }

    watch(code, (v) => {
      data.otp = v.filter(Boolean).join('')
    })

    return {
      data,
      username,
      schema,
      code,
      submit,
      clear,
    }
  }

  function resendOTP() {
    if (selectedTab.value === 'email') {
      asyncDataCodeEmail.execute()
    }
    else {
      asyncDataCodePhone.execute()
    }
  }

  function handleOpenReset() {
    show.reset = true
    selectedTab.value = QUERY_VALUE.email
  }

  function clearAll() {
    signOTP.clear()
    signPhone.clear()
    signEmail.clear()
    signPassword.clear()
    asyncDataCodeEmail.clear()
    asyncDataCodePhone.clear()
    asyncDataPassword.clear()
  }

  return {
    show,
    signOTP,
    signEmail,
    signPhone,
    selectedTab,
    signPassword,
    asyncDataCodeEmail,
    asyncDataCodePhone,
    asyncDataPassword,

    clearAll,
    onExecute,
    onExecuteVerifyOTP,
    forgotEmail,
    forgotPhone,
    forgotCodeEmail,
    forgotCodePhone,
    resendOTP,
    emailProps,
    phoneProps,
    passwordProps,
    otpProps,
    handleOpenReset,
  }
}
