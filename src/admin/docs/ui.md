# Admin UI

Admin is a dense desktop-first staff console. Use Nuxt UI components and Admin's shared components ([building blocks](building-blocks.md)).

## Foundation

- **Colors.** `app/app.config.ts` maps `primary` to the `brand` palette (`--color-brand-*` in `app/assets/css/tailwind.css`). Every other color is the Nuxt UI default. Use semantic utilities (`text-highlighted`, `text-muted`, `border-default`, `ring-default`). Don't add new hex values.
- **Light only.** `ui.colorMode` is `false`, so there's no dark mode. Some surfaces use `bg-white` on purpose. Don't add dark variants.
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


## Page patterns

| Pattern | Reference | Shape |
| --- | --- | --- |
| Queue or list | `features/techpack-review/components/ReviewQueueScreen.vue` | Status buttons in the URL → refresh → `UAlert` on error → `UCard` with loading, empty, or list → Previous/Next pager with "Page n of N" |
| Overview + table | `pages/index.vue` (static) | Search and filter in `UDashboardToolbar` → `CardStats` → `UTable` |
| Detail with tabs | `pages/account/[id].vue` | Back button in the navbar `#leading` → `UTabs :content="false"` in `UDashboardToolbar`, the tab in `?tab=` → the body renders the selected feature panel |
| Review workspace | `features/techpack-review/components/ReviewDetailScreen.vue` | Source and workbook side by side, findings, a correction form, a replacement upload, an attestation checkbox, then Approve |
| Create or edit form | `pages/product/create.vue` (UI only) | Cancel and Save in the navbar `#right` → `UPageCard` → `UForm` |

## Required states

| State | Show |
| --- | --- |
| Loading | Keep the layout in place. Use "Loading…" text or `:loading` on the table, and disable the controls that would change the query. |
| Empty | A message that depends on the filter: "No TechPacks are waiting for review." vs "No reviewed TechPacks." |
| Error | `UAlert color="error"` with the API reason, and a Refresh or Retry control |
| Pending write | `:loading` on the action, with conflicting actions disabled |
| Gated action | Disabled until its condition is met (for example, attestation), and the condition explained in the UI |
| Static data | When a screen shows placeholder data, say so in the PR. Never present it as live. |

## Review checklist

- [ ] The page is a `UDashboardPanel` with a `UDashboardNavbar`.
- [ ] Loading, empty, error, and pending states all render.
- [ ] It works at 1280px and up, and the sidebar collapses on desktop and opens as a slideover below `lg` without breaking the layout.
- [ ] Keyboard focus is visible, icon-only buttons have an `aria-label`, and record actions show their disabled state.
- [ ] Destructive actions use `<ModalConfirm>` and name the record.
- [ ] No new sidebar link points to a page that doesn't exist.
