# Admin architecture

Where Admin code goes, how routes and the sidebar work, and which files to copy. Shared rules are in [conventions](../../../docs/conventions.md); screens and their evidence in the [product scope](../../../docs/product/scope.md#web-and-internal-admin).

## Folder layout

```text
src/admin/app/
├── pages/                       # thin routes: definePageMeta (title, access), one screen from a feature's index.ts
│   ├── index.vue                # Account management (list wired; its dialogs static)
│   ├── account/[id].vue         # Account Detail (summary and Company tab wired; Modules, Tokens, Seats sample), ?tab=
│   ├── techpack-reviews/        # review queue + [fileId] review (wired)
│   ├── lead-inquiry/ sale-request/ # lists with a read-only panel (wired); lead-inquiry/[id].vue redirects to ?lead=
│   ├── product/ plan-pricing/ hero.vue # UI only, on sample data
│   ├── setting.vue              # Settings (wired; templates and packages read-only), ?tab=
│   ├── community/index.vue      # placeholder: says what's needed before it can be built
│   └── auth/                    # sign-in, forgot, reset (guest)
├── features/<feature>/          # one staff workflow (decisions 0002, 0015): components/ composables/ models/ schemas/ utils/ fixtures/ tests/ + index.ts
│   ├── techpack-review/         # the reference feature
│   ├── account/ lead-inquiry/ sale-request/ settings/  # wired screens
│   ├── product/ plan-pricing/ hero/                    # UI shells on fixtures
│   ├── auth/ session/           # the forms; who is signed in
│   └── tests/                   # not a feature: checks every index.ts exports only what others import
├── components/                  # shared, auto-registered WITH their folder prefix: alert/ card/ detail/ input/ list/ modal/
├── composables/                 # useApiQuery, useApiMutation, useApiList, useListQuery, useUrlTab, useUrlRecord, useCenteredTab, useRefreshIndicator, useAppToast
├── api/                         # '@/api': client, errors, session recovery, contract helpers, generated/ (never edit)
├── utils/                       # format.ts, file.ts, navigation.ts, report.ts (reportAppError: where errors the team must see go), agent-tools.ts (WebMCP list tools)
├── middleware/access.global.ts  # loads the session, checks `access`
├── layouts/                     # default (dashboard + sidebar), auth
└── plugins/                     # session.client.ts: configures the API client, starts tab sync; report-errors.client.ts: uncaught errors → reportAppError
src/admin/test/                  # only what no folder owns: app-shell/ (guard, layout), support/ (fakeApi, model-context), e2e/ (decision 0016)
```

- **Components** are named with their folder: `components/card/CardStats.vue` is `<CardStats>`, so a file starts with its folder name (`modal/ModalConfirm.vue`). A component's prop types live in its own `<script lang="ts">` block.
- **Composables and utils** are auto-imported. Feature code, models, and `@/api` are imported explicitly, a feature only through its `index.ts`. An index exports only what code outside the feature imports: a test fails any other export, and the feature's own tests import its files directly.
- **No `schema/`, `theme/`, `constants/`, or shared `types/`** (`types/` holds only `page-meta.d.ts`). Form schemas live in their feature ([forms](forms.md)). App-wide styling is `app/app.config.ts` and `app/assets/css/tailwind.css` only ([ui](ui.md#foundation)).
- **Session state** is two `useState` keys owned by `features/session`. There's no store library.

## Layers

```text
pages/<route>.vue → features/<f>/components/<F>Screen.vue → features/<f>/composables/use<F>.ts → api (@/api)
```

No services: a composable calls `api` with the spec's path and a model ([data access](data-access.md#the-flow), [0009](../../../docs/decisions/0009-admin-typed-endpoints-and-query-toolkit.md)). A screen owns its `UDashboardPanel` when the toolbar or title depends on its state. App wiring (plugin, guard, layout) may use `features/session`; shared components, composables, and utils never import features ([0008](../../../docs/decisions/0008-admin-api-client-and-session.md)).

The layers are declared in `eslint.config.mjs` (`boundaries/elements`) with the imports each may make (`boundaries/dependencies`): a feature uses `api`, `components`, `composables`, `utils`, and other features through their `index.ts`; shared code never imports a feature; `api` imports nothing of the app. A new top-level folder needs an element there, or lint fails its imports ([0021](../../../docs/decisions/0021-admin-tooling-from-libraries.md)).

## Routes, guards, and the sidebar

- **A new route is named after its feature folder**, in kebab-case: `features/sale-request` → `/sale-request`, `/sale-request/[id]`. `/techpack-reviews` and `/setting` predate this and stay, because renaming them breaks bookmarks and shared links; rename one only with a redirect from the old path.
- **Every page is staff-only by default.** `middleware/access.global.ts` awaits `useSession().load()` on navigation, then checks the page's `access` meta. Never add a per-page `middleware: 'auth'`.
  - Signed out on a staff page → `/auth/sign-in?redirect=<page>`.
  - Guest pages set `definePageMeta({ access: 'guest', layout: 'auth' })`; signed in → the `redirect` target, or home.
  - The API can't answer (offline, 5xx) → `app/error.vue` with "Try again", never sign-in, so an outage doesn't sign staff out.
- **Redirects** go through `redirectTarget` (`features/session`), which accepts only an in-app, non-guest path. The session's own paths are `SESSION_PATHS`.
- **A page's name is its `definePageMeta({ title })`**, in sentence case ("Lead inquiries"). The browser tab (`app.vue` adds " · Syncra Admin") and the page's sidebar link both read it, and the screen's navbar `title` repeats it. A test fails a page without one, and the e2e sweep fails a page whose navbar and tab disagree.
- **Routes are typed** (`experimental.typedPages`). Name a route to get the check: `router.push({ name: 'lead-inquiry' })`, and a page reads its params with `useRoute('<route-name>')` (`account-id`, `techpack-reviews-fileId`). A string path (`router.push('/x')`) still compiles unchecked, so prefer names in new code.
- **The sidebar** is the `MENU` array in `app/layouts/default.vue`: headings, and links by route name (`page: 'lead-inquiry'`, typed) and `icon`, labeled with the page's title. An empty heading is hidden. The same links feed the Ctrl/⌘+K palette.

## Reference code

| Pattern | Copy |
| --- | --- |
| API-backed list | `techpack-review/composables/useReviewQueue.ts` + `ReviewQueueScreen.vue` |
| Searchable table list with totals and a URL panel | `lead-inquiry/composables/useLeadList.ts` + `LeadListScreen.vue` + `LeadDetailSlideover.vue`; an extra filter: `useSaleRequestList`; route-added actions: `AccountListScreen` `#actions` |
| A screen split into panels | `techpack-review/composables/useReviewDetail.ts` (one `createInjectionState`) + `ReviewDetailScreen.vue` |
| Writes on a versioned record | `techpack-review/composables/useReviewActions.ts`: each save sends the current `draftUuid` and reloads; approval invalidates the queue |
| Form with Valibot and pending | `auth/components/SignInScreen.vue` + `auth/composables/useSignIn.ts` ([forms](forms.md)) |
| Request with a model | `auth/composables/useForgotPassword.ts` + `auth/models/forgot-password.ts` |
| Page that checks its link before showing a form | `auth/components/ResetPasswordScreen.vue` + `auth/composables/useResetPassword.ts` (one `state`: checking, ready, invalid, unavailable, done) |
| Tabs in the URL | `account/components/AccountDetailScreen.vue` (`useUrlTab`) |
| Page layout | `product/components/ProductFormScreen.vue` |

## Legacy: don't copy

| Pattern | Problem | Do instead |
| --- | --- | --- |
| Sample rows and totals (Account Detail's Modules, Tokens, Seats) | Looks real, but isn't | Wire a confirmed endpoint, or keep it labeled Sample |
| Form shells with no submit (`ProductFormScreen`, `PlanFormScreen`, `HeroScreen`, `AccountListActions`) | No validation or request yet | The [CRUD recipe](crud-recipe.md), once the contract is confirmed |

## What lint enforces

`pnpm --filter admin exec eslint .` fails on:
- `~/` imports
- importing a file inside a feature instead of its `index.ts`
- `@/api` in pages, shared components, or layouts, and `api` in a feature's components (only its composables call it)
- `try`, `navigateTo`, `useAsyncData`, `useFetch`, or `$fetch` in feature code (except `features/session` and tests)
- a page title set with `useHead` instead of `definePageMeta({ title })`
- a promise neither awaited nor marked `void` (`no-floating-promises`, `no-misused-promises`)
- `console.log` or `console.error` in app code (use `reportAppError`; `console.warn` is for dev warnings)
- an import across layers that isn't in the boundaries map ([Layers](#layers))
- `msw` or the generated MSW handlers outside tests
- `bg-white`, `bg-black`, `dark:`, hex, or `text-dimmed` classes (except the TechPack PDF page and the email preview)
- raw palette colors (`text-gray-500`) and classes that set the same property (`p-2 p-4`): Nuxt UI's rules (`@nuxt/ui/eslint`)
- a `UForm` without `:validate-on`
- a `ULink` with `row-link` and no `raw`
- an icon-only `UButton` with no `aria-label` or `label`

When a new rule can be checked mechanically, add it to `eslint.config.mjs` instead of only the docs.

## Known gaps

- Row actions aren't wired: Account management's dialogs, lead status changes, and sale request approval. The lists have no sorting. Leads and sale requests open read-only in a panel.
- Account Detail's Modules, Tokens, and Seats tabs have no read endpoint; each is marked Sample with its actions off.
- Settings can't list staff accounts (no endpoint), so staff access works by email; templates and token packages are read-only.
- `/community` is a placeholder; the API has no endpoints for it.
- Pages with a route param ([id], [fileId]) are covered by their screen tests, not by the e2e sweep ([testing](testing.md)).

The questions blocking these are in [open questions → Admin](../../../docs/product/open-questions.md#admin).
