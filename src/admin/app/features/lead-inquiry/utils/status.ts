import type { BadgeProps } from '@nuxt/ui'
import type { LeadStatus } from '../models/lead'

/** How each lead status reads in a badge. */
export const LEAD_STATUS: Record<LeadStatus, { label: string, color: BadgeProps['color'] }> = {
  NEW: { label: 'New', color: 'info' },
  CONTACTED: { label: 'Contacted', color: 'warning' },
  CONVERTED: { label: 'Converted', color: 'success' },
  NOT_INTERESTED: { label: 'Not interested', color: 'neutral' },
}
