# Admin architecture

Where Admin code goes, how routes and the sidebar work, and which files to copy. Shared rules are in [conventions](../../../docs/conventions.md). Screens and their evidence are in the [product scope](../../../docs/product/scope.md#web-and-internal-admin).

## Folder layout

```text
src/admin/app/
├── pages/                       # staff routes; thin for new work
│   ├── index.vue                # Account Management (static data)
│   ├── account/[id].vue         # Account Detail, tabs in ?tab= (static data)
│   ├── techpack-reviews/        # review queue + [fileId] detail (wired)
│   ├── lead-inquiry/ product/ plan-pricing/ hero.vue   # UI shells
│   └── auth/                    # sign-in, forgot, reset (guest)
├── features/<feature>/          # one staff workflow (decision 0002)
│   ├── account/components/      # CompanyInformation, ModuleManagement, TokenManagement, SeatManagement
│   ├── auth/                    # sign-in, sign-out, forgot, reset forms: composables/, models/, index.ts
│   ├── session/                 # who is signed in: useSession (+ renewSession), useSessionSync, staff-profile model, index.ts
│   └── techpack-review/         # the reference feature
│       ├── components/          # ReviewQueueScreen; ReviewDetailScreen + Source, Workbook, Findings, WorkbookGrid, ActionsBar panels
│       ├── composables/         # useReviewQueue; useReview, useSourcePreview, useDraftInspection, useReviewActions → useReviewDetail
│       ├── models/ utils/       # response models; pure helpers (findings)
│       └── index.ts
├── components/                  # shared, auto-registered WITH folder prefix (see below)
│   ├── base/ card/ form/ input/ layout/ list/ modal/ table/
├── composables/                 # useApiQuery, useApiMutation, useListQuery, useAppToast, useStorage
├── api/                         # '@/api': client, errors, session recovery, contract helpers, generated/ (types, schemas, endpoint map; never edit)
├── types/components/            # UI prop types (card.ts, list.ts)
├── schema/                      # Valibot (auth, base)
├── theme/                       # shared :ui objects for Nuxt UI (tab.ts, table.ts)
├── constants/                   # regx.ts
├── utils/                       # common.ts (tw, IS_DEV), file.ts (saveFile), validate.ts
├── types/page-meta.d.ts         # the `access` page meta
├── middleware/                  # access.global.ts: loads the session, checks `access`
├── layouts/                     # default (staff sidebar shell), auth
└── plugins/                     # session.client.ts: configures the API client, starts tab sync
```

### What gets imported automatically

- **Components** use Nuxt's default naming, which **includes the folder**: `components/card/CardWrapper.vue` becomes `<CardWrapper>`. Every existing file already starts with its folder name, so keep that: `components/table/TableFilter.vue`, not `components/table/Filter.vue`.
- Composables and utils are auto-imported. Feature code, models, `@/api`, and `theme/` are imported explicitly.
- **Session state** is two `useState` keys owned by `features/session` (`useSession`). There's no store library.

## Layers

These are the same layers as the rest of Syncra ([workspace architecture](../../../docs/architecture.md#request-flow-inside-an-app)):

```text
pages/<route>.vue → features/<f>/components/<F>Screen.vue → features/<f>/composables/use<F>.ts (useApiQuery / useApiMutation) → api (@/api)
```

There are no services: a composable calls `api` with a path from the spec and a model from `features/<f>/models/`, and the client parses the response into it ([data access](data-access.md#the-flow), [0009](../../../docs/decisions/0009-admin-typed-endpoints-and-query-toolkit.md)). The session is a feature too. App wiring (the plugin, the route guard, the layout) uses its public `index.ts`; shared components, composables, and utils still never import features ([0008](../../../docs/decisions/0008-admin-api-client-and-session.md)). TechPack review is the reference. Its route files hold only `definePageMeta` and the screen.

## Routes, guards, and the sidebar

- **Every page is staff-only by default.** `middleware/access.global.ts` runs on every navigation: it awaits `useSession().load()` (one request, on the first navigation), then checks the page's `access` meta.
  - `access` unset (`staff`): signed out → `/auth/sign-in?redirect=<page>` (no `redirect` for the home page).
  - `definePageMeta({ access: 'guest', layout: 'auth' })`: the sign-in, forgot, and reset pages. Signed in → the `redirect` target, or home.
  - A new page needs nothing to be protected. Never add a per-page `middleware: 'auth'`.
- **Redirects** go through `redirectTarget` (`features/session`), which accepts only an in-app path that isn't a guest page.
- **Layouts:** `default` unless the page sets `layout`. Guest pages use `auth`.
- Links are plain paths (`to="/auth/forgot"`). The session's own targets are `SESSION_PATHS`.
- The sidebar is the `menuItems` array in `app/layouts/default.vue`, grouped by `type: 'label'` headings, rendered by `LayoutNavMenu` for both the desktop sidebar and the mobile drawer. Links to pages that don't exist are hidden, and so is a heading left empty.

## Reference code

| Pattern | Reference | Why |
| --- | --- | --- |
| API-backed list | `features/techpack-review/composables/useReviewQueue.ts` + `ReviewQueueScreen.vue` | `useListQuery` (status and 1-based page in the URL) + `useApiQuery` keyed by them. Loading, empty, and error states are separate; a page past the end moves back. |
| A screen split into panels | `useReviewDetail.ts` + `ReviewDetailScreen.vue` and its panels | Focused composables (record, PDF preview, inspection, actions) composed once and shared with panels through `createInjectionState`. |
| Writes | `features/techpack-review/composables/useReviewActions.ts` | `useApiMutation` per action: toasts, pending, double-submit guard, `invalidate`. Each save sends the current `draftUuid`; a draft change clears the attestation. |
| Form with Valibot + pending | `pages/auth/sign-in.vue` + `features/auth/composables/useSignIn.ts` | `UForm` + schema + `FIELD_NAME satisfies SchemaToString`. The composable wraps the request in `useApiMutation` and acts on `result.ok`. |
| Request + model | `features/auth/composables/useForgotPassword.ts`, `features/auth/models/forgot-password.ts` | `api.post('/admin/auth/forgot-password', { body, auth: false, model })` |
| Session-aware action | `features/session/composables/useSession.ts` | Shared state in `useState`, one in-flight load, idempotent `end()` |
| Tabs in the URL | `pages/account/[id].vue` | `UTabs` with `tabTheme`; the `?tab=` value selects the tab |
| Page layout | `pages/product/create.vue` | `LayoutContent` → `LayoutHeading` (with a `#suffix` for actions) → `CardWrapper` |

## Legacy: don't copy

| Pattern | Problem | Do instead |
| --- | --- | --- |
| Hardcoded rows and totals (`pages/index.vue`, `pages/account/[id].vue`, account feature panels) | Looks real, but isn't | Wire to a confirmed endpoint, or label it static |
| Form shells without submit handlers (`product/create.vue`, `plan-pricing/create.vue`, `[id].vue` stubs) | No validation or request yet | Follow the [CRUD recipe](crud-recipe.md) once the API contract is confirmed |
| `~/` imports | Two aliases | `@/` ([0004](../../../docs/decisions/0004-import-alias.md)) |

## Known gaps

- The sidebar lists `/sale-request`, `/community`, and `/setting`, but no pages exist for them, so they're hidden ([open question](../../../docs/product/open-questions.md#admin)).
- Account Management, Account Detail, and the module card show static data.
- Tests cover the API client, the session and route guard, auth composables, and TechPack review, but not pages ([testing](testing.md)).
