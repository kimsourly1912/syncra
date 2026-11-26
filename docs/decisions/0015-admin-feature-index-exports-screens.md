# 0015: Admin feature indexes export their screens, and lint enforces the boundary

- Status: Accepted
- Date: 2026-11-26
- Scope: Admin. Supersedes 0002 items 3 and 4, and its lint follow-up, for Admin only.

## Context

Decision 0002 says a feature's `index.ts` "never exports screens or forms", and that a route may import its own feature's screen directly. Admin's practice differs. Every Admin feature's `index.ts` exports its screens. The architecture doc tells routes to render "one screen from a feature's index.ts". Lint fails any `@/features/<f>/…` import, so a route can't reach a screen file directly.

0002 also lists lint enforcement as a follow-up not yet done. Admin's `eslint.config.mjs` now blocks deep feature imports, `~/` imports, and `@/api` in pages, shared components, and layouts. Shared code importing a feature is limited to the app wiring (`layouts/`, `plugins/`, `middleware/`), which uses `features/session`.

Portal and Web have no feature `index.ts` yet, so nothing there contradicts 0002.

## Decision

For Admin:

1. A feature's `index.ts` is its only entry point. It exports the screens its routes render, and the building blocks other features use (composables, schemas, components such as `PasswordSuggestion`, and types).
2. Everything outside the feature imports from `@/features/<feature>`, routes included. There's no direct import of a screen file.
3. Inside a feature, use relative imports (unchanged from 0002).
4. `eslint.config.mjs` enforces the boundary. It's the rule of record; the docs describe it.
5. Fixtures and sample lookups aren't exported. A route passes its param to a feature screen (`ProductEditScreen :id`), and the screen decides what to show.

## Alternatives

- **Keep 0002's wording and allow a direct route import of the screen.** Lint would need an exception for every route-to-screen import. That brings back the deep imports the rule exists to stop.
- **Rewrite 0002 in place.** The decisions README asks for a superseding record, so the history stays readable.

## Consequences

- A screen rename only changes the feature and its `index.ts`.
- Portal and Web still follow 0002 as written until they add feature indexes.

## Follow-up

- 2026-11-26: Indexes had grown to export what nothing outside the feature imported (auth's sign-in, reset, and schema internals; model types in five features). They're trimmed, and `app/features/tests/feature-exports.test.ts` fails any export that code outside the feature doesn't import. A feature's own tests import its files directly.
