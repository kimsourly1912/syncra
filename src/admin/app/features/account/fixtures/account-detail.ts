/**
 * Fictional data for the account detail's Modules, Tokens, and Seats tabs, which have no read
 * endpoint yet. The header and Company tab read the API.
 */
const sampleAccount = {
  name: 'Dara Sok',
  email: 'dara@mekonggarment.example',
  role: 'Company Admin',
  representative: {
    name: 'Maly Chan',
    email: 'maly@mekonggarment.example',
  },
}

export const sampleTokenTotals = {
  balance: 10_000,
  inflow: 50_000,
  outflow: 40_000,
}

export const sampleTokenHistory = [
  { activity: 'TechPack extraction', actor: sampleAccount.name, type: 'Usage', amount: -2_000, balance: 10_000, date: '20 Nov 2026' },
  { activity: 'Token top-up', actor: 'Syncra Admin', type: 'Credit', amount: 10_000, balance: 12_000, date: '19 Nov 2026' },
  { activity: 'Invoice extraction', actor: sampleAccount.name, type: 'Usage', amount: -3_000, balance: 2_000, date: '17 Nov 2026' },
  { activity: 'TechPack extraction', actor: sampleAccount.name, type: 'Usage', amount: -5_000, balance: 5_000, date: '15 Nov 2026' },
]

export const sampleMembers = [
  { name: sampleAccount.name, email: sampleAccount.email, role: sampleAccount.role, status: 'Active' },
  { name: sampleAccount.representative.name, email: sampleAccount.representative.email, role: 'Operator', status: 'Active' },
  { name: 'Vireak Lim', email: 'vireak@mekonggarment.example', role: 'Operator', status: 'Active' },
  { name: 'Sreypov Kim', email: 'sreypov@mekonggarment.example', role: 'Operator', status: 'Active' },
  { name: 'Bopha Kim', email: 'bopha@mekonggarment.example', role: 'Operator', status: 'Active' },
  { name: 'Rithy Ly', email: 'rithy@mekonggarment.example', role: 'Operator', status: 'Active' },
]

export const sampleSeatTotals = { total: 20, used: 6 }
export const sampleSeatHistory = [
  { activity: 'Seats added', actor: 'Syncra Admin', change: 10, date: '20 Nov 2026' },
  { activity: 'Seats deducted', actor: 'Syncra Admin', change: -2, date: '12 Nov 2026' },
  { activity: 'Seats added', actor: 'Syncra Admin', change: 12, date: '1 Nov 2026' },
]
