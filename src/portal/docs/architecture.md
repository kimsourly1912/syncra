# Portal architecture

Where Portal code goes, what depends on what, how routes are guarded, and which files to copy. Shared rules are in [conventions](../../../docs/conventions.md). Product behavior is in the [product scope](../../../docs/product/scope.md).

## Folder layout

```text
src/portal/
├── app/
│   ├── pages/                      # file-based routes; thin for new work
│   ├── features/<feature>/         # one business area (decision 0002)
│   │   ├── index.ts                # public API: building blocks only, never screens or forms
│   │   ├── components/             # <Feature>Screen.vue, <Feature>FormModal.vue, private parts
│   │   ├── composables/            # use<Feature>.ts: reads, actions, pending, feedback
│   │   ├── schemas/                # <name>-form.ts: Valibot schema + form → Req mapping
│   │   ├── utils/                  # pure helpers (unit-tested)
│   │   ├── data.ts                 # static options, status maps
│   │   └── types.ts                # feature-only UI types (API types stay in types/dto)
│   ├── components/                 # shared UI, auto-registered, no folder prefix
│   │   ├── base/ layout/ modal/ form/ empty/ date/ app/
│   ├── composables/                # shared composables, auto-imported (useAPI, useAppToast, usePermission…)
│   ├── stores/                     # Pinia setup stores, auto-imported (useProfileStore, useApplicationStore)
│   ├── services/                   # <resource>.service.ts: transport only
│   ├── types/dto/                  # API contracts, re-exported as namespaces from index.ts
│   ├── schema/                     # existing app-level Valibot schemas (base.schema.ts building blocks)
│   ├── constants/                  # route.ts, key.ts (ASYNC_DATA, STATE, STORE_ID), app.ts, regx.ts
│   ├── data/                       # existing static option lists
│   ├── utils/                      # shared helpers, auto-imported (buildEndPoint, toRoute, tw, formatters)
│   ├── middleware/                 # auth, guest, onboarding
│   ├── layouts/                    # default (dashboard shell), auth, blank
│   └── plugins/                    # api.client.ts ($api), profile.client.ts, directive.client.ts
├── i18n/locales/                   # en-US.json, zh-CN.json
└── test/{unit,nuxt}/               # see testing.md
```

## Layers and dependencies

| Layer | Does | Must not |
| --- | --- | --- |
| Route (`pages/`) | `definePageMeta`, read route params and query, render the feature screen | Hold workflow logic, call services (new code) |
| Feature component | Render state, emit events, call composable actions | Call `useAPI` directly |
| Feature composable | Own `useAsyncData` reads, actions, pending and open state, toasts, and stale-response guards | Build URLs, or know about other features' internals |
| Store (`stores/`) | Session-wide state: profile, company, role, feature flags, token balance, layout | Hold one screen's data |
| Service (`services/`) | Endpoint, method, query and body, typed `useAPI` call | Catch errors, toast, read stores, navigate |
| DTO (`types/dto/`) | API request and response types | Contain form or UI types |

```text
pages → features/<f> (screen) → features/<f>/composables → services → useAPI → $api
                     ↘ components/ composables/ stores/ utils/ (shared)
shared folders  ✗→  features          feature A  ✗→  feature B internals (only B's index.ts)
```

### What gets imported automatically

- **Components** in `app/components/**` are registered globally by file name, without the folder (`pathPrefix: false`). File names must therefore be unique across the folder. Feature components aren't registered, so import them.
- **Composables** in `app/composables`, **utils** in `app/utils`, and **stores** in `app/stores` (via `@pinia/nuxt`) are auto-imported. So are Nuxt and Vue APIs.
- **VueUse isn't auto-imported** (`vueuse.autoImports: false`). Import it from `@vueuse/core`.
- **Feature code isn't auto-imported.** Import from `@/features/<feature>` from outside the feature, or with a relative path from inside it.
- **Services** are imported as namespaces: `import * as glossaryService from '@/services/glossary.service'`.

## Routes and guards

Routes come from files in `app/pages/`. Guards and layouts come from two places:

1. **`routeRules` in `nuxt.config.ts`** are generated from `ROUTE_PRIVATE` in `app/constants/route.ts`. Each private path gets `appMiddleware: 'auth'` and the `default` layout; `/onboarding` gets the `onboarding` middleware and the `blank` layout. `/auth/**` gets `guest` and the `auth` layout. `/policy/**` gets the `blank` layout.
2. **`definePageMeta`** in the page.

**The generated rules match exact paths only.** A dynamic or nested route such as `/workspace/activity-history/[id]` gets no guard from them. Every dynamic page must declare its own guard, as `pages/workspace/glossary/uploads/[id].vue` does:

```ts
definePageMeta({ layout: 'default', middleware: 'auth' })
```

### Adding a route

