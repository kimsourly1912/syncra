# 0010: Admin pages use Nuxt UI's dashboard and page components

- Status: Accepted
- Date: 2026-11-21
- Scope: Admin. Supersedes item 8 of [0009](0009-admin-typed-endpoints-and-query-toolkit.md) (`LayoutNavMenu`).

## Context

Admin's shell and page chrome were hand-built: a custom header, sidebar and mobile drawer, plus `LayoutNavMenu`, `LayoutContent`, `LayoutHeading`, `CardWrapper`, `CardTitle`, `BaseIconBadge` (built with `tailwind-variants`) and a `useStorage` composable for the collapsed sidebar. Stats and label/value lists were pairs of components (`CardBoxWrapper` + `CardBoxItem`, `ListWrapper` + `ListItem`) where the "item" component looped over the whole list. Every list page copied the same search-and-filter grid. Nuxt UI 4, which Admin already installs, ships all of these pieces.

## Decision

- **Shell.** `layouts/default.vue` is `UDashboardGroup` → `UDashboardSidebar` (collapsible, resizable; Nuxt UI persists its state) with `UNavigationMenu` → the page.
- **Every staff page is a `UDashboardPanel`.** `#header` holds a `UDashboardNavbar` (`title`; a back `UButton` in `#leading`; page actions in `#right`) and, for list filters or page tabs, a `UDashboardToolbar`. `#body` holds the content. The route file owns the panel; feature screens render inside `#body`.
- **Sections and cards are `UPageCard`.** Use `variant="outline"` for a titled card and `variant="naked"` (with `orientation="horizontal"` for actions) for a section heading. Empty or placeholder states are `UEmpty`. Icon badges are `UBadge` with `square`.
- **Shared components exist only where Nuxt UI has no equivalent and two or more screens use it:** `CardStats` (a stat grid built on `UPageGrid` + `UPageCard`), `ListDetails` (a label/value `<dl>`), `InputPassword`, and `ModalConfirm` (built on `UModal`).
- The sidebar still hides links to pages that don't exist. It now does this inline in the layout.

## Alternatives

- **Keep the custom shell and only merge the paired components.** That would be smaller, but it keeps hand-built responsive and collapse behavior that Nuxt UI already provides and tests.
- **Wrap the dashboard panel in an Admin `LayoutPage` component.** That would save a few lines per page, but it hides the Nuxt UI slots (`#leading`, `#right`, toolbar) behind a second API that would need its own documentation.
- **A shared `TableToolbar` component.** Page-level filters fit `UDashboardToolbar` directly. Tables inside tabs use a plain flex row.

## Consequences

- Pages have no description line under the title, because `UDashboardNavbar` shows only a title.
- The mobile sidebar breakpoint moves from `xl` to Nuxt UI's `lg`. The content background follows the Nuxt UI default instead of a hardcoded hex.
- `tailwind-variants` and the `tw` helper are gone from Admin.
- Table status badges still hardcode their color. Status-to-color mapping belongs in each feature once its statuses are confirmed.
