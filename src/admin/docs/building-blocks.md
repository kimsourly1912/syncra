# Admin building blocks

Admin's shared components, composables, and utilities: what exists and when to use it. Each file's JSDoc has the details and an example. When you add or change a shared block, update this page in the same change.

## Nuxt UI first

Page chrome, cards, and states come straight from Nuxt UI ([0010](../../../docs/decisions/0010-admin-nuxt-ui-dashboard-shell.md)); don't wrap these:

| Need | Use |
| --- | --- |
| Page shell | `UDashboardPanel` → `UDashboardNavbar` (+ optional `UDashboardToolbar`) → `#body` ([page anatomy](ui.md#page-anatomy)) |
| Titled card | `UPageCard title variant="outline"` |
| Section heading with actions | `UPageCard title variant="naked" orientation="horizontal"` |
| Placeholder page | `UEmpty` (an empty *list* is `ListEmptyState`) |
| Command palette | The layout's `UDashboardSearch` (Ctrl/⌘+K); don't add another |
| Round icon | `UBadge icon square class="rounded-full p-3"` |

## Components

Only what Nuxt UI lacks and two or more screens use. Auto-imported, named with their folder.

| Component | Use for |
| --- | --- |
| `AlertApiError` | A failed load in place of the content: the API's reason and Retry |
| `CardStats` | A row of compact stat tiles (`items: CardStat[]`); keep labels to a word or two |
| `DetailGrid` | A read-only record's facts as label-over-value pairs, one or two columns (`items: DetailItem[]`). Label-beside-value rows are `AccountDetailFields` (account only). |
| `InputPassword` | A password field with a show/hide toggle |
| `InputSearch` | **Every** search box: trimmed text after 300 ms, or at once on Enter; `/` focuses it. Bind `:model-value="list.search.value" @update:model-value="list.setSearch"`. |
| `ListToolbarTabs` | Page or status tabs in a `UDashboardToolbar` (`ToolbarTab<T>` items, `v-model`). A tab's `count` shows as a badge. For a status filter, disable the tabs while loading and give the group `role="group"` and an `aria-label`. |
| `ListSkeleton` | Placeholder rows while a list is `loading`, in `UTable`'s `#loading` slot or in place of a list |
| `ListRefresh` | Wraps content that is `refreshing`: dimmed, with a thin moving bar. `fill` for content that scrolls itself. |
| `ListEmptyState` | An empty list: "No *X* yet" (`createLabel`) or "No *X* match your filters" (`filtered`, with Clear filters) |
| `ListPagination` | The pager under a list; `pageSizes` adds rows per page. Hidden while one page holds everything. |
| `ModalConfirm` | Confirms a destructive action (`v-model`, `title`, `description`, emits `confirm` and `cancel`). **No loading prop**: disable the trigger while the request runs. |
| `ModalShortcuts` | The keyboard shortcut list. Keep it in step with the shortcuts that exist. |

## Composables

Auto-imported.

| Composable | Use for |
| --- | --- |
| `useApiQuery(key, fetcher, { enabled })` | Every read ([reads](data-access.md#reads-useapiquery)) |
| `useApiMutation(fn, { success, error, invalidate })` | Every write ([writes](data-access.md#writes-useapimutation)) |
| `invalidateQueries(...prefixes)` | Refresh on-screen queries by key prefix, by hand |
| `useListQuery(choices, { search, pageSizes })` | A list's filters, search, page, and page size in the URL ([lists](data-access.md#lists-uselistquery)) |
| `useUrlRecord(param)` | A record open in a panel on a list (`?lead=7`): `id`, `open(id)`, `close()` |
| `useUrlTab(tabs, param?)` | A page's tab in `?tab=`, as a writable computed |
| `useCenteredTab(root, active)` | Keeps a scrolling tab row's active tab in view (`ListToolbarTabs` calls it; a page's own `UTabs` passes a ref) |
| `useRefreshIndicator(refreshing)` | When to show a reload (`ListRefresh` uses it) |
| `useAppToast()` | `success(text)`, `failed(text)`, `error(e)`; for failures a composable decides itself |

## Utilities

Auto-imported.

| Export | Use for |
| --- | --- |
| `formatCount`, `formatChange`, `formatMoney`, `formatDate`, `formatDateTime`, `formatAge`, `NO_VALUE` (`utils/format.ts`) | **Every** number, amount, and date on screen, in one locale (`en-US`). `formatAge` gives `{ age, full }` for a `title` tooltip; a missing value is `NO_VALUE` (`—`). Never call `toLocaleString` or `Intl` in a component. |
| `saveFile(blob, filename)` (`utils/file.ts`) | Hand a downloaded file to the browser |
| `isSectionActive(path, to, also?)` (`utils/navigation.ts`) | Whether a sidebar link's section is the current page (the layout uses it) |

## CSS utilities (`assets/css/tailwind.css`)

| Class | Use for |
| --- | --- |
| `page-narrow` | On a form or settings page's `UDashboardPanel`: 56rem instead of 80rem |
| `row-link` | The name link that opens a row's record, stretched over the `relative` row; a `ULink` adds `raw` ([rows](ui.md#rows)) |
| `scrollbar-none` | A sideways-scrolling row with no visible scrollbar |

## API and session

Imported explicitly.

| Export | From | Use for |
| --- | --- | --- |
| `api`, `ApiError`, `errorMessage`, `defineModel`, `Api.*`, `v*` | `@/api` | Calls, errors, and models ([data access](data-access.md)) |
| `useSession`, `SESSION_PATHS`, `redirectTarget` | `@/features/session` | Who is signed in; safe redirects ([session](data-access.md#the-session)) |
| `useSignIn`, `useSignOut`, `useForgotPassword`, `useResetPassword`, the auth schemas, `PasswordSuggestion` | `@/features/auth` | The auth forms and Log Out |
