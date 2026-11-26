# Portal UI

Theme, page anatomy, page patterns, required states, tables, localization, and the review checklist. The shared components themselves are listed in [building blocks](building-blocks.md). The [UI standard](../../../docs/ui-standard.md) sets the UX rules for every app; this doc covers how Portal meets them.

## Foundation

- **Nuxt UI first.** Build with `U*` components: `UDashboardPanel`, `UCard`, `UTable`, `UForm`, `UModal`, `UButton`, `UBadge`, `UEmpty`, `UAlert`. Change their look with props and `:ui` slot classes, not with custom CSS.
- **Colors.** `primary` is the custom `brand` palette (`--color-brand-50` … `950` in `app/assets/css/tailwind.css`), set in `app/app.config.ts`. Use semantic colors (`primary`, `neutral`, `success`, `error`, `warning`, `info`) and semantic utilities (`text-muted`, `text-highlighted`, `bg-elevated`, `border-default`, `ring-default`). Never hardcode hex colors.
- **Color mode.** It defaults to light (`colorMode.preference: 'light'`), and users can switch theme in Settings. Semantic tokens keep both modes working. Check each change in light and dark.
- **Width.** `--container-8xl` is 1536px. `LayoutContent` sizes pages: `sm` 36rem, `md` 48rem, `lg` 64rem, `xl` (default) `max-w-8xl`.
- **Units.** Layouts use rem (`UDashboardGroup unit="rem"`). Convert px with `px / 16`: 1536px is 96rem.
- **Icons.** Use `lucide:*` for UI icons. Custom collections are `app:*` (`app:loading`, `app:file-download`, `app:history-process`), `flag:*`, `logo:*`, and `fluent:*`, from `app/assets/icons/<prefix>/`. To add an icon, put the SVG in the right folder. Don't inline SVG markup in templates.
- **Class strings in TypeScript.** Wrap them in `tw\`…\`` (from `app/utils/common.ts`), so Tailwind tooling sees them. Use `tailwind-variants` (`tv`) for variants, as `LayoutContent.vue` does.

## Page anatomy

Every signed-in page uses the dashboard shell from `layouts/default.vue`:

```vue
<template>
  <UDashboardPanel id="activity">                 <!-- unique id per page -->
    <template #header>
      <LayoutHeader :to="toRoute('/workspace')" title="Back" />   <!-- back link, or a title alone -->
    </template>

    <template #body>
      <LayoutContent size="xl">                    <!-- sm | md | lg | xl -->
        <LayoutHeading title="Activity History" description="View and manage all your extraction activities" />

        <LayoutWrapper title="All Activities">     <!-- section heading with #suffix slot for actions -->
          <!-- section content -->
        </LayoutWrapper>
      </LayoutContent>
    </template>
  </UDashboardPanel>
</template>
```

