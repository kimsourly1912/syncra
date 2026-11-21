# Admin UI

Admin is a dense desktop-first staff console. Use Nuxt UI components and Admin's shared components ([building blocks](building-blocks.md)).

## Foundation

- **Colors.** `app/app.config.ts` maps `primary` to the `brand` palette (`--color-brand-*` in `app/assets/css/tailwind.css`). Every other color is the Nuxt UI default. Use semantic utilities (`text-highlighted`, `text-muted`, `border-default`, `ring-default`). Don't add new hex values. **Light mode's primary is the 800 shade** (`--ui-primary` in `tailwind.css`): brand-500, Nuxt UI's default, is 2.4:1 on white, under WCAG AA's 4.5:1. brand-800 passes on white, on its own tint, and on `bg-elevated`. Dark mode keeps the 400 shade. Change the shade there, never per page.
- **Light and dark.** `colorMode` in `nuxt.config.ts` starts every browser in light (`preference` and `fallback` are `light`, so the system setting is ignored) until staff pick a mode with `UColorModeButton` (sidebar footer, sign-in pages) or the search palette. Use semantic tokens (`bg-default`, `bg-elevated`, `text-highlighted`, `border-default`) so both modes work; don't add `bg-white` or `dark:` variants. The one exception is the TechPack source page, which stays white because it shows a paper PDF page.
- **Font.** League Spartan (`--font-sans`).
- **Nuxt UI defaults, plus a few app-wide layout rules.** Use components with their default theme. `app/app.config.ts` is the only place for app-wide overrides, and it holds only layout and overlay rules ([0012](../../../docs/decisions/0012-admin-page-width-and-layout-overrides.md)):
  - the page gutter on `UDashboardNavbar`, `UDashboardToolbar`, and the panel body
  - the toolbar wrapping on phones
  - tab rows scrolling instead of cutting labels
  - a black dim behind modals and slideovers

  Pages never override color, size, radius, or shadow. There are no shared `:ui` objects; pass `:ui` only for a one-off layout need.
- **Scrollbars** are thin everywhere (`tailwind.css`). `scrollbar-none` hides one on a row that scrolls sideways.
- **Icons.** Lucide only (`lucide:*`, from `@iconify-json/lucide`). Write icon names as literal strings: `clientBundle.scan` bundles the icons it finds in the source at build time. Don't add custom SVG collections; pick an Iconify icon instead.

## Page anatomy

The `default` layout is `UDashboardGroup` with a collapsible `UDashboardSidebar` (`UNavigationMenu`); each page is one `UDashboardPanel` beside it ([0010](../../../docs/decisions/0010-admin-nuxt-ui-dashboard-shell.md)). Most pages follow this shape (`pages/product/create.vue`, `pages/index.vue`):

```vue
<template>
  <UDashboardPanel class="page-narrow">                    <!-- forms and settings only -->
    <template #header>
      <UDashboardNavbar icon="lucide:package-plus" title="Create New Product">
        <template #leading>                                <!-- detail and form pages only -->
          <UButton icon="lucide:arrow-left" color="neutral" variant="ghost" to="/product" aria-label="Back to products" />
        </template>
        <template #right>
          <UButton label="Save" />
        </template>
      </UDashboardNavbar>
      <UDashboardToolbar>                                  <!-- list filters or page tabs, optional -->
        <template #left><UInput icon="lucide:search" placeholder="Search" class="w-full max-w-sm" /></template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <UPageCard title="Product Listing Information" variant="outline">
        <!-- content -->
      </UPageCard>
    </template>
  </UDashboardPanel>
</template>
```

Simple routes own the panel and render their contents inside `#body`. A feature screen owns the panel when its title or toolbar depends on feature state, as in both TechPack review screens and the Admin lists. Page-level actions go in through a slot (`AccountListScreen` `#actions`). `UDashboardNavbar` shows its mobile sidebar toggle by itself.

**Every page title has an icon** (`UDashboardNavbar` `icon`), the same Lucide icon as its sidebar entry, so the page and its link read as one. A page with its own purpose gets the matching variant: Create New Product is `lucide:package-plus`, a TechPack review is `lucide:file-search`.

The sidebar (`layouts/default.vue`) has the logo and collapse button in its header, then a `UDashboardSearchButton` and the navigation. Its footer holds the staff menu (the signed-in email and Log Out) and a `UColorModeButton`. Ctrl/⌘+K opens `UDashboardSearch`, which lists every sidebar page plus Nuxt UI's light/dark commands. A section stays highlighted on the pages under it (`/techpack-reviews/101`, `/product/create`) through `isSectionActive`. When a section's pages live elsewhere, list them in the layout's `SECTION_PATHS` (Account Management is `/`, its details are `/account/<id>`).

## Page width

