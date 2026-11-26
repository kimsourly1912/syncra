import { describe, expect, it } from 'vitest'
import * as v from 'valibot'
import { PASSWORD_RULES } from '@/features/auth'
import { generatePassword } from '../utils/generate-password'

describe('generatePassword', () => {
  it('always meets every password rule', () => {
    for (let i = 0; i < 500; i++) {
      const password = generatePassword()
      for (const rule of PASSWORD_RULES) expect(v.is(rule.schema, password), `${rule.text}: ${password}`).toBe(true)
    }
  })

  it('has the requested length and leaves out look-alike characters', () => {
    const password = generatePassword(24)
    expect(password).toHaveLength(24)
    expect(password).not.toMatch(/[Il1O0]/)
  })

  it('differs between calls', () => {
    expect(new Set(Array.from({ length: 50 }, () => generatePassword())).size).toBe(50)
  })
})
