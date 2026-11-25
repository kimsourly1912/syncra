# Admin building blocks

These are Admin's shared components, composables, and utilities. Components and composables are auto-imported. Component names include their folder: `card/CardStats.vue` becomes `<CardStats>`. When you add or change a shared block, update this page in the same change.

## Nuxt UI first

Page chrome, cards, and states come straight from Nuxt UI ([0010](../../../docs/decisions/0010-admin-nuxt-ui-dashboard-shell.md)). Don't wrap these in Admin components:

| Need | Use |
| --- | --- |
| Page shell | `UDashboardPanel` → `#header`: `UDashboardNavbar` (`title`, back button in `#leading`, actions in `#right`) + optional `UDashboardToolbar` (list filters, page tabs) → `#body` |
| Titled card | `UPageCard title variant="outline"` |
| Section heading with actions | `UPageCard title variant="naked" orientation="horizontal"`, actions in the default slot |
| Placeholder page | `UEmpty` (an empty *list* uses `ListEmptyState`, below) |
| Page tabs | `ListToolbarTabs` in `UDashboardToolbar` (it drops the tabs' own line so only the toolbar's shows), bound to `useUrlTab` |
| Page search | `UDashboardSearch` in the layout (Ctrl/⌘+K); don't add another palette |
| Round icon | `UBadge icon square class="rounded-full p-3"` |

## Components

Only what Nuxt UI doesn't provide and two or more screens use:

