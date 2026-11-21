# Admin UI

Admin is a dense desktop-first staff console. Use Nuxt UI components and Admin's shared components ([building blocks](building-blocks.md)).

## Foundation

- **Colors.** `app/app.config.ts` maps `primary` to the `brand` palette (`--color-brand-*` in `app/assets/css/tailwind.css`), `info` to cyan, and `secondary` and `neutral` to neutral. Use semantic utilities (`text-highlighted`, `text-muted`, `border-default`, `ring-default`). Don't add new hex values.
- **Light only.** `ui.colorMode` is `false`, so there's no dark mode. Some surfaces use `bg-white` on purpose. Don't add dark variants.
- **Font.** League Spartan (`--font-sans`).
- **Default sizes.** Buttons, inputs, selects, badges, and switches default to `size: 'lg'` in `app.config.ts`. Don't set `size="lg"` again on each component.
- **Shared `:ui` objects.** `theme/table.ts` (`tableTheme`, a primary header row) and `theme/tab.ts` (`tabTheme`). Pass them as `:ui="tableTheme"` on every `UTable`, and `:ui="tabTheme"` on page-level `UTabs`.
- **Icons.** `lucide:*`, plus the custom `app:*` collection from `app/assets/icons/app`.

## Page anatomy

The `default` layout renders the header and sidebar, and the page fills the main area. Most pages follow this shape (`pages/product/create.vue`, `pages/index.vue`):

```vue
<template>
  <div>
    <LayoutContent>                                      <!-- max-w-7xl, vertical spacing -->
      <LayoutHeading title="Product Management" description="Manage Syncra product listing" to="/product">
        <template #suffix>
          <UButton label="Create product" icon="lucide:plus" />
        </template>
      </LayoutHeading>

      <CardWrapper title="Product Listing Information">  <!-- UCard + CardTitle -->
        <!-- content -->
      </CardWrapper>
    </LayoutContent>
  </div>
</template>
```

`LayoutHeading` with `to` shows a back arrow. The TechPack pages use a plain `<section class="max-w-5xl space-y-5">` instead. Use `LayoutContent` and `LayoutHeading` for new pages.

## Page patterns

| Pattern | Reference | Shape |
| --- | --- | --- |
| Queue or list | `pages/techpack-reviews/index.vue` | Status buttons in the URL → refresh → `UAlert` on error → `UCard` with loading, empty, or list → Previous/Next pager with "Page n of N" |
| Overview + table | `pages/index.vue` (static) | `CardBoxWrapper :cols` with `CardBoxItem` stats → search and filter grid → `UTable :ui="tableTheme"` |
| Detail with tabs | `pages/account/[id].vue` | `LayoutHeading` with a back link → `UTabs :ui="tabTheme"`, one slot per tab, the tab in `?tab=` → each tab renders a feature panel |
| Review workspace | `pages/techpack-reviews/[fileId].vue` | Source and workbook side by side, findings, a correction form, a replacement upload, an attestation checkbox, then Approve |
| Create or edit form | `pages/product/create.vue` (UI only) | `LayoutHeading` with Cancel and Save in `#suffix` → `CardWrapper` → `UForm` |

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

- [ ] The page uses `LayoutContent` and `LayoutHeading`, and its tables use `tableTheme`.
- [ ] Loading, empty, error, and pending states all render.
- [ ] It works at 1280px and up, and the sidebar toggles below `xl` without breaking the layout.
- [ ] Keyboard focus is visible, icon-only buttons have an `aria-label`, and record actions show their disabled state.
- [ ] Destructive actions use `<ModalConfirm>` and name the record.
- [ ] No new sidebar link points to a page that doesn't exist.
