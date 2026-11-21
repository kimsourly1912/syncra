/**
 * Nuxt UI's global configuration: the one place Admin changes component styling (decision 0012).
 * Only layout and overlay changes live here; pages never override color, size, radius, or shadow.
 */
export default defineAppConfig({
  ui: {
    colors: {
      primary: 'brand',
    },
    // Page width (ui.md → Page width): the navbar, the toolbar, and the body share one side
    // padding, `--page-gutter` (tailwind.css), which centers them on a wide screen. Forms opt into
    // the narrow width with `class="page-narrow"` on their UDashboardPanel.
    dashboardNavbar: {
      slots: { root: 'px-(--page-gutter) sm:px-(--page-gutter)' },
    },
    dashboardPanel: {
      slots: { body: 'px-(--page-gutter) sm:px-(--page-gutter)' },
    },
    // On a phone the toolbar wraps instead of scrolling sideways: search on one line, filters on
    // the next.
    dashboardToolbar: {
      slots: {
        root: 'px-(--page-gutter) sm:px-(--page-gutter) max-sm:flex-wrap max-sm:gap-y-2 max-sm:py-2',
        left: 'max-sm:min-w-0 max-sm:flex-1 max-sm:flex-wrap',
      },
    },
    // Tabs never cut a label: a row that doesn't fit scrolls sideways (no scrollbar), and the link
    // variant's underline sits inside the row, since a scrolling box clips what hangs below it.
    tabs: {
      slots: { list: 'overflow-x-auto scrollbar-none', trigger: 'shrink-0', label: 'overflow-visible whitespace-nowrap' },
      compoundVariants: [{ orientation: 'horizontal', variant: 'link', class: { indicator: 'bottom-0' } }],
    },
    // A column title never wraps ("User name" stays on one line); a table wider than its box scrolls.
    table: {
      slots: { th: 'whitespace-nowrap' },
    },
    // Behind a modal or slideover the page is dimmed with black in both modes; Nuxt UI's light
    // `bg-elevated/75` barely dims it.
    // The modal's own dim comes from its `overlay` variant, applied after this slot class: `!` wins.
    modal: {
      slots: { overlay: 'bg-black/50! dark:bg-black/60!' },
    },
    slideover: {
      slots: { overlay: 'bg-black/50 dark:bg-black/60' },
    },
  },
})
