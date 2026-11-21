import * as authServices from '@/services/auth.service'
import type { ISignUpOtpSchema } from '@/schema/auth.schema'

export function useOTP() {
  const { toast } = useAppToast()
  const { authCredential } = useAuth()
  const appState = useAppState()
  const { onSuccess } = useSignIn()

  const password = computed(() => appState.password.value)
  const isFromSignUp = computed(() => fromRoute.value === 'sign-up')
  const fromRoute = computed(() => authCredential.value?.fromRoute ?? '')
  const isEmail = computed(() => authCredential.value?.signType === 'email')
  const pendingAll = computed(() =>
    pendingVerifyEmail.value
    || pendingVerifyPhone.value
    || pendingResendEmailOTP.value
    || pendingResendPhoneOTP.value)

  const data = reactive<ISignUpOtpSchema>({
    otp: '',
  })

  const code = shallowRef<string[]>([])
  const username = shallowRef(authCredential.value?.username ?? '')

  async function handleSubmit() {
    if (!username.value || !password.value) {
      toast.add('error', { title: 'Failed', description: 'No username provided' })
      return
    }

    if (isEmail.value) {
      await executeVerifyEmail()
    }
    else {
      await executeVerifyPhone()
    }
  }

  async function handleResend() {
    if (!username.value || !password.value) {
      toast.add('error', { title: 'Failed', description: 'No username provided' })
      return
    }

    try {
      if (isEmail.value) {
        await executeResendEmailOTP()
        if (dataResendEmailOTP) {
          code.value = []
          toast.add('success', {
            title: 'OTP Sent',
            description: 'Verification code sent to, please check your email to confirm',
          })
        }
      }
      else {
        await executeResendPhoneOTP()
        if (dataResendPhoneOTP) {
          code.value = []
          toast.add('success', {
            title: 'OTP Sent',
            description: 'Verification code sent to, please check your phone to confirm',
          })
        }
      }
    }
    catch (e) {
      toast.addException(e)
    }
  }

  const { execute: executeVerifyEmail, pending: pendingVerifyEmail, data: dataVerifyEmail } = useAsyncData(async () => {
    try {
      const { reason, success, data: signData } = await authServices.verifyEmailOTP({
        code: data.otp,
        email: username.value,
        password: password.value,
      })
      if (success) {
        onSuccess(signData)
        return signData
      }
      else {
        toast.add('error', { title: 'Failed', description: reason })
      }
    }
    catch (e) {
      toast.addException(e)
    }
  }, { immediate: false })

  const { execute: executeVerifyPhone, pending: pendingVerifyPhone, data: dataVerifyPhone } = useAsyncData(async () => {
    try {
      const { reason, success } = await authServices.verifyPhoneOTP({
        code: data.otp,
        phoneNumber: username.value,
      })
      if (success) {
        return true
      }
      else {
        toast.add('error', { title: 'Failed', description: reason })
      }
    }
    catch (e) {
      toast.addException(e)
    }
  }, { immediate: false })

  const { execute: executeResendEmailOTP, pending: pendingResendEmailOTP, data: dataResendEmailOTP } = useAsyncData(async () => {
    try {
      const { reason, success } = await authServices.resendOTPEmail({
        email: username.value,
      })
      if (success) {
        return true
      }
      else {
        toast.add('error', { title: 'Failed', description: reason })
      }
    }
    catch (e) {
      toast.addException(e)
    }
  }, { immediate: false })

  const { execute: executeResendPhoneOTP, pending: pendingResendPhoneOTP, data: dataResendPhoneOTP } = useAsyncData(async () => {
    try {
      const { reason, success } = await authServices.resendOTPPhone({
        phone: username.value,
      })
      if (success) {
        return true
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
    data.otp = ''
    username.value = ''
    code.value = []
  }

  watch(code, (v) => {
    data.otp = v.filter(Boolean).join('')
  })

  return {
    data,
    code,
    isEmail,
    username,
    isFromSignUp,
    dataVerifyEmail,
    dataVerifyPhone,
    dataResendEmailOTP,
    dataResendPhoneOTP,
    pendingAll,
    clear,
    handleResend,
    handleSubmit,
    executeVerifyEmail,
    pendingVerifyEmail,
    executeVerifyPhone,
    pendingVerifyPhone,
    pendingResendEmailOTP,
    pendingResendPhoneOTP,
  }
}
