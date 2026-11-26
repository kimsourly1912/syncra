import { CalendarDate, DateFormatter, getLocalTimeZone, parseDate } from '@internationalized/date'
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
const CALENDAR_DAY = /^\d{4}-\d{2}-\d{2}$/

/** A calendar day is the same day for every reader, so it's formatted in UTC from UTC midnight. */
const dayFormat = new DateFormatter(LOCALE, { dateStyle: 'medium', timeZone: 'UTC' })

/**
 * `'2026-11-25'` as a `CalendarDate` (`@internationalized/date`, the type `UCalendar` and
 * `UInputDate` use), or undefined when it isn't one: not that shape, or a day that doesn't exist
 * (`2026-02-31`).
 */
export function parseCalendarDay(value: string): CalendarDate | undefined {
  if (!CALENDAR_DAY.test(value)) return undefined
  try {
    return parseDate(value)
  }
  catch {
    return undefined
  }
}

/**
 * The API's date strings aren't verified (some may have no time zone). Returns a calendar day,
 * an instant, the text as sent when it's neither, or undefined when there's none.
 *
 * A calendar day stays a day: `new Date('2026-11-25')` would read it as UTC midnight, which is
 * Nov 24 west of UTC. A timestamp is read in the reader's zone.
 */
function parse(value: string | Date | null | undefined): CalendarDate | Date | string | undefined {
  if (value == null || value === '') return undefined
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? String(value) : value
  if (CALENDAR_DAY.test(value)) return parseCalendarDay(value) ?? value
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date
}

/** `Nov 25, 2026`. Text that isn't a date is shown as sent; missing → undefined. */
export function formatDate(value: string | Date | null | undefined) {
  const date = parse(value)
  if (date instanceof CalendarDate) return dayFormat.format(date.toDate('UTC'))
  return date instanceof Date ? date.toLocaleDateString(LOCALE, { dateStyle: 'medium' }) : date
}

/** `Nov 25, 2026, 3:04 PM`; a calendar day has no time, so it's `Nov 25, 2026`. Text that isn't a date is shown as sent; missing → undefined. */
export function formatDateTime(value: string | Date | null | undefined) {
  const date = parse(value)
  if (date instanceof CalendarDate) return dayFormat.format(date.toDate('UTC'))
  return date instanceof Date ? date.toLocaleString(LOCALE, { dateStyle: 'medium', timeStyle: 'short' }) : date
}

/**
 * A date as an age (`3 days ago`) and in full, for its tooltip:
 * `<span :title="when.full">{{ when.age }}</span>`. Text that isn't a date is shown as sent in
 * both; missing → `—` and no tooltip. A calendar day's age counts from its local midnight.
 */
export function formatAge(value: string | Date | null | undefined, now: Date | number = Date.now()) {
  const date = parse(value)
  if (date === undefined) return { age: NO_VALUE, full: undefined }
  if (typeof date === 'string') return { age: date, full: date }
  const instant = date instanceof CalendarDate ? date.toDate(getLocalTimeZone()) : date
  return { age: formatTimeAgo(instant, {}, now), full: formatDateTime(value) }
}
