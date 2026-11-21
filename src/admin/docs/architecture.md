# Admin architecture

Where Admin code goes, how routes and the sidebar work, and which files to copy. Shared rules are in [conventions](../../../docs/conventions.md). Screens and their evidence are in the [product scope](../../../docs/product/scope.md#web-and-internal-admin).

## Folder layout

```text
src/admin/app/
├── pages/                       # staff routes; thin for new work
│   ├── index.vue                # Account Management: list wired (AccountListScreen); its two dialogs are static
│   ├── account/[id].vue         # Account Detail, tabs in ?tab= (static data)
│   ├── techpack-reviews/        # review queue + [fileId] detail (wired)
│   ├── lead-inquiry/index.vue   # lead list (wired); [id].vue is static
│   ├── sale-request/index.vue   # sale request list (wired); no detail page
│   ├── product/ plan-pricing/ hero.vue   # UI shells
│   ├── community/ setting.vue   # placeholders (UEmpty), so the sidebar shows them
│   └── auth/                    # sign-in, forgot, reset (guest)
├── features/<feature>/          # one staff workflow (decision 0002)
│   ├── account/                 # AccountListScreen + useAccountList + portal-user model; static detail panels (CompanyInformation, ModuleManagement, TokenManagement, SeatManagement)
│   ├── lead-inquiry/            # LeadListScreen + useLeadList + lead model + status labels
│   ├── sale-request/            # SaleRequestListScreen + useSaleRequestList + model + labels
│   ├── auth/                    # sign-in, sign-out, forgot, reset forms: composables/, schemas/, components/, models/, index.ts
│   ├── session/                 # who is signed in: useSession (+ renewSession), useSessionSync, staff-profile model, index.ts
│   └── techpack-review/         # the reference feature
│       ├── components/          # ReviewQueueScreen; ReviewDetailScreen + Source, Workbook, Findings, WorkbookGrid, ActionsBar panels
│       ├── composables/         # useReviewQueue; useReview, useSourcePreview, useDraftInspection, useReviewActions → useReviewDetail
│       ├── models/ utils/       # response models; pure helpers (findings)
│       └── index.ts
├── components/                  # shared, auto-registered WITH folder prefix (see below)
│   └── alert/ card/ input/ list/ modal/ # AlertApiError, CardStats, InputPassword, InputSearch, List* (Details, StatusTabs, Pagination, EmptyState, Refresh, Skeleton), ModalConfirm; the rest is Nuxt UI
├── composables/                 # useApiQuery, useApiMutation, useListQuery, useUrlTab, useRefreshIndicator, useAppToast
├── api/                         # '@/api': client, errors, session recovery, contract helpers, generated/ (types, schemas, endpoint map; never edit)
├── utils/                       # file.ts (saveFile), navigation.ts (isSectionActive)
├── types/page-meta.d.ts         # the `access` page meta
├── middleware/                  # access.global.ts: loads the session, checks `access`
├── layouts/                     # default (UDashboardGroup + UDashboardSidebar), auth
└── plugins/                     # session.client.ts: configures the API client, starts tab sync
```

### What gets imported automatically

- **Components** use Nuxt's default naming, which **includes the folder**: `components/card/CardStats.vue` becomes `<CardStats>`. Every existing file already starts with its folder name, so keep that: `components/modal/ModalConfirm.vue`, not `components/modal/Confirm.vue`.
- **No `schema/`, `theme/`, `constants/`, or shared `types/`.** Form schemas live in their feature and start from the generated request schema ([forms](forms.md)). Components use Nuxt UI defaults, with no shared `:ui` objects; the few app-wide layout rules live in `app/app.config.ts`, and the page width and light-mode primary in `app/assets/css/tailwind.css` ([ui](ui.md#foundation), [0012](../../../docs/decisions/0012-admin-page-width-and-layout-overrides.md)). A component's prop types live in its own `<script lang="ts">` block. `types/` holds only `page-meta.d.ts`.
- Composables and utils are auto-imported. Feature code, models, and `@/api` are imported explicitly.
- **Session state** is two `useState` keys owned by `features/session` (`useSession`). There's no store library.

## Layers

These are the same layers as the rest of Syncra ([workspace architecture](../../../docs/architecture.md#request-flow-inside-an-app)):

```text
pages/<route>.vue → features/<f>/components/<F>Screen.vue → features/<f>/composables/use<F>.ts (useApiQuery / useApiMutation) → api (@/api)
```

There are no services: a composable calls `api` with a path from the spec and a model from `features/<f>/models/`, and the client parses the response into it ([data access](data-access.md#the-flow), [0009](../../../docs/decisions/0009-admin-typed-endpoints-and-query-toolkit.md)). The session is a feature too. App wiring (the plugin, the route guard, the layout) uses its public `index.ts`; shared components, composables, and utils still never import features ([0008](../../../docs/decisions/0008-admin-api-client-and-session.md)). TechPack review is the reference. Its route files hold only `definePageMeta` and the screen. A list screen with a toolbar (search, filters) renders the whole `UDashboardPanel` itself, so its route file is only the screen.

## Routes, guards, and the sidebar

- **Every page is staff-only by default.** `middleware/access.global.ts` runs on every navigation: it awaits `useSession().load()` (one request, on the first navigation), then checks the page's `access` meta.
  - `access` unset (`staff`): signed out → `/auth/sign-in?redirect=<page>` (no `redirect` for the home page).
  - `definePageMeta({ access: 'guest', layout: 'auth' })`: the sign-in, forgot, and reset pages. Signed in → the `redirect` target, or home.
  - A new page needs nothing to be protected. Never add a per-page `middleware: 'auth'`.
- **Redirects** go through `redirectTarget` (`features/session`), which accepts only an in-app path that isn't a guest page.
- **Layouts:** `default` unless the page sets `layout`. Guest pages use `auth`.
- Links are plain paths (`to="/auth/forgot"`). The session's own targets are `SESSION_PATHS`.
- The sidebar is the `menuItems` array in `app/layouts/default.vue`, grouped by `type: 'label'` headings, rendered by `UNavigationMenu` inside `UDashboardSidebar` (collapsible on desktop, a slideover on mobile). Every page is a `UDashboardPanel` ([ui](ui.md#page-anatomy)). Links to pages that don't exist are hidden, and so is a heading left empty. The same visible links feed the `UDashboardSearch` palette (Ctrl/⌘+K), so a new sidebar entry is searchable without more work. The footer is the staff menu (from `useSession().staff`) and the color mode button.

## Reference code

| Pattern | Reference | Why |
| --- | --- | --- |
| API-backed list | `features/techpack-review/composables/useReviewQueue.ts` + `ReviewQueueScreen.vue` | `useListQuery` (status and 1-based page in the URL) + `useApiQuery` keyed by them. `ListStatusTabs`, `AlertApiError`, skeleton rows, `ListRefresh`, `ListEmptyState`, `ListPagination`; the filename opens the record. A page past the end moves back. |
| Searchable table list with totals | `features/lead-inquiry/composables/useLeadList.ts` + `LeadListScreen.vue` | `useListQuery` with `search` and `pageSizes`; `envelope: false` for this endpoint; a separate summary query feeds `CardStats` (skeleton while loading, its own error). The screen owns the `UDashboardPanel`, so the toolbar can bind to the list state. Extra filters: `useSaleRequestList` (type select); navbar actions through a slot: `AccountListScreen`. |
| A screen split into panels | `useReviewDetail.ts` + `ReviewDetailScreen.vue` and its panels | Focused composables (record, PDF preview, inspection, actions) composed once and shared with panels through `createInjectionState`. |
| Writes | `features/techpack-review/composables/useReviewActions.ts` | `useApiMutation` per action: toasts, pending, double-submit guard, `invalidate`. Each save sends the current `draftUuid`; a draft change clears the attestation. |
| Form with Valibot + pending | `pages/auth/sign-in.vue` + `features/auth/composables/useSignIn.ts` | `UForm` + a feature schema (`features/auth/schemas/`) + `FIELD_NAME satisfies { [K in keyof IForm]: K }`. The composable wraps the request in `useApiMutation` and acts on `result.ok`. |
| Request + model | `features/auth/composables/useForgotPassword.ts`, `features/auth/models/forgot-password.ts` | `api.post('/admin/auth/forgot-password', { body, auth: false, model })` |
| Session-aware action | `features/session/composables/useSession.ts` | Shared state in `useState`, one in-flight load, idempotent `end()` |
| Tabs in the URL | `pages/account/[id].vue` | `UTabs` bound to `useUrlTab`: an unknown `?tab=` reads as the first tab, and switching replaces the URL |
| Page layout | `pages/product/create.vue` | `UDashboardPanel` → `UDashboardNavbar` (back button in `#leading`, actions in `#right`) → `UPageCard` |

## Legacy: don't copy

| Pattern | Problem | Do instead |
| --- | --- | --- |
| Hardcoded rows and totals (`pages/account/[id].vue`, account detail panels, `lead-inquiry/[id].vue`) | Looks real, but isn't | Wire to a confirmed endpoint, or label it static |
| Form shells without submit handlers (`product/create.vue`, `plan-pricing/create.vue`, `[id].vue` stubs) | No validation or request yet | Follow the [CRUD recipe](crud-recipe.md) once the API contract is confirmed |
| `~/` imports | Two aliases | `@/` ([0004](../../../docs/decisions/0004-import-alias.md)) |

## Known gaps

- `/community` and `/setting` are placeholder pages that keep the sidebar entries visible. The API has no endpoints for them ([open question](../../../docs/product/open-questions.md#admin)).
- The wired lists have no sorting, and their row actions aren't wired: Account Management's dialogs, lead detail, and sale request approval. Sale requests have no detail page yet.
- Account Detail and the module card show static data.
- Tests cover the API client, the session and route guard, auth composables, TechPack review, and the three wired list screens, but not route files ([testing](testing.md)).
