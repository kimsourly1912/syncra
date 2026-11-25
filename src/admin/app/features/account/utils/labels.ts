import type { BadgeProps } from '@nuxt/ui'
import type { OnboardingStatus } from '../models/portal-user'

/** A role code from the API ("COMPANY_ADMIN") as words ("Company admin"); other text is shown as sent. */
export function roleLabel(role: string | null | undefined) {
  if (!role) return undefined
  if (!/^[A-Z_]+$/.test(role)) return role
  const words = role.toLowerCase().replaceAll('_', ' ')
  return words.charAt(0).toUpperCase() + words.slice(1)
}

/**
 * A date for display. The API's date format isn't verified, so a value that doesn't parse is
 * shown as sent.
 */
export function formatDate(value: string | null | undefined) {
  if (!value) return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { dateStyle: 'medium' })
}

/** How each onboarding status reads in the account detail's header (the list's column says just Completed/Pending). */
export const ONBOARDING_BADGE: Record<OnboardingStatus, { label: string, color: BadgeProps['color'] }> = {
  COMPLETED: { label: 'Onboarding complete', color: 'success' },
  PENDING: { label: 'Onboarding pending', color: 'warning' },
}
