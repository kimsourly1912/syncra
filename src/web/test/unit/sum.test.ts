import { it, expect } from 'vitest'

function sum(a: number, b: number) {
  return a + b
}

it('should equal 2', () => {
  expect(sum(1, 1)).toBe(4)
})
