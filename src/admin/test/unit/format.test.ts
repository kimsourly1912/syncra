import { describe, expect, it } from 'vitest'
import { formatAge, formatChange, formatCount, formatDate, formatDateTime, formatMoney, NO_VALUE } from '../../app/utils/format'

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

  it('gives an age with the full date for its tooltip', () => {
    const now = new Date(2026, 10, 25, 12, 0)
    const when = formatAge(new Date(2026, 10, 22, 12, 0), now)
    expect(when.age).toBe('3 days ago')
    expect(when.full).toBe(formatDateTime(new Date(2026, 10, 22, 12, 0)))
    expect(formatAge(undefined)).toEqual({ age: NO_VALUE, full: undefined })
    expect(formatAge('soon')).toEqual({ age: 'soon', full: 'soon' })
  })
})
