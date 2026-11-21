# 0004: `@/` is the only app import alias

- Status: Accepted. Existing `~/` imports not yet migrated.
- Date: 2026-11-21
- Scope: Portal, Admin, Web

## Context

Nuxt maps both `@/` and `~/` to the app source folder (`app/`). The apps use both: 287 imports use `@/` and 44 use `~/`.

Portal's `vitest.config.ts` defines only the `@` alias for the `unit`, `integration`, and `e2e` projects. A file that imports with `~/` therefore can't be resolved in those non-Nuxt test projects. Only the `nuxt` project resolves it.

## Decision

- Use `@/` for every import from the app's own source, such as `@/services/glossary.service` or `@/features/glossary`.
- Use relative imports only inside one feature folder (see [0002](0002-feature-folders-and-public-api.md)) and in tests that already use them.
- Use Nuxt's virtual modules as they are, such as `#components` and `#imports`.
- Put type-only imports in their own `import type` statements.

## Alternatives

- **`~/` everywhere.** It's less common in the code and would need a vitest alias change too.
- **Allow both.** This keeps the test resolution problem, and agents have to guess which to use.

## Consequences

- When you touch a file that uses `~/`, change that file's imports to `@/`. Don't do mass rewrites in unrelated changes.
