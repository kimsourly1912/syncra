/** What the product screens show. There's no product API yet, so this is the UI's own shape, not a model of a response. */
export interface Product {
  id: string
  icon: string
  name: string
  description: string
  /** Whether the product's public detail page is live, or still "Coming soon". */
  detailLive: boolean
  /** Shown on the website's product list (the list's Active/Inactive). */
  active: boolean
  updatedAt: string
}
