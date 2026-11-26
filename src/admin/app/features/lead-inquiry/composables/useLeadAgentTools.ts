import * as v from 'valibot'
import { toStandardJsonSchema } from '@valibot/to-json-schema'
import type { LeadRow } from '../models/lead'
import { LEAD_STATUS } from '../utils/status'
import { LEAD_STATUS_TABS } from './useLeadList'
import type { useLeadList } from './useLeadList'

const searchLeads = defineAgentTool({
  name: 'search_leads',
  description: 'Find sales lead inquiries on Lead Inquiries by status and by name, company, or email, and list them with their contact details, products of interest, and status. Shows the same results on screen. Read-only.',
  input: toStandardJsonSchema(v.object({
    status: v.optional(v.pipe(
      v.picklist(LEAD_STATUS_TABS),
      v.description('Which leads to list. Leave out to keep the current status tab; "all" lists every status.'),
    )),
    search: v.optional(v.pipe(
      v.string(),
      v.maxLength(100),
      v.description('Text to look for in names, companies, and emails. Leave out to keep the current search; an empty string clears it.'),
    )),
  })),
  // Lead fields are typed by visitors on the public contact form.
  annotations: { readOnlyHint: true, untrustedContentHint: true },
})

const openLead = defineAgentTool({
  name: 'open_lead',
  description: 'Open a lead listed on screen in the read-only detail panel, so the staff member can read the whole inquiry. Read-only.',
  annotations: { readOnlyHint: true, untrustedContentHint: true },
})

const name = (lead: LeadRow) => lead.fullName || 'Unnamed lead'
const code = (lead: LeadRow) => lead.inquiryCode ?? `#${lead.id}`

function describeLead(lead: LeadRow) {
  const products = lead.interestedProduct?.filter(Boolean) ?? []
  return [
    `${name(lead)} (${code(lead)})`,
    lead.companyName,
    lead.workEmail,
    lead.phoneNumber,
    products.length && `interested in ${products.join(', ')}`,
    lead.status && LEAD_STATUS[lead.status].label.toLowerCase(),
  ].filter(Boolean).join(' · ')
}

/**
 * The lead list's WebMCP tools (docs/agent-tools.md), for the list screen to offer while it's
 * mounted, where `runtimeConfig.public.agentTools` is on (`nuxt dev`) while WebMCP is a pilot. The
 * tools drive the list's own URL state, so the staff member sees what the agent asked for;
 * `open_lead` can only open a lead on screen.
 */
export function useLeadAgentTools(list: ReturnType<typeof useLeadList>) {
  if (!useRuntimeConfig().public.agentTools) return

  useAgentTool(searchLeads, {
    execute: async ({ status, search }) => {
      // The status first: changing it keeps the search, and the search keeps the status.
      if (status !== undefined && status !== list.tab.value) await list.showStatus(status)
      if (search !== undefined) await list.setSearch(search)
      const failed = await whenListSettles(list)
      if (failed) return failed
      const searched = list.search.value ? ` and "${list.search.value}"` : ''
      return describeListPage({
        noun: 'leads',
        page: list.page.value,
        totalPages: list.totalPages.value,
        query: `status "${list.tab.value}"${searched}`,
        rows: list.items.value.map(describeLead),
      })
    },
  })

  useAgentTool(openLead, {
    targets: list.items,
    key: lead => lead.id,
    label: lead => `${name(lead)} (${code(lead)})`,
    execute: async (_input, { target }) => {
      if (!target) return new Error('Pick a lead from list_targets.')
      await list.openLead(target.item.id)
      return `Opened ${target.label} in the detail panel.`
    },
  })
}
