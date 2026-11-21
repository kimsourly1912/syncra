# 0006: Product evidence stays in product docs; standards stay prescriptive

- Status: Accepted
- Date: 2026-11-21
- Scope: Repository documentation

## Context

The earlier guides mixed rules with audit notes, such as "Observed in Brave", "compatibility snapshot on Windows", and the branch and commit the scope was read from (`refactor/architecture-and-ai-agent` at `b3c2e22`). An agent couldn't tell a rule from a past observation. The repository has since moved on.

## Decision

- **Standards** (`AGENTS.md` files, coding guides, decision records) state rules and point to reference code. They don't record when or how something was observed.
- **Product docs** ([`docs/product/scope.md`](../product/scope.md) and [`docs/features/`](../features)) describe current behavior. They keep the evidence labels (Observed, Source, Inferred, Open), because the evidence matters for product decisions.
- **Open questions** go in [`docs/product/open-questions.md`](../product/open-questions.md), with what would settle each one. An Open item never authorizes new behavior.
- Old session logs and dated compatibility snapshots are removed. Git history keeps them.

## Alternatives

- **Keep evidence inline in the coding guides.** This is the old state, and it was the problem.
- **Drop the evidence labels entirely.** Product owners need to know what was verified and what was inferred.

## Consequences

- When behavior changes, update the scope and the feature reference in the same change.
- When an open question is answered, record the answer in the doc that owns the rule and remove the question.
