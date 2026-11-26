# 0020: Admin list keys come from the URL state, and page names from page meta

- Status: Accepted
- Date: 2026-11-26
- Scope: Admin. Extends 0011 (list toolkit) and 0012 (sidebar).

## Context

Each Admin list wrote its query key by hand (`lead-inquiry:list:${status}:${page}:${size}:${search}`), apart from the query it sent. A filter added to the query but not the key would show another filter's cached rows, and nothing would fail. Four lists also sent `page - 1` by hand, three defined the same page sizes, and each returned about 25 hand-copied fields. The copies had already drifted: the sale request list had no `loaded`, which the WebMCP tools need.

A page's name was written three times: the page's `useHead` title, the screen's navbar title, and the sidebar label. They disagreed ("Sale Request" in the sidebar, "Sale Requests" on the page; "Setting" and "Settings").

## Decision

1. A list that loads one page of an endpoint uses `useApiList(name, choices, options, fetcher)`. Its key is `<name>:<list.stateKey>`, the whole URL state. The fetcher gets `filters`, `query` (the zero-based `page`, `size`, and `search`), and `signal`, and uses nothing else.
2. A list whose request needs other inputs builds from `useListQuery` and `useApiQuery`, with every input in its key. `useListQuery` exposes `stateKey` and `apiQuery` for it.
3. Lists that take `size` use `LIST_PAGE_SIZES`.
4. A page names itself once, with `definePageMeta({ title })` in sentence case. `app.vue` sets the browser tab from it, and the sidebar labels its link with it. A test fails a page with no params that has no title. The screen's navbar `title` still repeats it, because a feature screen doesn't read route meta.

## Alternatives

- **Keep hand-written keys and check them in review.** Review is what missed the `loaded` drift.
- **Group the list return (`{ list, rows, summary }`).** That changes every screen and agent tool for the same result. `useApiList` keeps the flat shape they already use.
- **A route registry (title, icon, path) for the sidebar and pages.** Deferred until staff roles exist, since a registry would also carry who sees each link. Page meta needs no new file.
- **Screens read `route.meta.title` for the navbar.** That ties feature screens to the route they're mounted on.

## Consequences

- A new list is its endpoint call plus its extra fields. `useLeadList` is the reference.
- The sidebar shows page titles, so renaming a page renames its link.
- The navbar title is still a second copy of the page name. The e2e sweep fails a page whose navbar and tab disagree.
