# Admin UI

Admin is a dense, desktop-first staff console built from Nuxt UI and Admin's shared components ([building blocks](building-blocks.md)). Lint enforces the color and form rules below ([what lint enforces](architecture.md#what-lint-enforces)).

## Foundation

- **Colors.** `primary` is the `brand` palette (`app/app.config.ts`, `--color-brand-*` in `app/assets/css/tailwind.css`); every other color is Nuxt UI's. Use semantic utilities (`text-highlighted`, `text-muted`, `bg-elevated`, `border-default`), never hex, `bg-white`, or `dark:`. Light mode's primary is the 800 shade, because brand-500 fails WCAG AA on white; change it in `tailwind.css`, never per page. The TechPack PDF page and the email template preview stay white on purpose.
- **Light and dark.** Every browser starts in light (`colorMode` in `nuxt.config.ts` ignores the system setting) until staff pick a mode with `UColorModeButton` or the search palette.
- **Nuxt UI defaults.** Components use their default theme. `app/app.config.ts` holds the only app-wide overrides, all layout: the page gutter, toolbar wrapping on phones, scrolling tab rows, and the dim behind overlays ([0012](../../../docs/decisions/0012-admin-page-width-and-layout-overrides.md)). Pages never override color, size, radius, or shadow; pass `:ui` only for a one-off layout need.
- **Font** League Spartan. **Scrollbars** thin everywhere; `scrollbar-none` hides one on a sideways-scrolling row.
- **Icons.** Lucide only (`lucide:*`), written as literal strings so the build bundles them. No custom SVG collections.

## Page anatomy

The `default` layout is `UDashboardGroup` with a collapsible `UDashboardSidebar`; each page is one `UDashboardPanel` beside it ([0010](../../../docs/decisions/0010-admin-nuxt-ui-dashboard-shell.md)). Routes are thin, and the feature screen owns the panel (`ProductFormScreen`, `LeadListScreen`):

```vue
<UDashboardPanel class="page-narrow">                      <!-- forms and settings only -->
  <template #header>
    <UDashboardNavbar title="New product" :toggle="false">   <!-- nested page: no menu button, no icon -->
      <template #leading>                                  <!-- nested pages only -->
        <UButton icon="lucide:arrow-left" color="neutral" variant="ghost" to="/product" aria-label="Back to products" />
      </template>
      <template #right>
        <UButton icon="lucide:check" aria-label="Create product">
          <span class="hidden sm:inline">Create product</span> <!-- icon only on a phone -->
        </UButton>
      </template>
    </UDashboardNavbar>
    <UDashboardToolbar>                                    <!-- filters or page tabs, optional -->
      <template #left><InputSearch v-model="search" class="w-full max-w-sm" /></template>
    </UDashboardToolbar>
  </template>
  <template #body>
    <UPageCard title="Product Listing Information" variant="outline">…</UPageCard>
  </template>
</UDashboardPanel>
```

- **Top-level pages** (in the sidebar) show a title `icon`, the same one as their sidebar entry. Below `lg` the navbar adds the menu button by itself.
- **Nested pages** (detail, create, edit, review) lead with a back button in `#leading`, set `:toggle="false"`, and have no icon.
- Page-level actions a route adds go through a screen slot (`AccountListScreen` `#actions`).

