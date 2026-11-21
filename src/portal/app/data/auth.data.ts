import type { TabsItem } from '@nuxt/ui'

export type IQueryKey = 'type'
export type IQueryValue = 'email' | 'phone'

export const QUERY_KEY = {
  type: 'type',
} satisfies Record<IQueryKey, IQueryKey>

export const QUERY_VALUE = {
  email: 'email',
  phone: 'phone',
} satisfies Record<IQueryValue, IQueryValue>

export enum CACHE_KEY {
  SignInEmail = 'sign-in-email',
  SignInPhone = 'sign-in-phone',

  SignUpEmail = 'sign-up-email',
  SignUpPhone = 'sign-up-phone',
  signUpOtp = 'sign-up-otp',

  forgotOtp = 'forgot-otp',
  forgotEmail = 'forgot-email',
  forgotPhone = 'forgot-phone',
  forgotPassword = 'forgot-password',
}

export enum FIELD_NAME {
  email = 'email',
  phone = 'phone',
  password = 'password',
  otp = 'otp',
  newPassword = 'newPassword',
  confirmPassword = 'confirmPassword',
}

// export enum FORM_REF {
//   email = 'form-email-ref',
//   phone = 'form-phone-ref',
//   otp = 'form-otp-ref',
// }

export const CODE_LENGTH = 6

export const tabItems = [
  {
    label: 'Email',
    slot: 'email' as const,
    value: QUERY_VALUE.email,
  },
  {
    label: 'Phone Number',
    slot: 'phone' as const,
    value: QUERY_VALUE.phone,
  },
] satisfies TabsItem[]

export const emailOnlyTabItems = [
  {
    label: 'Email',
    slot: 'email' as const,
    value: QUERY_VALUE.email,
  },
] satisfies TabsItem[]
