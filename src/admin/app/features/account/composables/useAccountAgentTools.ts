import * as v from 'valibot'
import { toStandardJsonSchema } from '@valibot/to-json-schema'
import type { PortalUserRow } from '../models/portal-user'
import { ONBOARDING_BADGE } from '../utils/labels'
import type { useAccountList } from './useAccountList'

const searchAccounts = defineAgentTool({
  name: 'search_accounts',
  description: 'Search customer accounts on Account Management by name, email, or company, and list the matches with onboarding status, active modules, tokens, and seats. Shows the same results on screen. Read-only.',
  input: toStandardJsonSchema(v.object({
    search: v.pipe(
      v.string(),
      v.maxLength(100),
      v.description('Text to look for in names, emails, and companies. An empty string lists every account.'),
    ),
  })),
  // Names and emails are typed by customers.
  annotations: { readOnlyHint: true, untrustedContentHint: true },
})

function describeAccount(user: PortalUserRow) {
  const name = [user.firstname, user.lastname].filter(Boolean).join(' ')
  return [
    [name, user.email && `<${user.email}>`].filter(Boolean).join(' ') || 'No name',
    `user ${user.userId}`,
    user.companyId != null && `company ${user.companyId}`,
    user.onboardingStatus && ONBOARDING_BADGE[user.onboardingStatus].label.toLowerCase(),
    `${formatCount(user.moduleActiveCount)} modules`,
    `${formatCount(user.token)} tokens`,
    user.seatTotal != null && `seats ${user.seatUsed ?? 0}/${user.seatTotal}`,
  ].filter(Boolean).join(' · ')
}

/**
 * The account list's WebMCP tools (docs/agent-tools.md), for the list screen to offer while it's
 * mounted, where `runtimeConfig.public.agentTools` is on (`nuxt dev`) while WebMCP is a pilot. The
 * tool drives the list's own URL state, so the staff member sees what the agent searched for.
 */
export function useAccountAgentTools(list: ReturnType<typeof useAccountList>) {
  if (!useRuntimeConfig().public.agentTools) return

  useAgentTool(searchAccounts, {
    execute: async ({ search }) => {
      await list.setSearch(search)
      const failed = await whenListSettles(list)
      if (failed) return failed
      return describeListPage({
        noun: 'accounts',
        page: list.page.value,
        totalPages: list.totalPages.value,
        query: list.search.value ? `"${list.search.value}"` : 'no search',
        rows: list.items.value.map(describeAccount),
      })
    },
  })
}
