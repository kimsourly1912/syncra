import { formatTimeAgo } from '@vueuse/core'

/**
 * Numbers, money, and dates for display. Admin's text is English only, so every value is
 * formatted for one locale, whatever the browser's: `1,234`, never `1.234` beside English words.
 * A value the API leaves out shows as `NO_VALUE`.
 */
const LOCALE = 'en-US'

/** What a missing value shows as. */
export const NO_VALUE = '—'

const integer = new Intl.NumberFormat(LOCALE)
const signed = new Intl.NumberFormat(LOCALE, { signDisplay: 'exceptZero' })

/** `1234` → `1,234`; missing → `—`. */
export function formatCount(value: number | null | undefined) {
  return value == null ? NO_VALUE : integer.format(value)
}

/** A change, with its sign: `+50`, `-20`, `0`. */
export function formatChange(value: number) {
  return signed.format(value)
}

interface MoneyOptions {
  /** Default 2; list rows use 0 to keep columns short. */
  maximumFractionDigits?: number
}

/** `formatMoney(49, 'USD')` → `$49.00`; a missing amount or currency → `—`. */
export function formatMoney(amount: number | null | undefined, currency: string | null | undefined, options: MoneyOptions = {}) {
  if (amount == null || !currency) return NO_VALUE
  const { maximumFractionDigits = 2 } = options
  return new Intl.NumberFormat(LOCALE, { style: 'currency', currency, maximumFractionDigits }).format(amount)
}

/**
 * The API's date strings aren't verified (some may have no time zone). Returns the parsed date,
 * the text as sent when it doesn't parse, or undefined when there's none.
 */
function parse(value: string | Date | null | undefined) {
  if (value == null || value === '') return undefined
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? String(value) : date
}

/** `Nov 25, 2026`. Text that isn't a date is shown as sent; missing → undefined. */
export function formatDate(value: string | Date | null | undefined) {
  const date = parse(value)
  return date instanceof Date ? date.toLocaleDateString(LOCALE, { dateStyle: 'medium' }) : date
}

/** `Nov 25, 2026, 3:04 PM`. Text that isn't a date is shown as sent; missing → undefined. */
export function formatDateTime(value: string | Date | null | undefined) {
  const date = parse(value)
  return date instanceof Date ? date.toLocaleString(LOCALE, { dateStyle: 'medium', timeStyle: 'short' }) : date
}

/**
 * A date as an age (`3 days ago`) and in full, for its tooltip:
 * `<span :title="when.full">{{ when.age }}</span>`. Text that isn't a date is shown as sent in
 * both; missing → `—` and no tooltip.
 */
export function formatAge(value: string | Date | null | undefined, now: Date | number = Date.now()) {
  const date = parse(value)
  if (date === undefined) return { age: NO_VALUE, full: undefined }
  if (!(date instanceof Date)) return { age: date, full: date }
  return { age: formatTimeAgo(date, {}, now), full: formatDateTime(date) }
}
