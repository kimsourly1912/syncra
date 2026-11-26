/** What the plan screens show. There's no plan API yet, so this is the UI's own shape, not a model of a response. */
export interface Plan {
  id: string
  name: string
  description: string
  currency: 'USD' | 'KHR'
  amount: number
  /** Shown before the price on the website, e.g. "Starting from". */
  prefix: string
  billingType: string
  cycle: 'month' | 'year'
  features: string[]
  /** Shown on the website's Plan & Pricing page (the list's Active/Inactive). */
  active: boolean
  updatedAt: string
}