| Component | Use for |
| --- | --- |
| `CardStats` | A stat grid of `items: CardStat[]` (`label`, `value`, `icon`, `color`), built on `UPageGrid` + `UPageCard`. Columns follow the item count. `#value="{ item }"` replaces the value. The `CardStat` type is exported from `CardStats.vue`. |
| `ListDetails` | A label and value list (`items: ListDetail[]`; `type` is `text` by default or `badge`). The `ListDetail` type is exported from `ListDetails.vue`. |
| `ModalConfirm` | A `UModal` confirmation. `v-model` opens it. Props: `title` (default "Are you sure?") and `description` (or the `#description` slot). Emits `confirm` and `cancel`. **It has no loading prop.** |
| `InputPassword` | A password field with a show/hide toggle |
| `InputSearch` | A list toolbar's search box. `v-model` gets the trimmed text 300 ms after typing stops (`delay`), or at once on Enter or Clear. `/` focuses it; set `:shortcut="false"` on a page's second search box. The browser's own clear button is hidden. Bind it as `:model-value="list.search.value" @update:model-value="list.setSearch"`. Every search box uses it, including on static pages. |
| `ListSkeleton` | Placeholder rows while a list has nothing to show for its query (`loading`): in `UTable`'s `#loading` slot, or in place of a list. Props: `label` (for screen readers), `rows` (default 5). |
| `ListStatusTabs` | A status filter as link tabs with an optional icon and count badge, which replace a row of stat cards. A row that does not fit scrolls, the chosen tab centered by `useCenteredTab`. `items: ListStatusTab[]` (`label`, `value`, `icon`, `count`), `v-model` the status, `disabled` while loading, and an `aria-label`. There's no implicit "All": add it as an item if the API has one. The `ListStatusTab` type is exported from the file. |
| `ListToolbarTabs` | Page tabs in a `UDashboardToolbar`: the tabs drop their own bottom line and sit on the toolbar's. `items` (with `value`) and `v-model`. A row that does not fit scrolls sideways and the chosen tab is centered by `useCenteredTab`. |
| `ListPagination` | The pager: "Page n of N", optional rows per page, and `UPagination` with first and last. Props: `pageCount` (the API's `totalPages`), `pageSizes` (leave out for a fixed API page size), `disabled`. Models: `page`, `pageSize`. Hidden while one page holds everything. |
| `ListEmptyState` | An empty list, built on `UEmpty`. Props: `noun` ("leads"), `filtered` ("No leads match your filters" + Clear filters, emits `clear`), `createLabel` ("No leads yet" + a create button, emits `create`), and `title` or `description` to replace the default text. |
| `ListRefresh` | Wraps content that reloads behind what's on screen (`refreshing`): a thin bar on its top edge, the content dimmed. Shows nothing for a reload under 150 ms. `fill` makes it fill a flex column's remaining height, for content that scrolls itself (the TechPack workbook grid). |
| `AlertApiError` | A failed load in place of the content: `title`, the API reason from `errorMessage(error, fallback)`, and Retry (emits `retry`, `retrying` shows its spinner) |

## Composables

| Composable | Use for |
| --- | --- |
| `useApiQuery(key, fetcher, { enabled })` | Reads: `data`, `loading`, `refreshing`, `pending`, `error` (`ApiError`), `refresh` ([reads](data-access.md#reads-useapiquery)) |
| `useApiMutation(fn, { success, error, invalidate })` | Writes: `execute(input)` → `{ ok, data \| error }`, `pending`, `error` ([writes](data-access.md#writes-useapimutation)) |
| `invalidateQueries(...prefixes)` | Refresh the queries on screen whose key starts with a prefix |
| `useListQuery(choices, { search, pageSizes })` | A list's filters, search, 1-based page, and page size in the URL, plus `isFiltered` and `clearFilters` ([lists](data-access.md#lists-uselistquery)) |
| `useUrlTab(tabs, param?)` | A page's tab in `?tab=`: a writable computed. The first tab is the default and is left out of the URL; switching replaces the URL, so Back leaves the page. |
| `useCenteredTab(root, active)` | Keeps a scrolling tab row's active tab centered: smooth on change, at once on mount and resize, and only the row scrolls. A row that fits does not move. `ListToolbarTabs` and `ListStatusTabs` call it; a page with its own `UTabs` passes a template ref. |
| `useRefreshIndicator(refreshing)` | Whether to show a reload: after 150 ms, then for at least 300 ms. `ListRefresh` uses it. |
| `useAppToast()` | `success(description, title?)`, `failed(description, title?)`, `error(e, title?)` (skips silent errors), `base` |

## API and session

Imported explicitly, not auto-imported.

| Export | From | Use for |
| --- | --- | --- |
| `api.get/post/put/patch/delete/download` | `@/api` | Every API call, with the spec's path (`'/admin/x/{id}'`) ([calling the API](data-access.md#calling-the-api)) |
| `ApiError`, `errorMessage(e, fallback)` | `@/api` | Reading a thrown error; inline alert text |
| `defineModel`, `parseData`, `Api.*`, `v*` | `@/api` | Feature models and request types |
| `useSession()` | `@/features/session` | `status`, `staff`, `signedIn`, `load`, `reload`, `signIn`, `signOut`, `end` ([session](data-access.md#the-session)) |
| `SESSION_PATHS`, `redirectTarget(value)` | `@/features/session` | Home and sign-in paths; a safe `?redirect=` target |
| `useSignIn`, `useSignOut`, `useForgotPassword`, `useResetPassword` | `@/features/auth` | The auth forms and the staff menu's Log Out |
| `signInSchema`, `forgotPasswordSchema`, `resetPasswordSchema`, `PasswordSuggestion` | `@/features/auth` | Auth form schemas; the live password rule checklist |

## Utilities

| Export | File | Use for |
| --- | --- | --- |
| `saveFile(blob, filename)` | `utils/file.ts` | Hand a downloaded file to the browser |
| `isSectionActive(path, to, also?)` | `utils/navigation.ts` | Whether a sidebar link is the current page's section (its page, pages under it, or under `also`). The layout uses it. |

## CSS utilities

| Class | File | Use for |
| --- | --- | --- |
| `page-narrow` | `assets/css/tailwind.css` | On a form or settings page's `UDashboardPanel`: caps the page at 56rem instead of 80rem ([page width](ui.md#page-width)) |
| `scrollbar-none` | `assets/css/tailwind.css` | A row that scrolls sideways with no visible scrollbar |
