import type { Product } from '../models/product'

const HOUR = 60 * 60 * 1000
const hoursAgo = (hours: number) => new Date(Date.now() - hours * HOUR).toISOString()

/**
 * Sample products until the product API exists (open question). The list and the edit page read
 * the same rows, so an edit link opens the product it came from. Pages that show them say
 * "Sample data".
 */
export const SAMPLE_PRODUCTS: readonly Product[] = [
  { id: '000', icon: '/img/doc-ai.png', name: 'Doc AI', description: 'Turns supply-chain documents into structured data.', detailLive: true, active: true, updatedAt: hoursAgo(2) },
  { id: '001', icon: '/img/qc.png', name: 'Quality Control', description: 'Sample description for this product.', detailLive: false, active: false, updatedAt: hoursAgo(26) },
  { id: '002', icon: '/img/production-planning.png', name: 'Production Planning', description: 'Sample description for this product.', detailLive: false, active: true, updatedAt: hoursAgo(72) },
  { id: '003', icon: '/img/score-card.png', name: 'Score Card', description: 'Sample description for this product.', detailLive: false, active: false, updatedAt: hoursAgo(24 * 9) },
  { id: '004', icon: '/img/carbon-offset.png', name: 'Carbon Offset', description: 'Sample description for this product.', detailLive: false, active: true, updatedAt: hoursAgo(24 * 30) },
]

export const findSampleProduct = (id: string) => SAMPLE_PRODUCTS.find(product => product.id === id)