**Sidebar and shortcuts** (`layouts/default.vue`). The sidebar is the `menuItems` array ([architecture](architecture.md#routes-guards-and-the-sidebar)). Ctrl/⌘+K opens `UDashboardSearch` (every sidebar page, Keyboard shortcuts, light/dark). Ctrl/⌘+B collapses the sidebar, or toggles its drawer below `lg`. `?` opens `ModalShortcuts`: when you add or remove a shortcut, update its list. Page shortcuts use `defineShortcuts`, which pauses while typing. A section stays highlighted on the pages under it through `isSectionActive`; a section whose pages live elsewhere is listed in the layout's `SECTION_PATHS`.

### Navbar on a phone

At 390px (down to 320px), the navbar fits the title and **at most two icon buttons** beside the menu or back button, in every mode of the page.

1. Labels go below `sm`: `<span class="hidden sm:inline">` plus an `aria-label`.
2. Repeats go: a Cancel the back button repeats, and badges such as Sample data.
3. A third action moves to a full-width button at the top of the body below `sm` (`HeroScreen`: Preview).
4. A long title ends in "…", never mid-letter (`app.config.ts` makes the title a block; a `#title` slot keeps one inline element).

## Page width

The navbar, toolbar, and body share one side padding, `--page-gutter`, so they line up on one centered edge. Content is capped at **80rem**; forms and settings add `class="page-narrow"` to their `UDashboardPanel` for **56rem**. Pages set no `max-w-*` on their content and no width breakpoints.

A tab row that doesn't fit scrolls sideways, never cutting a label. On a phone `UDashboardToolbar` wraps (search on one line, filters on the next), so give fixed-width controls a shrinkable width (`w-full max-w-sm`).

## Page patterns

Copy the reference; it is the spec.

| Pattern | Reference | Shape |
| --- | --- | --- |
| Queue | `techpack-review/components/ReviewQueueScreen.vue` | Status tabs + total + Refresh in the toolbar → a grid of cards; the filename opens the record → `ListPagination` |
| Table list with totals | `lead-inquiry/components/LeadListScreen.vue` | Status tabs with `count` badges, then `InputSearch` and filters in a second toolbar → `UTable :loading` from `md`, cards on a phone → `ListPagination` with rows per page → a read-only `USlideover` kept in the URL (`useUrlRecord`) |
| Detail with tabs | `account/components/AccountDetailScreen.vue` | Back button, summary, `ListToolbarTabs` bound to `useUrlTab`. Layout follows the panel (`@container`). Tabs without an API carry a Sample badge and a notice. |
| Review workspace | `techpack-review/components/ReviewDetailScreen.vue` | PDF and workbook panes that each scroll inside themselves: side by side in a `USplitter` from `xl`, tabs below it. Footer: staged corrections, or the approval checklist above the attestation and Approve. |
| Create or edit form | `product/components/ProductFormScreen.vue` (UI only) | One screen for New and Edit: `UPageCard` sections, Unsaved changes and Discard once edited, a Danger zone, a live preview beside the form from `lg` (in a `UModal` below it) |

## Rows

A record's **name opens it**: a `ULink`, or a `UButton variant="link"` for an overlay, holding only the name. There's no Manage or Open column. In a list, put `relative` on the row and `class="row-link"` on the link, so it stretches over the row; a card adds `after:rounded-lg`, and a `ULink` adds `raw` (lint checks it). Other row actions go in a `⋮` `UDropdownMenu` beside it.

## Required states

| State | Show |
| --- | --- |
| Loading | `loading` (first load, and every filter, search, or page change): `ListSkeleton` in the layout's place, never the empty state or the previous filter's rows. Disable the controls that change the query. |
| Refreshing | `refreshing` (a reload of the same query): the content stays, inside `<ListRefresh :active="refreshing">` |
| Empty | `ListEmptyState`: "No *X* yet" (create action) differs from "No *X* match your filters" (Clear filters) |
| Error | `AlertApiError` with the API reason and Retry, in place of the content |
| Pending write | `:loading` on the action; conflicting actions disabled |
| Gated action | Disabled until its condition is met, with the condition explained |
| Static data | Labeled Sample in the UI, and said so in the PR. Never presented as live. |

## Review checklist

- [ ] `pnpm --filter admin exec eslint .` passes (colors, forms, imports, row links).
- [ ] Top-level page: title `icon`. Nested page: back button, `:toggle="false"`, no icon.
- [ ] At 390px, in every mode, the navbar fits one line: two icon-only actions at most, each with an `aria-label`.
- [ ] Loading, refreshing, empty, error, and pending states all render; a filter or page change shows `ListSkeleton`.
- [ ] Reads well in light and dark; works from 1280px up, and with the sidebar collapsed or as a slideover below `lg`.
- [ ] Keyboard focus is visible; disabled record actions show it.
- [ ] Destructive actions use `<ModalConfirm>` and name the record.
- [ ] No new sidebar link points to a page that doesn't exist.
