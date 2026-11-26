import { afterEach, describe, expect, it, vi } from 'vitest'
import { formatAge, formatChange, formatCount, formatDate, formatDateTime, formatMoney, NO_VALUE, parseCalendarDay } from '../format'

describe('format', () => {
  it('formats counts in one locale and dashes a missing one', () => {
    expect(formatCount(1234567)).toBe('1,234,567')
    expect(formatCount(0)).toBe('0')
    expect(formatCount(null)).toBe(NO_VALUE)
    expect(formatCount(undefined)).toBe(NO_VALUE)
  })

  it('signs a change except zero', () => {
    expect(formatChange(50)).toBe('+50')
    expect(formatChange(-1200)).toBe('-1,200')
    expect(formatChange(0)).toBe('0')
  })

  it('formats money and dashes a missing amount or currency', () => {
    expect(formatMoney(49, 'USD')).toBe('$49.00')
    expect(formatMoney(49.5, 'USD', { maximumFractionDigits: 0 })).toBe('$50')
    expect(formatMoney(null, 'USD')).toBe(NO_VALUE)
    expect(formatMoney(49, null)).toBe(NO_VALUE)
  })

  it('shows text that is not a date as sent, and nothing for a missing one', () => {
    expect(formatDate('not a date')).toBe('not a date')
    expect(formatDateTime('not a date')).toBe('not a date')
    expect(formatDate(null)).toBeUndefined()
    expect(formatDateTime('')).toBeUndefined()
  })

  it('formats dates in one locale', () => {
    const date = new Date(2026, 10, 25, 15, 4)
    expect(formatDate(date)).toBe('Nov 25, 2026')
    expect(formatDateTime(date)).toMatch(/^Nov 25, 2026, 3:04\sPM$/)
  })

  describe('a calendar day (no time)', () => {
    afterEach(() => {
      vi.unstubAllEnvs()
    })

    it.each(['America/New_York', 'Pacific/Honolulu', 'Asia/Phnom_Penh', 'Pacific/Kiritimati'])('is the same day in %s', (tz) => {
      vi.stubEnv('TZ', tz)
      expect(formatDate('2026-11-25')).toBe('Nov 25, 2026')
      expect(formatDateTime('2026-11-25')).toBe('Nov 25, 2026')
      expect(formatAge('2026-11-25', new Date(2026, 10, 28, 12)).full).toBe('Nov 25, 2026')
    })

    it('parses a calendar day for UCalendar, and nothing that is not one', () => {
      expect(parseCalendarDay('2024-02-29')?.toString()).toBe('2024-02-29')
      expect(parseCalendarDay('2026-02-29')).toBeUndefined()
      expect(parseCalendarDay('2026-11-25T10:00:00')).toBeUndefined()
    })

    it('shows a day that does not exist as sent', () => {
      expect(formatDate('2026-02-31')).toBe('2026-02-31')
      expect(formatDate('2026-13-01')).toBe('2026-13-01')
    })

    it('still reads a timestamp in the reader\'s zone', () => {
      vi.stubEnv('TZ', 'America/New_York')
      expect(formatDate('2026-11-25T02:00:00Z')).toBe('Nov 24, 2026')
    })
  })

  it('gives an age with the full date for its tooltip', () => {
    const now = new Date(2026, 10, 25, 12, 0)
    const when = formatAge(new Date(2026, 10, 22, 12, 0), now)
    expect(when.age).toBe('3 days ago')
    expect(when.full).toBe(formatDateTime(new Date(2026, 10, 22, 12, 0)))
    expect(formatAge(undefined)).toEqual({ age: NO_VALUE, full: undefined })
    expect(formatAge('soon')).toEqual({ age: 'soon', full: 'soon' })
  })
})
