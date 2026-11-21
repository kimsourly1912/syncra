# Decision records

A decision record explains an architecture or documentation choice that had real alternatives. Read the matching record before changing the pattern it describes. To change a decision, add a new record that supersedes the old one. Don't silently rewrite the old record.

| ID | Decision | Status |
| --- | --- | --- |
| [0001](0001-agent-documentation-layout.md) | Root instructions plus one instruction file per app | Accepted |
| [0002](0002-feature-folders-and-public-api.md) | Feature folders with a public `index.ts` | Accepted. Lint enforcement pending. |
| [0003](0003-request-and-error-flow.md) | Service → feature composable → component, with both API failure paths handled | Accepted. Shared result helper pending. |
| [0004](0004-import-alias.md) | `@/` is the only app import alias | Accepted. Existing `~/` imports not yet migrated. |
| [0005](0005-shared-conventions-location.md) | Shared code conventions live at the root; app docs keep only their differences | Accepted |
| [0006](0006-product-evidence-and-standards.md) | Product evidence stays in product docs; standards stay prescriptive | Accepted |
| [0007](0007-generated-api-contract.md) | Admin generates its API contract from OpenAPI and parses responses into feature models | Accepted. Admin only; all Admin services migrated. |

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
