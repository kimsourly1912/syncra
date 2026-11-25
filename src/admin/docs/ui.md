# Admin UI

Admin is a dense desktop-first staff console. Use Nuxt UI components and Admin's shared components ([building blocks](building-blocks.md)).

## Foundation

- **Colors.** `app/app.config.ts` maps `primary` to the `brand` palette (`--color-brand-*` in `app/assets/css/tailwind.css`). Every other color is the Nuxt UI default. Use semantic utilities (`text-highlighted`, `text-muted`, `border-default`, `ring-default`). Don't add new hex values. **Light mode's primary is the 800 shade** (`--ui-primary` in `tailwind.css`): brand-500, Nuxt UI's default, is 2.4:1 on white, under WCAG AA's 4.5:1. brand-800 passes on white, on its own tint, and on `bg-elevated`. Dark mode keeps the 400 shade. Change the shade there, never per page.
- **Light and dark.** `colorMode` in `nuxt.config.ts` starts every browser in light (`preference` and `fallback` are `light`, so the system setting is ignored) until staff pick a mode with `UColorModeButton` (sidebar footer, sign-in pages) or the search palette. Use semantic tokens (`bg-default`, `bg-elevated`, `text-highlighted`, `border-default`) so both modes work; don't add `bg-white` or `dark:` variants (lint rejects them, and hex classes). Two places stay white on purpose, and are the only exceptions in `eslint.config.mjs`: the TechPack source page (a paper PDF page) and the email template preview (customer email HTML).
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
      <UDashboardNavbar title="New product" :toggle="false"> <!-- nested page: no menu button, no title icon -->
        <template #leading>                                <!-- nested pages only -->
          <UButton icon="lucide:arrow-left" color="neutral" variant="ghost" to="/product" aria-label="Back to products" />
        </template>
        <template #right>
          <UButton icon="lucide:check" aria-label="Create product">
            <span class="hidden sm:inline">Create product</span>   <!-- icon only on a phone -->
          </UButton>
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

Simple routes own the panel and render their contents inside `#body`. Feature screens own the panel when it contains feature navigation or state, as in Account Detail, TechPack reviews, and the Admin lists. Page-level actions go in through a slot (`AccountListScreen` `#actions`).

**Top-level pages** (the ones in the sidebar) show the title with an icon (`UDashboardNavbar` `icon`), the same Lucide icon as their sidebar entry, so the page and its link read as one. Below `lg` the navbar adds the menu button that opens the sidebar by itself.

**Nested pages** (a detail, create, edit, or review page under a sidebar section) lead with a back button to their list in `#leading` instead. They set `:toggle="false"` so a phone shows no menu button, and they have no title icon: the back button is the way out, and the title keeps its room. The section stays highlighted in the sidebar on a wide screen.

The sidebar (`layouts/default.vue`) has the logo and collapse button in its header, then a `UDashboardSearchButton` and the navigation. Its footer holds the staff menu (the signed-in email and Log Out) and a `UColorModeButton`. Ctrl/⌘+K opens `UDashboardSearch`, which lists every sidebar page, a Keyboard shortcuts command, and Nuxt UI's light/dark commands. Ctrl/⌘+B collapses the sidebar on a wide screen and opens or closes its drawer below `lg`. `?`, the staff menu, and the search palette open `ModalShortcuts`, the list of every shortcut: when you add or remove a shortcut, update its list. Page-wide shortcuts use `defineShortcuts`, which pauses them while typing in a field. A section stays highlighted on the pages under it (`/techpack-reviews/101`, `/product/create`) through `isSectionActive`. When a section's pages live elsewhere, list them in the layout's `SECTION_PATHS` (Account Management is `/`, its details are `/account/<id>`).

### Navbar on a phone

A phone (390px, and down to 320px) has room for the title and **at most two icon buttons** beside the menu or back button. Check the page in each of its modes (reading and editing, for example), since each can add buttons.

1. **Labels go below `sm`.** An action with a label becomes icon only: put the label in `<span class="hidden sm:inline">` and give the button an `aria-label`.
2. **Repeats go.** A Cancel that the back button repeats is hidden, and badges such as Sample data are hidden or move into the body.
3. **A third action moves into the body.** Keep the page's main actions (Save, Cancel while editing, Create) in the navbar, and show the rest as a full-width button at the top of the body below `sm` (`HeroScreen`: Preview).
4. **The title shortens with "…", never mid-letter.** `app.config.ts` makes the title a block, since `truncate` can't draw the ellipsis on Nuxt UI's flex title. A `#title` slot keeps its text in one inline element. Keep titles short, because they are what's left when the buttons take their room.

## Page width

On a wide screen a page's content is centered and capped, so lines stay short. The navbar, the toolbar, and the body share one side padding, `--page-gutter` (`tailwind.css`, applied in `app.config.ts`), so the title, the search box, and the content line up on one edge. Borders and the toolbar still run the full width.

| Page | Width | How |
| --- | --- | --- |
| Lists, tables, queues, detail pages (the default) | 80rem (1280px) | nothing |
| Forms and settings (`ProductFormScreen`, `PlanFormScreen`, `HeroScreen`, `SettingsScreen`) | 56rem (896px) | `class="page-narrow"` on the page's `UDashboardPanel` |

Pages set no `max-w-*` on their content and no breakpoints for width. Below the cap the side padding is Nuxt UI's own (1rem, 1.5rem from `sm`). The width is the panel's, so it holds with the sidebar open or collapsed.

