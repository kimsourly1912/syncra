export const REGX_USER_NAME = /^[\u4E00-\u9FA5a-zA-Z0-9_-]{4,16}$/

/** Phone reg */
export const REGX_PHONE
  = /^[1](([3][0-9])|([4][01456789])|([5][012356789])|([6][2567])|([7][0-8])|([8][0-9])|([9][012356789]))[0-9]{8}$/

export const REGX_INT = /^[\d]+$/

/**
 * Password reg
 *
 * 6-18 characters, including letters, numbers, and underscores
 */
export const REGX_PWD = /^\w{6,18}$/

/** Email reg */
export const REGX_EMAIL = /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/

/** Six digit code reg */
export const REGX_CODE_SIX = /^\d{6}$/

/** Four digit code reg */
export const REGX_CODE_FOUR = /^\d{4}$/

/** Url reg */
export const REGX_URL
  = /(((^https?:(?:\/\/)?)(?:[-;:&=+$,\w]+@)?[A-Za-z0-9.-]+(?::\d+)?|(?:www.|[-;:&=+$,\w]+@)[A-Za-z0-9.-]+)((?:\/[+~%/.\w-_]*)?\??(?:[-+=&;%@.\w_]*)#?(?:[\w]*))?)$/

export const HAS_MIN_LENGTH = /.{8,}/
export const HAS_DIGIT = /[0-9]/
export const HAS_SYMBOL = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/
export const HAS_LOWERCASE = /[a-z]/
export const HAS_UPPERCASE = /[A-Z]/
export const NO_WHITESPACE = /^\S+$/

export const REGX_AWS_PASSWORD = /^(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])(?=.*[a-z])(?=.*[A-Z])(?=\S+$).{8,}$/
