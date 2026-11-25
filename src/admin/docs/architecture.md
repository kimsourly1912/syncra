# Admin architecture

Where Admin code goes, how routes and the sidebar work, and which files to copy. Shared rules are in [conventions](../../../docs/conventions.md). Screens and their evidence are in the [product scope](../../../docs/product/scope.md#web-and-internal-admin).

## Folder layout

```text
src/admin/app/
├── pages/                       # staff routes; thin for new work
│   ├── index.vue                # Account Management: list wired (AccountListScreen); its two dialogs (AccountListActions) are static
│   ├── account/[id].vue         # Account Detail: summary and Company tab wired; Modules, Tokens, Seats sample data; tabs in ?tab=
│   ├── techpack-reviews/        # review queue + [fileId] detail (wired)
│   ├── lead-inquiry/index.vue   # lead list and read-only detail panel (wired); [id].vue redirects to the panel
│   ├── sale-request/index.vue   # sale request list and read-only detail panel (wired)
│   ├── product/ plan-pricing/   # list, create, [id] edit: UI only (sample data, Save disabled with a reason); routes are thin
│   ├── hero.vue                 # HeroScreen: UI shell, sample data, Save disabled with a reason
│   ├── setting.vue              # Settings (wired), tabs in ?tab=
│   ├── community/index.vue      # placeholder: says what's needed before it can be built
│   └── auth/                    # sign-in, forgot, reset (guest)
├── features/<feature>/          # one staff workflow (decision 0002); every route is thin: definePageMeta + one screen from the feature's index.ts
│   ├── account/                 # AccountListScreen (+ static AccountListActions) + useAccountList + portal-user model; AccountDetailScreen + useAccountDetail + account-detail model; CompanyInformation (wired) and three sample-data panels
│   ├── lead-inquiry/            # LeadListScreen + LeadDetailSlideover, useLeadList + useLeadDetail, lead models, status labels
│   ├── sale-request/            # SaleRequestListScreen + SaleRequestDetailSlideover, list and detail composables, models, labels
│   ├── auth/                    # sign-in, sign-out, forgot, reset forms: composables/, schemas/, components/, models/, index.ts
│   ├── session/                 # who is signed in: useSession (+ renewSession), useSessionSync, staff-profile model, index.ts
│   ├── product/ plan-pricing/   # ProductListScreen / PlanListScreen and ProductFormScreen / PlanFormScreen (new and edit in one form), on sample fixtures
│   ├── hero/                    # HeroScreen (UI only)
│   ├── settings/                # SettingsScreen: own profile and logo, staff invites and sign-in by email, email templates and token packages (read-only)
│   └── techpack-review/         # the reference feature
│       ├── components/          # ReviewQueueScreen; ReviewDetailScreen + Source, Workbook, issue menu and editor, inspection details, WorkbookGrid, WorkbookReplacement, ActionsBar
│       ├── composables/         # useReviewQueue; useReview, useSourcePreview, useDraftInspection, useWorkbookReview, useReviewActions → useReviewDetail
│       ├── models/ utils/       # response models; pure helpers (findings)
│       └── index.ts
├── components/                  # shared, auto-registered WITH folder prefix (see below)
│   └── alert/ card/ detail/ input/ list/ modal/ # AlertApiError, CardStats, DetailGrid, InputPassword, InputSearch, List* (ToolbarTabs, Pagination, EmptyState, Refresh, Skeleton), ModalConfirm; the rest is Nuxt UI
├── composables/                 # useApiQuery, useApiMutation, useListQuery, useUrlTab, useUrlRecord, useCenteredTab, useRefreshIndicator, useAppToast
├── api/                         # '@/api': client, errors, session recovery, contract helpers, generated/ (types, schemas, endpoint map; never edit)
├── utils/                       # format.ts (numbers, money, dates), file.ts (saveFile), navigation.ts (isSectionActive)
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

There are no services: a composable calls `api` with a path from the spec and a model from `features/<f>/models/`, and the client parses the response into it ([data access](data-access.md#the-flow), [0009](../../../docs/decisions/0009-admin-typed-endpoints-and-query-toolkit.md)). The session is a feature too. App wiring (the plugin, the route guard, the layout) uses its public `index.ts`; shared components, composables, and utils still never import features ([0008](../../../docs/decisions/0008-admin-api-client-and-session.md)). TechPack review is the reference. Its routes render the feature screens, which own the panel when the toolbar or title depends on their state.

## Routes, guards, and the sidebar

- **Every page is staff-only by default.** `middleware/access.global.ts` runs on every navigation: it awaits `useSession().load()` (one request, on the first navigation), then checks the page's `access` meta.
  - The API couldn't answer the profile request (offline, 5xx): a fatal 503 shows `app/error.vue`, whose "Try again" reloads the app at that page (a router navigation to the same page wouldn't run the guard). Valid cookies never land on sign-in because of an outage.
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
| API-backed list | `features/techpack-review/composables/useReviewQueue.ts` + `ReviewQueueScreen.vue` | `useListQuery` (status and 1-based page in the URL) + `useApiQuery` keyed by them. `ListToolbarTabs` in the toolbar, `AlertApiError`, card skeletons, `ListRefresh`, `ListEmptyState`, `ListPagination`; a card grid where the filename opens the record. A page past the end moves back. |
| Searchable table list with totals | `features/lead-inquiry/composables/useLeadList.ts` + `LeadListScreen.vue` | `useListQuery` with `search` and `pageSizes`; a separate summary query feeds the count badges on `ListToolbarTabs` (its own error above the list). The screen owns the `UDashboardPanel`, so the toolbar can bind to the list state. A table from `md`, cards on a phone; the whole row opens the record. A read-only record opens in a `USlideover` kept in the URL (`?lead=`), loaded by its own `useApiQuery` with `enabled` (`LeadDetailSlideover` + `useLeadDetail`). Extra filters: `useSaleRequestList` (type select); navbar actions through a slot: `AccountListScreen`. |
| A screen split into panels | `useReviewDetail.ts` + `ReviewDetailScreen.vue` and its panels | Compose the record, source paging, draft inspection, workbook selection and edits, and release actions once. Panels receive the feature state through `createInjectionState`. The workbook grid owns scrolling and takes sheet data as props. |
| Writes | `features/techpack-review/composables/useReviewActions.ts` | `useApiMutation` handles toasts, pending states, and double submissions. Each save sends the current `draftUuid`, clears attestation, and reloads the draft. Approval invalidates the review queries. |
| Form with Valibot + pending | `pages/auth/sign-in.vue` + `features/auth/composables/useSignIn.ts` | `UForm` + a feature schema (`features/auth/schemas/`) + `FIELD_NAME satisfies { [K in keyof IForm]: K }`. The composable wraps the request in `useApiMutation` and acts on `result.ok`. |
| Request + model | `features/auth/composables/useForgotPassword.ts`, `features/auth/models/forgot-password.ts` | `api.post('/admin/auth/forgot-password', { body, auth: false, model })` |
| Session-aware action | `features/session/composables/useSession.ts` | Shared state in `useState`, one in-flight load, idempotent `end()` |
| Tabs in the URL | `features/account/components/AccountDetailScreen.vue` | `ListToolbarTabs` bound to `useUrlTab`: an unknown `?tab=` reads as the first tab, and switching replaces the URL |
| Page layout | `features/product/components/ProductFormScreen.vue` | `UDashboardPanel` → `UDashboardNavbar` (back button in `#leading`, actions in `#right`) → `UPageCard` |

## Legacy: don't copy

| Pattern | Problem | Do instead |
| --- | --- | --- |
| Hardcoded rows and totals (the account detail's Modules, Tokens, and Seats panels) | Looks real, but isn't | Wire to a confirmed endpoint, or label it static |
| Form shells without submit handlers (`ProductFormScreen`, `PlanFormScreen`, `HeroScreen`, `AccountListActions`) | No validation or request yet | Follow the [CRUD recipe](crud-recipe.md) once the API contract is confirmed |
| `~/` imports | Two aliases | `@/` ([0004](../../../docs/decisions/0004-import-alias.md)) |

## What lint enforces

`eslint.config.mjs` turns these rules into errors, so `pnpm --filter admin exec eslint .` catches them: `~/` imports; importing a file inside a feature (`@/features/<f>/…`) instead of its `index.ts`; `@/api` in pages, shared components, or layouts; `try` and `navigateTo` in feature code (except `features/session`); `bg-white`, `bg-black`, `dark:`, and hex classes outside the two white-content files; a `UForm` without `:validate-on`; a `ULink` with `row-link` but no `raw`. Extend the config when a new rule can be checked mechanically.

## Known gaps

- `/community` is a placeholder that keeps the sidebar entry visible; the API has no endpoints for it ([open question](../../../docs/product/open-questions.md#admin)).
- Settings can't list staff accounts (the API has no list endpoint), so staff access acts on an email. Editing email templates and token packages isn't offered.
- The wired lists have no sorting, and their row actions aren't wired: Account Management's dialogs, lead status changes, and sale request approval. A lead (`?lead=`) and a sale request (`?request=`) open read-only in a side panel, not a detail page.
- Account Detail's Modules, Tokens, and Seats tabs have no read endpoint: each is marked Sample, shows a notice, and disables its actions. Their tables filter the sample rows in the browser.
- Tests cover the API client, the session and route guard, auth composables, TechPack review, and the three wired list screens, but not route files ([testing](testing.md)).