## Tabs and toolbars

- A tab row that doesn't fit scrolls sideways with no visible scrollbar; a label is never cut or shortened.
- On a phone, `UDashboardToolbar` wraps instead of scrolling: the search on one line, filters on the next. Give fixed-width controls a width that can shrink (`w-full max-w-sm`).


## Page patterns

| Pattern | Reference | Shape |
| --- | --- | --- |
| Queue or list | `features/techpack-review/components/ReviewQueueScreen.vue` | `ListToolbarTabs` in the toolbar (status in the URL; one line, not two) + the tab's total + Refresh → `AlertApiError` on error → card-shaped skeletons on the first load → `ListEmptyState`, or `ListRefresh` around a grid of cards (1 to 4 columns; the name, clamped to three lines, opens the record) → `ListPagination` |
| Overview + table | `features/lead-inquiry/components/LeadListScreen.vue` | `ListToolbarTabs` with the summary endpoint's totals as count badges, then `InputSearch` and filters in a second `UDashboardToolbar` → the totals' `AlertApiError` → `AlertApiError` or `ListRefresh` around `UTable :loading` (from `md`: a few combined columns, the whole row opens the record) and cards on a phone, each with `ListEmptyState` → `ListPagination` with rows per page → a read-only `USlideover` for the open record, kept in the URL (`?lead=`) |
| Detail with tabs | `features/account/components/AccountDetailScreen.vue` | Back button in the navbar, followed by the account summary and `ListToolbarTabs` in `UDashboardToolbar`. The tab comes from `useUrlTab`. The summary and tabs scroll with the tab content on narrow screens. The layout follows the panel's width (`@container`): the summary's facts go 1 → 2 → 4 columns, label/value rows stack the label above the value below 22rem, and a table becomes a list of two-line rows when its card is narrow. Tabs without an API carry a Sample badge and a notice. |
| Review workspace | `features/techpack-review/components/ReviewDetailScreen.vue` | Separate PDF and workbook viewports that fill the height between the header and the footer (at least 28rem), each scrolling inside itself, so one pane's content never sets the other's height. From `xl` they sit side by side in a `USplitter` the reviewer can drag (saved per browser, each pane with a minimum width); below `xl` tabs show one at a time, both kept mounted, and an issue offers View in PDF. The workbook toolbar opens the issue list and the selected issue has an inline editor above the grid. The footer shows staged correction actions, or an approval checklist (every remaining step at once, display only; folded below `xl`) above the attestation and Approve. Size-grid sheets keep their header row in view and, in a pane at least 40rem wide, pin the Dim column. Every load has a placeholder in its own shape (the workspace, the PDF page, the grid), a reload after a save dims the grid under `ListRefresh`, and a download shows its spinner on its own button. A failed PDF preview offers Download PDF as its main action. After approval the screen shows the result with Back to queue and Open next review. |
| Create or edit form | `features/product/components/ProductFormScreen.vue` (UI only) | One screen for New and Edit (`product` prop): Edit prefills the form, shows the record's name and last update with an Unsaved changes badge and Discard changes once something differs, and ends with a Danger zone card (deactivate, delete; disabled until the API exists). An unknown id shows Not found. Back button, no menu button or title icon; Cancel and Create in the navbar `#right` (icon only on a phone; disabled with a reason until the API exists) → `UPageCard` sections → a live preview beside the form from `lg`, and in a `UModal` from a navbar Preview button below it. One `createReusableTemplate` draws both: framed (border, background, padding) beside the form, and `bare` in the modal, so the modal's own padding isn't doubled on a phone |

## Rows

A record's **name opens it**: a `ULink` (or a `UButton variant="link"` for an overlay) that holds only the name. There's no separate Manage, Review, or Open column. In a list of rows, stretch the link over the row: `relative` on the row and `class="row-link"` on the link (`tailwind.css`: it stretches, colors, and draws the focus ring); a card row adds `after:rounded-lg`, and a `ULink` adds `raw` so its own link colors don't override the class. Other row actions sit beside it in a `⋮` `UDropdownMenu`, never inside the link.

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

- [ ] The page is a `UDashboardPanel` with a `UDashboardNavbar`: a top-level page has a title `icon`; a nested page has a back button, `:toggle="false"`, and no icon.
- [ ] At 390px, in every mode of the page, the navbar fits on one line: at most two icon-only actions (each with an `aria-label`), and a long title ends in "…", not mid-letter.
- [ ] A search box is `InputSearch`; a filter or page change shows `ListSkeleton`, not the previous rows.
- [ ] Loading, refreshing, empty, error, and pending states all render.
- [ ] It reads well in light and dark: semantic tokens only, no `bg-white` or hex.
- [ ] Records open from their name, not a separate Manage column.
- [ ] On a wide screen the title, toolbar, and content line up on one centered edge: no `max-w-*` on the content; a form or settings page has `page-narrow`.
- [ ] It works at 1280px and up, and the sidebar collapses on desktop and opens as a slideover below `lg` without breaking the layout.
- [ ] Keyboard focus is visible, icon-only buttons have an `aria-label`, and record actions show their disabled state.
- [ ] Destructive actions use `<ModalConfirm>` and name the record.
- [ ] Every `UForm` sets `:validate-on="[]"`. Leaving a field empty and tabbing away shows no error; pressing Submit does ([forms](forms.md)).
- [ ] No new sidebar link points to a page that doesn't exist.
