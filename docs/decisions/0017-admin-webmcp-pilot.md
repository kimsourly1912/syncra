# 0017: Admin pilots WebMCP with read-only list tools, in dev only

- Status: Accepted
- Date: 2026-11-26
- Scope: Admin

## Context

Nuxt 4.7 added `experimental.webmcp`: a page can offer tools to an AI agent in the browser (`defineAgentTool`, `useAgentTool`, `@tool`). WebMCP is a proposed standard, in early preview in Chrome behind a flag; production use needs an origin-trial token that expires. Staff spend time searching the account and lead lists, which agents could do for them. Whether an agent may act for staff (change a lead's status, approve a TechPack with the reviewer's attestation) is a product and permission question nobody has answered.

## Decision

1. Enable `experimental.webmcp` in every build, so the composables and their types exist, and turn Nuxt's `navigate` tool on only in `nuxt dev`.
2. Register Admin's tools only when `runtimeConfig.public.agentTools` is on (`nuxt dev` and tests).
3. Tools are read-only. They drive the list's own URL state and answer with the rows it loaded; they never call the API themselves.
4. Each feature has one `use<Feature>AgentTools(list)` composable, called by its screen. Input schemas are Valibot, wrapped in `toStandardJsonSchema`.
5. Results with customer- or visitor-typed text declare `untrustedContentHint`.

The rules are in [Admin agent tools](../../src/admin/docs/agent-tools.md).

## Alternatives

- **Wait for WebMCP to ship.** Nothing to learn until then; the pilot costs little and is off in builds.
- **`@tool` JSDoc on template handlers.** Less code, but list handlers take UI events and the tool's description would live in the template; a composable keeps the tool, its schema, and its answer testable together.
- **Tools that call the API directly.** The agent and the staff member would see different things, and the tool would duplicate the list's query.
- **Gate with `import.meta.dev`.** It's false in `@nuxt/test-utils`, so the tools couldn't be tested, and a test environment couldn't turn them on.
- **Write tools with `confirm`.** Deferred to the open question; approval needs the reviewer's own attestation.

## Consequences

- Staff with Chrome's flag can try agent search in `nuxt dev`; other browsers are unaffected.
- The client bundle grows by about 13 kB gzipped (Nuxt's tool registry and `@valibot/to-json-schema`), even with the tools off.
- Before turning tools on outside dev: an origin-trial token, an answer on agent actions, and a check of what agents do with lead content.