Auth pages use the `auth` layout, and policy and onboarding pages use `blank`. Route rules set both ([architecture → routes](architecture.md#routes-and-guards)).

## Page patterns

| Pattern | Use for | Reference | Shape |
| --- | --- | --- | --- |
| **Resource list** | Browsing records with filters | `pages/workspace/activity-history/index.vue` | Heading → summary cards (`SatisticCard`) → `LayoutWrapper` → `UCard` whose `#header` has search (`UInput icon="lucide:search"`) and `USelect` filters → `UTable` (`sticky`, `:loading`, `@select` opens the detail page) |
| **Detail** | One record by ID | `pages/workspace/activity-history/[id].vue` | `LayoutHeader` with a back link → summary → sections. Read the ID from `route.params`, and declare the guard. |
| **Settings form** | Editing one record | `pages/settings/account-profile.vue` | `LayoutContent size="lg"` → `LayoutHeading` per section → `BaseCard` → `UForm`. One form per independent save. |
| **Modal form** | Quick create or edit from a list | `features/glossary/components/GlossaryUploadModal.vue` | `defineModel<boolean>('open')`, reset on close, Submit disabled while invalid or pending |
| **Confirm action** | Destructive or costly actions | `<ModalConfirmation>` in `pages/team-management.vue` | Title naming the record, a consequence in the description, `color="error"` for destructive actions, `:loading` while pending |
| **Task wizard** | Multi-step processing (Doc AI) | `pages/workspace/create.vue` (legacy shape) | `UStepper` with Upload → Process → Completed. Treat it as unique; don't generalize it. |
| **Card launcher** | Choosing an app or processor | `pages/index.vue`, `pages/workspace/index.vue` | `WorkspaceCardWrapper` + `WorkspaceCard`, with `WorkspaceCardSkeleton` while loading |

## Required states

Every screen that loads or writes data handles each of these:

| State | Show |
| --- | --- |
| First load | Skeletons or `UTable :loading` with the layout already in place. Don't leave a blank page. |
| Empty | `<EmptyData>` (`UEmpty`), with text that says *why* it's empty. "No activities yet" and "No activities match your filters" are different messages. |
| Load error | `UAlert color="error"` with the reason and a **Retry** action that calls `refresh()`/`execute()` |
| Disabled | The control, plus a hint for why it's disabled (missing files, no seats, not permitted) |
| Pending write | `:loading` on the trigger, other actions disabled, the dialog kept open |
| Success | A toast naming what happened. Refresh the changed data. |
| Write error | A toast with the API reason. The input stays as entered. |
| Not permitted | Hide the entry point (`<ShowIf>`, `isAdmin`). If the API refuses, show its reason instead of a blank page. |

## Tables

- Define columns as `TableColumn<Row>[]`. Render cells with `h()` and Nuxt UI components imported from `#components` (`UBadge`, `UButton`), as `useActivity.useColumn()` does.
- Map API data to a flat row type in a `computed`. Don't render DTOs directly when a cell needs derived values.
- Put row actions in the last column: ghost icon buttons with an `aria-label`. They can show on hover from `sm` (`sm:opacity-0 sm:group-hover:opacity-100`) but must stay reachable by keyboard.
- Show a status as a `UBadge` with `variant="subtle"`. Keep the label, color, and icon for each status in a status map in the feature's `data.ts` (`activityMap`).

## Localization

- Portal ships with `en` (default) and `zh` (`i18n/locales/en-US.json`, `zh-CN.json`), with `strategy: 'no_prefix'`. `SelectLanguage` switches between them.
- So far, only the glossary feature, the workspace index, and a few shared components use `t()`. Most screens are still hardcoded English.
- **New screens** use `const { t } = useI18n()`. Nest keys by feature (`glossary.upload.xlsxOnly`), and add each key to both locale files. Flag new Chinese strings for review in the PR.
- **When editing a hardcoded screen,** match its existing approach. Don't half-translate a screen. Translating a whole screen is its own change.
- Format dates with `dateTimeFormatter` or `dateFormatter` from `app/utils/common.ts`. Format file sizes with `humanFileSize`.

## UI review checklist

Run through this before handing off UI work:

- [ ] The layout follows the page anatomy, and the page has a unique `UDashboardPanel id`.
- [ ] Every required state renders. Try an empty list, a failed request, and a slow request.
- [ ] It works at phone width (no horizontal page scroll, filters stack with `flex-col sm:flex-row`), at desktop width, and with the sidebar collapsed.
- [ ] Light and dark mode both look right.
- [ ] Every action is reachable with the keyboard, focus is visible, and icon-only buttons have an `aria-label`.
- [ ] Destructive actions ask first and name the record.
- [ ] Every `UForm` sets `:validate-on="[]"`. Leaving a field empty and tabbing away shows no error; pressing Submit does ([forms](forms.md)).
- [ ] Admin-only controls are hidden from Operators, and the API refusal is still handled.
- [ ] The text follows the localization rule, and both locale files are updated if keys were added.
- [ ] Nothing shows another company's data after a company switch or logout.
