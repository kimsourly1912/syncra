# Admin agent instructions

Admin (`src/admin`, package `admin`, port 555) is Syncra's internal staff console. It covers company accounts (company info, modules, tokens, seats), TechPack review and release, lead inquiries, hero content, products, and plans and pricing. Stack: Nuxt 4 SPA, Nuxt UI 4 (no color mode), Tailwind 4, and Valibot. Admin has **no Pinia and no i18n**; its tests are Vitest `unit` and `nuxt` projects. The [root rules](../../AGENTS.md) and [shared conventions](../../docs/conventions.md) apply here too.

## Admin rules

- **Know what's wired.** Account Management, Account Detail, products, plans and pricing, hero, and lead pages are mostly static UI with hardcoded data and no submit wiring. TechPack review is the only workflow wired end to end. Before treating a screen as supported, confirm its endpoint and permissions, and record the gaps ([open questions](../../docs/product/open-questions.md#admin)).
- **Staff access is server-side.** The route guard (`access.global.ts`) only checks that a session exists. There is no staff role map. Never add a client-only permission check as if it were security.
- **Requests.** Services call `api` from `@/api` with a `model`; it renews the session on a 401 and needs no Nuxt context. Call services from a feature composable (`features/techpack-review` is the reference). Every failure is a thrown `ApiError`: one `catch`, `toast.error(e)`, and success only after the call resolves ([data access](docs/data-access.md)).
- **API contract.** Types and Valibot schemas are generated into `app/api/generated/` (`pnpm --filter admin api:gen`); never edit them or add DTO files. Every generated field is optional and nullable, so services pass feature models (`defineModel`) and never return raw API types ([data access](docs/data-access.md#the-api-contract)).
- **Session.** `useSession()` from `@/features/session` is the only session state. Pages are staff-only by default; guest pages set `definePageMeta({ access: 'guest', layout: 'auth' })` ([architecture](docs/architecture.md#routes-guards-and-the-sidebar)).
- **Review identity.** Review routes use `fileId`, and saves and approval use the current `draftUuid`. Approval needs the reviewer's attestation and the current inspection. See [Doc AI → results](../../docs/features/doc-ai.md#results-verification-and-exports).
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
pnpm --filter admin typecheck
```

```bash
pnpm --filter admin test
```

```bash
pnpm --filter admin build
```

Tests mock the API and never reach a real one ([testing](docs/testing.md)). Also check changed flows in the browser with `pnpm dev:admin` and a staff test account, and report what was static, mocked, or live.