1. Create the page file. It renders the feature screen.
2. Add the path to `ROUTE_PRIVATE` (or `ROUTE_PUBLIC`) in `app/constants/route.ts`, so `toRoute('/path')` type-checks and the route rule is generated.
3. For a dynamic route, add `definePageMeta({ layout: 'default', middleware: 'auth' })`.
4. If Operators may open it, add it to `OPERATOR.routes` in `app/composables/usePermission.ts`. The `auth` middleware compares `to.path` exactly against that list. Don't widen Operator access without an approved rule ([open questions](../../../docs/product/open-questions.md#permissions)).
5. If it belongs in the sidebar, add it to `menuItems` in `app/layouts/default.vue`. Hide Admin-only entries with `profileStore.isAdmin`.
6. Build links with `toRoute('/workspace/activity-history', `/${jobId}`)`. Don't concatenate string literals.

## Reference code

Copy these. Each one shows the rule named next to it.

| Pattern | Reference | Why |
| --- | --- | --- |
| Service | `app/services/glossary.service.ts` | Typed `ENDPOINT`, a company guard, `FormData` built inside the service, no UI |
| DTO file | `app/types/dto/team-management.dto.ts` | Param, Query, Data, Req, and Res sections |
| Feature composable for a list | `app/features/workspace/composables/useActivity.ts` | Query state, table columns, actions with pending and toast feedback, a namespaced `ASYNC_KEY` |
| List page | `app/pages/workspace/activity-history/index.vue` | `useAsyncData` watching query fields, a debounced search, the summary-card and table layout |
| Feature-local pure helpers + tests | `app/features/glossary/utils/glossary.ts`, `test/unit/glossary.test.ts` | Logic kept out of components and unit-tested |
| Modal workflow | `app/features/glossary/components/GlossaryUploadModal.vue` | `defineModel('open')`, client-side checks before upload, reset on close, i18n |
| Form page | `app/pages/settings/account-profile.vue` | `UForm` + Valibot + `FIELD_NAME`, separate profile and password forms. **Except** for its success handling; see Known gaps. |
| Stale-response guard | `app/stores/useProfileStore.ts` (`refreshBalance`), `test/nuxt/profile-balance.test.ts` | A revision counter drops responses that arrive late |
| Dynamic route guard | `app/pages/workspace/glossary/uploads/[id].vue` | `definePageMeta({ middleware: 'auth' })` |

## Legacy: don't copy

These files work, but they're not patterns to repeat. Change them when your task requires it, and keep the change focused.

| File | Problem | Do instead |
| --- | --- | --- |
| `app/pages/workspace/create.vue` (≈1,450 lines) | The whole Doc AI wizard lives in the route | Change it carefully, with the [Doc AI](../../../docs/features/doc-ai.md) contract and `test/nuxt/invoice-workspace.test.ts`. Never use it as a template. |
| `app/pages/team-management.vue` (≈1,200 lines) | Reads, eight actions, columns, and dialogs all live in the page, as `xxxProps()` factories | New CRUD follows the [CRUD recipe](crud-recipe.md) |
| `app/services/example.service.ts` | An empty stub | Use `glossary.service.ts` |
| `buildEndpoint` (curried) in `app/utils/api.ts` | Unused, marked TODO | `buildEndPoint<Parts>(prefix, parts)` |
| `app/components/base/TokenBalanceBadge.vue` | A shared component that imports `@/features/token` | Shared code must not import features ([0002](../../../docs/decisions/0002-feature-folders-and-public-api.md)) |
| Deep feature imports, e.g. `@/features/workspace/components/WorkspaceCard.vue` from pages | There is no `index.ts` yet | Import from `@/features/<feature>`. Add the `index.ts` export when you touch it. |
| `~/` imports (about 40 files) | Two aliases, and vitest's non-Nuxt projects map only `@` | Use `@/` ([0004](../../../docs/decisions/0004-import-alias.md)) |
| Misspelled names (`SatisticCard`, `setingCompany.dto.ts`, `settingcompanyRepresentative.vue`, `company-infomation`, `privatecy`) | Copying them spreads the typo | Keep them when editing nearby code. Spell new names correctly. |

## Known gaps

These are defects the docs audit found. They're listed here so agents don't mistake them for intended behavior. Fixing them is separate work.

- **Unguarded dynamic routes.** `pages/workspace/activity-history/[id].vue`, `pages/bookkeeping/[periodId]/*.vue`, and `pages/learn-more/[id].vue` get no `auth` middleware, because the route rules match exact paths and these pages don't declare a guard.
- **The Operator route check is exact.** Operators would be redirected away from detail routes such as `/workspace/glossary/uploads/[id]`. Whether they should open those routes is an [open question](../../../docs/product/open-questions.md#permissions).
- **Success after failure in Account Profile.** In `account-profile.vue`, `updateProfile` and `uploadAvatar` catch their own errors, so `Promise.all` resolves and the success toast shows even after a failure.
- **Image size limit mismatch.** `MAX_IMAGE_SIZE` in `app/constants/app.ts` is `1024 ** 2` (1 MiB), but its comment and the `baseSchema.file` message both say 2 MB.
- **Hardcoded options.** The job titles (`'QA/QC', 'Merchandiser', 'Product Developer'`) and the seat options in `team-management.vue` are hardcoded.