On a wide screen a page's content is centered and capped, so lines stay short. The navbar, the toolbar, and the body share one side padding, `--page-gutter` (`tailwind.css`, applied in `app.config.ts`), so the title, the search box, and the content line up on one edge. Borders and the toolbar still run the full width.

| Page | Width | How |
| --- | --- | --- |
| Lists, tables, queues, detail pages (the default) | 80rem (1280px) | nothing |
| Forms and settings (`product/create`, `plan-pricing/create`, `hero`, `setting`) | 56rem (896px) | `class="page-narrow"` on the page's `UDashboardPanel` |

Pages set no `max-w-*` on their content and no breakpoints for width. Below the cap the side padding is Nuxt UI's own (1rem, 1.5rem from `sm`). The width is the panel's, so it holds with the sidebar open or collapsed.

## Tabs and toolbars

- A tab row that doesn't fit scrolls sideways with no visible scrollbar; a label is never cut or shortened.
- On a phone, `UDashboardToolbar` wraps instead of scrolling: the search on one line, filters on the next. Give fixed-width controls a width that can shrink (`w-full max-w-sm`).


## Page patterns

| Pattern | Reference | Shape |
| --- | --- | --- |
| Queue or list | `features/techpack-review/components/ReviewQueueScreen.vue` | `ListStatusTabs` (status in the URL) + Refresh → `AlertApiError` on error → skeleton rows on the first load → `ListRefresh` around a `UTable` with a skeleton or `ListEmptyState` → `ListPagination` |
| Overview + table | `features/lead-inquiry/components/LeadListScreen.vue` | `InputSearch` and filters in `UDashboardToolbar` → the summary endpoint's totals as the counts on `ListStatusTabs` (or its `AlertApiError` above them) → `AlertApiError` or `ListRefresh` around `UTable :loading` with `ListEmptyState` in `#empty` → `ListPagination` with rows per page |
| Detail with tabs | `pages/account/[id].vue` | Back button in the navbar `#leading` → `ListToolbarTabs` in `UDashboardToolbar`, the tab from `useUrlTab` → the body renders the selected feature panel |
| Review workspace | `features/techpack-review/components/ReviewDetailScreen.vue` | Separate PDF and workbook viewports. The workbook toolbar opens the issue list and the selected issue has an inline editor above the grid. The desktop footer shows the release blocker, staged correction actions, or verification and approval. The preview panes stack in narrow content areas. |
| Create or edit form | `pages/product/create.vue` (UI only) | Cancel and Save in the navbar `#right` → `UPageCard` → `UForm` |

## Rows

A record's **name opens it**: a `ULink` (or a `UButton variant="link"` for an overlay) that holds only the name. There's no separate Manage, Review, or Open column. In a list of rows, stretch the link over the row (`relative` on the row, `after:absolute after:inset-0` on the link, the focus ring on `after:`). Other row actions sit beside it in a `⋮` `UDropdownMenu`, never inside the link.

## Required states

| State | Show |
| --- | --- |
| Loading | `loading`: the first load, and every filter, search, or page change. Keep the layout in place: `ListSkeleton` in `UTable`'s `#loading` slot (with `:loading` on the table), or in place of a list. Disable the controls that would change the query. Never the empty state, and never the previous filter's rows. |
| Refreshing | `refreshing`: a reload of the same query (Refresh, Retry). The content stays, dimmed under a thin moving bar: wrap it in `<ListRefresh :active="refreshing">` |
| Empty | `ListEmptyState`. "No *X* yet" (with the create action) differs from "No *X* match your filters" (with Clear filters). Pass `title` when the state needs its own words: "No TechPacks are waiting for review." vs "No reviewed TechPacks." |
| Error | `AlertApiError` with the API reason and Retry, in place of the content |
| Pending write | `:loading` on the action, with conflicting actions disabled |
| Gated action | Disabled until its condition is met (for example, attestation), and the condition explained in the UI |
| Static data | When a screen shows placeholder data, say so in the PR. Never present it as live. |

## Review checklist

- [ ] The page is a `UDashboardPanel` with a `UDashboardNavbar` that has a title `icon`.
- [ ] A search box is `InputSearch`; a filter or page change shows `ListSkeleton`, not the previous rows.
- [ ] Loading, refreshing, empty, error, and pending states all render.
- [ ] It reads well in light and dark: semantic tokens only, no `bg-white` or hex.
- [ ] Records open from their name, not a separate Manage column.
- [ ] On a wide screen the title, toolbar, and content line up on one centered edge: no `max-w-*` on the content; a form or settings page has `page-narrow`.
- [ ] It works at 1280px and up, and the sidebar collapses on desktop and opens as a slideover below `lg` without breaking the layout.
- [ ] Keyboard focus is visible, icon-only buttons have an `aria-label`, and record actions show their disabled state.
- [ ] Destructive actions use `<ModalConfirm>` and name the record.
- [ ] No new sidebar link points to a page that doesn't exist.
