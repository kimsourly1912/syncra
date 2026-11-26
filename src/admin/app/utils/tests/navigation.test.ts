import { describe, expect, it } from 'vitest'
import { isSectionActive } from '../navigation'

describe('isSectionActive', () => {
  it('matches the section page and the pages under it', () => {
    expect(isSectionActive('/techpack-reviews', '/techpack-reviews')).toBe(true)
    expect(isSectionActive('/techpack-reviews/101', '/techpack-reviews')).toBe(true)
    expect(isSectionActive('/product/create', '/product')).toBe(true)
  })

  it('does not match a path that only starts with the same letters', () => {
    expect(isSectionActive('/products', '/product')).toBe(false)
    expect(isSectionActive('/lead-inquiry-archive', '/lead-inquiry')).toBe(false)
  })

  it('matches / only on the home page, unless the section lists other paths', () => {
    expect(isSectionActive('/', '/')).toBe(true)
    expect(isSectionActive('/lead-inquiry', '/')).toBe(false)
    expect(isSectionActive('/account/42', '/')).toBe(false)
    expect(isSectionActive('/account/42', '/', ['/account'])).toBe(true)
  })
})
