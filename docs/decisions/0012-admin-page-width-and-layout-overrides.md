# 0012: Admin page width, app-wide layout overrides, and an accessible primary

- Status: Accepted
- Date: 2026-11-21
- Scope: Admin. Supersedes the "no app-wide component overrides" rule of [0010](0010-admin-nuxt-ui-dashboard-shell.md) for layout and overlays only.

## Context

On a wide screen nothing in Admin limited how wide the main content got. At 2560px the page title sat at the far left, the content stretched about 1,700px, and on Product Create a switch sat about 1,700px from its label. The TechPack queue capped itself with its own `max-w-5xl`, so pages already disagreed.

Measured in a headless browser:
- Detail and create pages (`/account/42`, `/product/create`, `/techpack-reviews/101`) highlighted no sidebar item.
- Light mode's primary (Nuxt UI's 500 shade, brand-500) is 2.4:1 on white. That's under WCAG AA's 4.5:1 for links, the active tab, and the white label on solid buttons.

The fixes come from another of the owner's Nuxt UI admin apps.

## Decision

1. **Page width.** `--page-gutter` (`tailwind.css`) is the side padding of `UDashboardNavbar`, `UDashboardToolbar`, and the `UDashboardPanel` body, applied in `app.config.ts`. It centers each page at 80rem (`--container-7xl`). A form or settings page adds `class="page-narrow"` to its panel for 56rem. The TechPack review workspace adds `class="page-wide"` for 96rem (`--breakpoint-2xl`, 1536px), because its PDF and workbook panes sit side by side and 80rem leaves each too narrow. Below the cap the padding equals Nuxt UI's default (1rem, 1.5rem from `sm`). Pages set no `max-w-*` on their content.
2. **App-wide overrides are allowed in `app.config.ts`, for layout and overlays only:**
   - the gutter
   - the toolbar wrapping on phones
   - tab rows scrolling instead of cutting labels, with the link indicator inside the row
   - a black dim behind modals and slideovers

   Pages still never override color, size, radius, or shadow, and there are still no shared `:ui` objects.
3. **Light-mode primary is brand-800** (`--ui-primary`, unlayered in `tailwind.css`). It's 6.7:1 on white, 5.8:1 on its own 10% tint, and 6.1:1 on `bg-elevated`. Dark mode stays on Nuxt UI's 400 shade (8.3:1).
4. **The sidebar highlights a page's section** on the pages under it (`isSectionActive`). `SECTION_PATHS` in the layout maps a section to pages outside its path (Account Management `/` → `/account`).
5. **Thin scrollbars** everywhere.

## Alternatives

- **`UContainer` or a `max-w-*` wrapper in each page body.** This caps the content, but the navbar title and toolbar stay at the panel's edge, so they no longer line up with it. It also has to be repeated on every page.
- **One width for every page.** At 80rem a form's fields and switches still sit far apart, so forms get the narrow width.
- **brand-700 for light primary.** It's the lightest shade that passes on white (4.51:1), but it fails on its tint (4.0:1) and on `bg-elevated` (4.1:1), where the active sidebar item and subtle badges sit.
- **Set the sidebar's active item with `exact: false` links.** Admin's routes are flat (`/account/[id]` isn't nested under `/`), so the router doesn't treat a detail page as inside its section.

## Consequences

- New pages get the width for free; a form or settings page adds `page-narrow`.
- Solid primary buttons and links are darker in light mode, and dark mode is unchanged.
- Nuxt UI upgrades must be checked against the slot names that `app.config.ts` overrides (`dashboardNavbar.root`, `dashboardPanel.body`, `dashboardToolbar.root`/`left`, `tabs.list`/`trigger`/`label`/`indicator`, `modal.overlay`, `slideover.overlay`).
