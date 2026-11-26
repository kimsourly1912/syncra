import type { Plan } from '../models/plan'

const HOUR = 60 * 60 * 1000
const hoursAgo = (hours: number) => new Date(Date.now() - hours * HOUR).toISOString()

/**
 * Sample plans until the plan API exists (open question). The list and the edit page read the
 * same rows, so an edit link opens the plan it came from. Pages that show them say "Sample data".
 */
export const SAMPLE_PLANS: readonly Plan[] = [
  { id: '000', name: 'Starter', description: 'Sample description for this plan.', currency: 'USD', amount: 99, prefix: 'Starting from', billingType: 'Recurring', cycle: 'month', features: ['Sample feature one', 'Sample feature two'], active: true, updatedAt: hoursAgo(3) },
  { id: '001', name: 'Growth', description: 'Sample description for this plan.', currency: 'USD', amount: 249, prefix: '', billingType: 'Recurring', cycle: 'month', features: ['Sample feature one', 'Sample feature two', 'Sample feature three'], active: true, updatedAt: hoursAgo(30) },
  { id: '002', name: 'Business', description: 'Sample description for this plan.', currency: 'USD', amount: 2490, prefix: '', billingType: 'Recurring', cycle: 'year', features: ['Sample feature one'], active: false, updatedAt: hoursAgo(24 * 6) },
  { id: '003', name: 'Local', description: 'Sample description for this plan.', currency: 'KHR', amount: 400000, prefix: 'Starting from', billingType: 'Recurring', cycle: 'month', features: [], active: false, updatedAt: hoursAgo(24 * 20) },
]

export const findSamplePlan = (id: string) => SAMPLE_PLANS.find(plan => plan.id === id)
