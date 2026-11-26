# Admin agent tools (WebMCP)

How Admin offers tools to an AI agent running in a staff member's browser, through [WebMCP](https://nuxt.com/docs/4.x/guide/ai/webmcp) (Nuxt 4.7, `experimental.webmcp`). This is a pilot ([0017](../../../docs/decisions/0017-admin-webmcp-pilot.md)): read-only list tools, on only in `nuxt dev`.

## What exists

| Tool | Screen | Does |
| --- | --- | --- |
| `search_accounts` | Account management (`/`) | Sets `?search=` and lists the accounts loaded |
| `search_leads` | Lead inquiries | Sets `?status=` and `?search=` and lists the leads loaded |
| `open_lead` | Lead inquiries | Opens a lead **on screen** in the read-only panel (`?lead=`); its targets are the rows shown |
| `navigate` | Any | Nuxt's own tool listing the app's pages; dev only |

## Rules

- **Read-only only.** A tool may read and change what's on screen (filters, search, an open panel), never data. Writes for an agent (lead status, TechPack approval, account actions) are an [open question](../../../docs/product/open-questions.md#admin); don't add one before it's answered.
- **Drive the screen's own state.** A tool calls the list composable's setters (`setSearch`, `showStatus`, `openLead`), then waits with `whenListSettles` and answers with `describeListPage` (`utils/agent-tools.ts`), so the staff member sees what the agent asked for and the URL keeps it. Never call `api` from a tool.
- **Where they live.** One `use<Feature>AgentTools(list)` composable per feature, called by the screen right after its list composable (`LeadListScreen.vue`). Tools are module-level `defineAgentTool` with a Valibot schema wrapped in `toStandardJsonSchema` (`@valibot/to-json-schema`), so the agent gets each parameter's description.
- **Gated.** The composable returns early unless `runtimeConfig.public.agentTools` is on: on in `nuxt dev` and in tests, off in builds (`NUXT_PUBLIC_AGENT_TOOLS=true` turns it on for a test environment).
- **Annotations.** Every tool sets `readOnlyHint`. A result that includes what customers or visitors typed (names, emails, lead fields) sets `untrustedContentHint`, so the agent treats it as data, not instructions.
- **Short results.** At most `AGENT_LIST_ROWS` (10) rows, about 1,500 characters; a failure returns an `Error` (no `try`/`catch`).
- **Security is unchanged.** Tools run in the staff member's session and make the screen's own requests. The API still decides access.

## Trying it

WebMCP is in early preview in Chrome only: enable `chrome://flags/#enable-webmcp-testing`, then `pnpm dev:admin` and sign in with a staff test account. Other browsers register nothing and Admin works as before. While you browse, `nuxt dev` writes the tools each page offers to `.nuxt/webmcp/schema.json`.

## Testing

`installModelContext()` from `#test/model-context` stands in for `navigator.modelContext`, so a screen test calls a tool the way an agent does (validation, targets, results). `features/lead-inquiry/tests/lead-agent-tools.nuxt.test.ts` is the reference. Cover the URL state set, the request sent, the answer, a refused input, and a failed load.
