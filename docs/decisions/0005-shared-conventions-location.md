# 0005: Shared code conventions live at the root; app docs keep only their differences

- Status: Accepted
- Date: 2026-11-21
- Scope: Repository documentation

## Context

All three apps use the same stack and the same team conventions: Nuxt 4, Nuxt UI 4, Tailwind 4, Valibot, and TypeScript. They share the same service and DTO shapes and the same naming. If we write these rules three times, the copies will drift apart. But each app also has real differences:

- Portal uses Pinia and i18n.
- Admin has no i18n, no Pinia, and no tests.
- Web uses a public API client without credentials.

## Decision

- [`docs/conventions.md`](../conventions.md) holds the rules that are the same in all apps: TypeScript style, naming, the service and DTO shape, Valibot schemas, the response envelope, and file naming.
- Each app's docs hold only that app's rules and the ways it differs from the shared ones. They link to the shared section instead of copying it.
- If the apps are ever split into separate git repositories, copy `docs/conventions.md` into each repository at that point.

## Alternatives

- **A full copy in each app.** Every app is then self-contained, but there are three copies to keep in sync. Agents already load the root instructions, so the copies add little.
- **Everything at the root.** App differences get lost among the shared rules, and Codex loads more text than a task needs.

## Consequences

- When a shared convention changes, edit one file.
- App docs must say plainly when they differ from the shared rules.
