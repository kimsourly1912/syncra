# 0002: Feature folders with a public `index.ts`

- Status: Accepted. Lint enforcement pending for Portal and Web. For Admin, items 3 and 4 and the lint follow-up are superseded by [0015](0015-admin-feature-index-exports-screens.md).
- Date: 2026-11-21
- Scope: Portal, Admin, Web

## Context

Portal already has `app/features/workspace`, `glossary`, `token`, and `invite`. Admin has `app/features/account`. No feature has an `index.ts`. Code everywhere imports deep feature paths such as `@/features/workspace/components/WorkspaceCard.vue`.

One shared component, `src/portal/app/components/base/TokenBalanceBadge.vue`, imports from `@/features/token`. That reverses the dependency: shared code now depends on a feature.

Large route files hold whole workflows: `pages/workspace/create.vue` has 1,448 lines and `pages/team-management.vue` has 1,196. Agents copy the code they find, so these files spread.

## Decision

1. Code for one business area lives in `app/features/<feature>/`. Use only the folders the feature needs: `components/`, `composables/`, `schemas/`, `utils/`, `types.ts`, `data.ts`.
2. Route files in `app/pages/` stay thin. They hold `definePageMeta`, read route params and query, and render the feature's screen component. New routes must not contain workflow logic.
3. Each feature that other code imports from has an `index.ts`. It exports only building blocks other features need: display components, pickers, option composables, types, and pure helpers. It never exports screens or forms.
4. Code outside a feature imports only from `@/features/<feature>`. The one exception is a route file, which may import its own feature's screen component directly.
5. Inside a feature, use relative imports (`../composables/useX`).
6. Shared folders (`app/components`, `app/composables`, `app/utils`, `app/stores`) must not import from `app/features`. When a second feature or the app shell needs something, move it to the shared folder.
7. Name a feature folder after the resource or workflow it manages, in kebab-case: `team-management`, `glossary`, `techpack-review`.

## Alternatives

- **Keep organizing by technical role only** (`pages`, `components`, `services`). That works for small apps, but one workflow ends up spread over five folders, and screens grow inside pages.
- **Feature folders without a public API.** Deep imports couple features to each other's internals, and a rename in one feature breaks another.

## Consequences

- New work follows these rules now. Existing deep imports are legacy. Fix them when you touch the file, not in unrelated changes.
- `TokenBalanceBadge.vue` stays as known debt. The fix is to move the token data and types it needs into a shared folder, or to move the badge into the token feature and export it.
- **Follow-up (not done):** add an ESLint `no-restricted-imports` rule to each app that blocks `@/features/*/**` deep imports outside the owning feature, and blocks `@/features` imports from shared folders. Until then, reviewers enforce these rules.
