/**
 * Whether a sidebar link is the section the current page is in: its own page, a page under it
 * (`/product/create` under `/product`), or a page under one of `also` (Account management is `/`,
 * and its detail pages are `/account/<id>`). `/` matches only itself.
 *
 * @example
 * isSectionActive('/techpack-reviews/101', '/techpack-reviews')   // true
 * isSectionActive('/account/42', '/', ['/account'])               // true
 */
export function isSectionActive(path: string, to: string, also: readonly string[] = []) {
  const within = (base: string) => path === base || (base !== '/' && path.startsWith(`${base}/`))
  return within(to) || also.some(within)
}
