# Portal agent instructions

Portal (`src/portal`, package `@syncra/portal`, port 444) is the customer workspace. It covers Doc AI processing and results, the POM glossary, team management, company and account settings, token activity, the company activity log, and Bookkeeping. Stack: Nuxt 4 SPA, Nuxt UI 4, Tailwind 4, Pinia, Valibot, `@nuxtjs/i18n` (`en`, `zh`), and Vitest. The [root rules](../../AGENTS.md) and [shared conventions](../../docs/conventions.md) apply here too.

## Portal rules

- **Company scope.** Get `companyId` from `useProfileStore().companyId` and pass it to services in a `Param` object. Never read it from the route, the query string, or form input. Company-scoped services reject `companyId <= 0`.
- **Permissions are navigation only.** `usePermission`, `<ShowIf>`, `profileStore.isAdmin`, and the `auth` middleware decide what to show. The API decides what's allowed. A new route needs a guard. Exact-path route rules don't cover dynamic routes, so add `definePageMeta({ middleware: 'auth' })` there.
- **Requests.** Feature code calls service functions. Services call `useAPI`, which refreshes once on a 401. Don't call `$api`, `$fetch`, or `useFetch` directly. Handle both failure paths, and show success only after it's confirmed ([data access](docs/data-access.md)).
- **Structure.** New work goes in `app/features/<feature>/`, with a public `index.ts` and a thin route. Copy the reference files and avoid the legacy files listed in [architecture](docs/architecture.md#reference-code).
- **Doc AI identity.** Keep `jobId`, `formattedId`, and `fileId` distinct. Finalization sends the reviewed `expectedFileId`. A retry keeps the same company, job, and confirmed set. Estimates and recorded charges are different fields. See [Doc AI](../../docs/features/doc-ai.md).
- **Stale responses.** If the company, job, or record changes while a request is in flight, discard the late response. `useProfileStore().refreshBalance` shows the pattern.
- **Text.** New screens use `t()`, with keys in both `i18n/locales/en-US.json` and `zh-CN.json`. Flag new Chinese strings for human review. When editing an existing hardcoded English screen, stay consistent with it.

## Read for the task

| Task | Read |
| --- | --- |
| Where code goes, routes and guards, what to copy | [architecture](docs/architecture.md) |
| Calling the API, reads, writes, errors, polling | [data-access](docs/data-access.md) |
| Page layout, components, states, theme, i18n | [ui](docs/ui.md), then [building-blocks](docs/building-blocks.md) |
| Forms and validation | [forms](docs/forms.md) |
| New resource: list, create, edit, delete | [crud-recipe](docs/crud-recipe.md) |
| Tests | [testing](docs/testing.md) |
| Doc AI upload, retry, results, glossary, ERP | [Doc AI](../../docs/features/doc-ai.md), then the files it links |
| Roles, screens, journeys | [Product scope](../../docs/product/scope.md) |

## Verify

Run from the repository root:

```bash
pnpm --filter @syncra/portal lint
```

```bash
pnpm --filter @syncra/portal test:unit --run
```

```bash
pnpm --filter @syncra/portal test:nuxt --run
```

- Run one test file: `pnpm --filter @syncra/portal test:nuxt --run test/nuxt/invoice-workspace.test.ts`.
- Run `pnpm --filter @syncra/portal build` after changes to config, routing, or anything app-wide.
- For a changed workflow, check it in the browser as each affected role (Admin, Operator), using a test company. Report which responses were mocked.
