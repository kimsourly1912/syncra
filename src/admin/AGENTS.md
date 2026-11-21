# Admin agent instructions

Admin (`src/admin`, package `admin`, port 555) is Syncra's internal staff console. It covers company accounts (company info, modules, tokens, seats), TechPack review and release, lead inquiries, hero content, products, and plans and pricing. Stack: Nuxt 4 SPA, Nuxt UI 4 (no color mode), Tailwind 4, and Valibot. Admin has **no Pinia, no i18n, and no tests** yet. The [root rules](../../AGENTS.md) and [shared conventions](../../docs/conventions.md) apply here too.

## Admin rules

- **Know what's wired.** Account Management, Account Detail, products, plans and pricing, hero, and lead pages are mostly static UI with hardcoded data and no submit wiring. TechPack review is the only workflow wired end to end. Before treating a screen as supported, confirm its endpoint and permissions, and record the gaps ([open questions](../../docs/product/open-questions.md#admin)).
- **Staff access is server-side.** The `auth` middleware only checks that a session exists. There is no staff role map. Never add a client-only permission check as if it were security.
- **Requests.** Go through `useAPI`, which refreshes on a 401 and logs out if that fails. Use a service in `app/services/` for new endpoints. TechPack pages call `useAPI` inline inside `nuxtApp.runWithContext`; that's legacy. Handle both failure paths, and show success only after it's confirmed ([data access](docs/data-access.md)).
- **Review identity.** Review routes use `fileId`, and saves and approval use the current `draftUuid`. Approval needs the reviewer's attestation and the current inspection. See [Doc AI → results](../../docs/features/doc-ai.md#results-verification-and-exports).
- **Route names are inverted.** In `app/constants/route.ts`, `routePublic` and `routePublicMap` are the **staff-protected** routes (`auth` middleware, `default` layout). `routePrivate` and `routePrivateMap` are the **guest** auth routes. Keep this in mind, and don't swap them without renaming in a dedicated change.
- **Structure.** New work goes in `app/features/<feature>/`, with an `index.ts` and a thin route. Copy the references in [architecture](docs/architecture.md#reference-code).
- **Text** is English only. There's no i18n module.

## Read for the task

| Task | Read |
| --- | --- |
| Where code goes, routes, sidebar, what to copy | [architecture](docs/architecture.md) |
| API calls, lists, writes, errors | [data-access](docs/data-access.md) |
| Page layout, components, states | [ui](docs/ui.md), [building-blocks](docs/building-blocks.md) |
| Forms | [forms](docs/forms.md) |
| Wiring a static screen, or a new staff CRUD | [crud-recipe](docs/crud-recipe.md) |
| Verification | [testing](docs/testing.md) |
| TechPack review behavior | [Doc AI](../../docs/features/doc-ai.md) |

## Verify

Run from the repository root:

```bash
pnpm --filter admin exec eslint .
```

```bash
pnpm --filter admin build
```

There's no test script. Check changed flows in the browser with `pnpm dev:admin` and a staff test account, and report what was static, mocked, or live.
