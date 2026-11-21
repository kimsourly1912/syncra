# 0011: Admin list toolkit, page search, and light/dark mode

- Status: Accepted
- Date: 2026-11-21
- Scope: Admin. Extends item 5 of [0009](0009-admin-typed-endpoints-and-query-toolkit.md) (`useListQuery`) and the shared-component list in [0010](0010-admin-nuxt-ui-dashboard-shell.md). Ends Admin's light-only rule.

## Context

Four Admin list pages had a plain `UInput` search and a `USelect` filter connected to nothing. The only wired list, the TechPack queue, had hand-written toggle buttons, a Previous/Next pager, and "Loading…" text. `useListQuery` handled only fixed-choice filters, and it pushed a history entry for every change, which would flood Back once a search box was connected to it. The Account Detail tabs pushed a history entry on every click and wrote `?tab=` even for the default tab. The generated contract shows that lead inquiries, portal users, and sale requests take `search`, `sort`, `page`, and `size`. Admin was light only (`ui.colorMode: false`).

The patterns were taken from another of the owner's Nuxt UI admin apps and adapted to Admin's rules: `@/` imports, `lucide:` icons, `useApiQuery`, and no phone-specific layouts.

## Decision

1. **`useListQuery(choices, { search, pageSizes })`.** Besides fixed-choice filters and the page, it keeps a trimmed `?search=` and a `?size=` from `pageSizes` in the URL. It returns `isFiltered` and `clearFilters` (which keeps the page size). A search **replaces** the current history entry; filter, page, and page-size changes still push one. Any change except the page goes back to page 1.
2. **`useUrlTab(tabs)`** keeps a page's tab in `?tab=`. The first tab is the default and is left out of the URL, an unknown value reads as it, and switching replaces the URL, so Back leaves the page.
3. **Shared list components**, each used by every list page: `InputSearch`, `ListStatusTabs`, `ListPagination`, `ListEmptyState` (on `UEmpty`), `ListRefresh` (with `useRefreshIndicator`), and `AlertApiError`. `UEmpty` stays the placeholder-page state.
4. **Records open from their name.** List rows and table cells link the record's name; there's no separate Manage or Review column.
5. **Shell.** The sidebar has a `UDashboardSearchButton`, and the layout mounts `UDashboardSearch` (Ctrl/⌘+K) over the sidebar's visible pages. The footer holds a staff menu (email, Log Out) and `UColorModeButton`.
6. **Light and dark, light by default.** `colorMode: { preference: 'light', fallback: 'light' }`: the system setting is ignored until staff pick a mode. Screens use semantic tokens only. The TechPack source page stays white, because it shows paper.

## Alternatives

- **A separate `useSearchQuery` beside `useListQuery`.** It would keep 0009's composable unchanged, but two composables writing the same URL would need to merge each other's keys, and a search must reset the page that `useListQuery` owns.
- **Push a history entry for searches too, debounced.** That's simpler, but Back would still step through partial searches.
- **`history.replaceState` for tabs, without the router.** This avoids a route update, but Admin has no leave guard that needs that, and `router.replace` keeps `useRoute()` in sync.
- **Copy the reference app's phone layouts** (row cards, bottom sheets, a bulk-select bar). Admin is a desktop-first staff console with no bulk endpoints, so they'd be unused code.
- **Follow the system color scheme.** The owner chose light as the default.

## Consequences

- Connecting a list to the API is now mostly binding: `useListQuery` → `useApiQuery` → the toolbar components.
- `InputSearch`, page sizes, and count badges have no API-backed screen yet. Lead Inquiry, Account Management, and Sale Requests are the next lists to connect. The `sort` format, the largest `size`, and a portal-user status filter are [open questions](../product/open-questions.md#admin).
- Every new surface must read well in both modes; `bg-white` and hex colors are review failures.

## Follow-up

- 2026-11-21: Lead Inquiry, Account Management, and Sale Requests now read their list and summary endpoints with search and rows per page. These list screens render their own `UDashboardPanel`, so the toolbar binds to the list state. Count badges stay unused until the totals' mapping to statuses is confirmed ([open questions](../product/open-questions.md#admin)).
