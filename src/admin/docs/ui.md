# Admin UI

Admin is a dense desktop-first staff console. Use Nuxt UI components and Admin's shared components ([building blocks](building-blocks.md)).

## Foundation

- **Colors.** `app/app.config.ts` maps `primary` to the `brand` palette (`--color-brand-*` in `app/assets/css/tailwind.css`). Every other color is the Nuxt UI default. Use semantic utilities (`text-highlighted`, `text-muted`, `border-default`, `ring-default`). Don't add new hex values.
- **Light and dark.** `colorMode` in `nuxt.config.ts` starts every browser in light (`preference` and `fallback` are `light`, so the system setting is ignored) until staff pick a mode with `UColorModeButton` (sidebar footer, sign-in pages) or the search palette. Use semantic tokens (`bg-default`, `bg-elevated`, `text-highlighted`, `border-default`) so both modes work; don't add `bg-white` or `dark:` variants. The one exception is the TechPack source page, which stays white because it shows a paper PDF page.
- **Font.** League Spartan (`--font-sans`).
- **Nuxt UI defaults.** Use components with their default theme. There are no shared `:ui` objects or app-wide component overrides; pass `:ui` only for a one-off layout need.
- **Icons.** Lucide only (`lucide:*`, from `@iconify-json/lucide`). Write icon names as literal strings: `clientBundle.scan` bundles the icons it finds in the source at build time. Don't add custom SVG collections; pick an Iconify icon instead.

## Page anatomy

The `default` layout is `UDashboardGroup` with a collapsible `UDashboardSidebar` (`UNavigationMenu`); each page is one `UDashboardPanel` beside it ([0010](../../../docs/decisions/0010-admin-nuxt-ui-dashboard-shell.md)). Most pages follow this shape (`pages/product/create.vue`, `pages/index.vue`):

```vue
<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Create New Product">
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

The route file owns the panel. Feature screens (TechPack review) render inside `#body`. `UDashboardNavbar` shows its mobile sidebar toggle by itself.

The sidebar (`layouts/default.vue`) has the logo and collapse button in its header, then a `UDashboardSearchButton` and the navigation. Its footer holds the staff menu (the signed-in email and Log Out) and a `UColorModeButton`. Ctrl/⌘+K opens `UDashboardSearch`, which lists every sidebar page plus Nuxt UI's light/dark commands.


## Page patterns

| Pattern | Reference | Shape |
| --- | --- | --- |
| Queue or list | `features/techpack-review/components/ReviewQueueScreen.vue` | `ListStatusTabs` (status in the URL) + Refresh → `AlertApiError` on error → skeleton rows on the first load → `ListRefresh` around a `UCard` with `ListEmptyState` or the rows → `ListPagination` |
| Overview + table | `pages/index.vue` (static) | `InputSearch` and filters in `UDashboardToolbar` → `CardStats` → `UTable` → `ListPagination` |
| Detail with tabs | `pages/account/[id].vue` | Back button in the navbar `#leading` → `UTabs :content="false"` in `UDashboardToolbar`, the tab from `useUrlTab` → the body renders the selected feature panel |
| Review workspace | `features/techpack-review/components/ReviewDetailScreen.vue` | Source and workbook side by side, findings, a correction form, a replacement upload, an attestation checkbox, then Approve |
| Create or edit form | `pages/product/create.vue` (UI only) | Cancel and Save in the navbar `#right` → `UPageCard` → `UForm` |

## Rows

A record's **name opens it**: a `ULink` (or a `UButton variant="link"` for an overlay) that holds only the name. There's no separate Manage, Review, or Open column. In a list of rows, stretch the link over the row (`relative` on the row, `after:absolute after:inset-0` on the link, the focus ring on `after:`). Other row actions sit beside it in a `⋮` `UDropdownMenu`, never inside the link.

## Required states

| State | Show |
| --- | --- |
| Loading (first) | Keep the layout in place. Use `USkeleton` rows shaped like the content or `:loading` on the table, and disable the controls that would change the query. Never the empty state. |
| Refreshing | The content stays, dimmed under a thin moving bar: wrap it in `<ListRefresh :active="refreshing">` |
| Empty | `ListEmptyState`. "No *X* yet" (with the create action) differs from "No *X* match your filters" (with Clear filters). Pass `title` when the state needs its own words: "No TechPacks are waiting for review." vs "No reviewed TechPacks." |
| Error | `AlertApiError` with the API reason and Retry, in place of the content |
| Pending write | `:loading` on the action, with conflicting actions disabled |
| Gated action | Disabled until its condition is met (for example, attestation), and the condition explained in the UI |
| Static data | When a screen shows placeholder data, say so in the PR. Never present it as live. |

## Review checklist

- [ ] The page is a `UDashboardPanel` with a `UDashboardNavbar`.
- [ ] Loading, refreshing, empty, error, and pending states all render.
- [ ] It reads well in light and dark: semantic tokens only, no `bg-white` or hex.
- [ ] Records open from their name, not a separate Manage column.
- [ ] It works at 1280px and up, and the sidebar collapses on desktop and opens as a slideover below `lg` without breaking the layout.
- [ ] Keyboard focus is visible, icon-only buttons have an `aria-label`, and record actions show their disabled state.
- [ ] Destructive actions use `<ModalConfirm>` and name the record.
- [ ] No new sidebar link points to a page that doesn't exist.
