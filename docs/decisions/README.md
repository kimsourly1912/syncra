# Decision records

A decision record explains an architecture or documentation choice that had real alternatives. Read the matching record before changing the pattern it describes. To change a decision, add a new record that supersedes the old one. Don't silently rewrite the old record.

| ID | Decision | Status |
| --- | --- | --- |
| [0001](0001-agent-documentation-layout.md) | Root instructions plus one instruction file per app | Accepted |
| [0002](0002-feature-folders-and-public-api.md) | Feature folders with a public `index.ts` | Accepted. Lint enforcement pending. |
| [0003](0003-request-and-error-flow.md) | Service → feature composable → component, with both API failure paths handled | Accepted for Portal and Web. Superseded for Admin by 0008. |
| [0004](0004-import-alias.md) | `@/` is the only app import alias | Accepted. Existing `~/` imports not yet migrated. |
| [0005](0005-shared-conventions-location.md) | Shared code conventions live at the root; app docs keep only their differences | Accepted |
| [0006](0006-product-evidence-and-standards.md) | Product evidence stays in product docs; standards stay prescriptive | Accepted |
| [0007](0007-generated-api-contract.md) | Admin generates its API contract from OpenAPI and parses responses into feature models | Accepted. Envelope parsing moved into the client by 0008. |
| [0008](0008-admin-api-client-and-session.md) | Admin API client with one failure path, a session feature, and page-meta route access | Accepted. Admin only. |
| [0009](0009-admin-typed-endpoints-and-query-toolkit.md) | Admin endpoints typed from the spec, no service layer, and query, mutation, and list helpers | Accepted. Admin only. Item 8 superseded by 0010. |
| [0010](0010-admin-nuxt-ui-dashboard-shell.md) | Admin pages use Nuxt UI dashboard and page components; few shared components | Accepted. Admin only. |

## Template

Use the next free four-digit number and a short kebab-case title.

```markdown
# NNNN: <Decision title>

- Status: Proposed | Accepted | Superseded by NNNN
- Date: YYYY-MM-DD
- Scope: <apps or docs affected>

## Context
The concrete problem and the evidence behind it.

## Decision
What we do now, stated as rules an agent can follow.

## Alternatives
Each option we rejected and why.

## Consequences
What gets easier, what it costs, and any follow-up work.
```
