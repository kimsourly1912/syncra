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

/** `2026-11-25`: a calendar day with no time (the spec's `format: date`). */
const CALENDAR_DAY = /^(\d{4})-(\d{2})-(\d{2})$/

/** A calendar day as local midnight, or undefined for one that doesn't exist (`2026-02-31`). */
function calendarDay(value: string) {
  const match = CALENDAR_DAY.exec(value)
  if (!match) return undefined
  const [year, month, day] = [Number(match[1]), Number(match[2]) - 1, Number(match[3])]
  const date = new Date(year, month, day)
  return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day ? date : undefined
}

/**
 * The API's date strings aren't verified (some may have no time zone). Returns the parsed date,
 * the text as sent when it doesn't parse, or undefined when there's none.
 *
 * A calendar day is that day wherever the reader is. `new Date('2026-11-25')` would read it as
 * UTC midnight, which is Nov 24 west of UTC.
 */
function parse(value: string | Date | null | undefined) {
  if (value == null || value === '') return undefined
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? String(value) : value
  if (CALENDAR_DAY.test(value)) return calendarDay(value) ?? value
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date
}

/** `Nov 25, 2026`. Text that isn't a date is shown as sent; missing → undefined. */
export function formatDate(value: string | Date | null | undefined) {
  const date = parse(value)
  return date instanceof Date ? date.toLocaleDateString(LOCALE, { dateStyle: 'medium' }) : date
}

/** `Nov 25, 2026, 3:04 PM`; a calendar day has no time, so it's `Nov 25, 2026`. Text that isn't a date is shown as sent; missing → undefined. */
export function formatDateTime(value: string | Date | null | undefined) {
  if (typeof value === 'string' && CALENDAR_DAY.test(value)) return formatDate(value)
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
  return { age: formatTimeAgo(date, {}, now), full: formatDateTime(value) }
}
