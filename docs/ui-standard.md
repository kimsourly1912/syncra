# UI standard

The UX rules every screen follows, in every app. Each app's `docs/ui.md` covers its theme, page anatomy, components, and its own review checklist ([Admin](../src/admin/docs/ui.md), [Portal](../src/portal/docs/ui.md), [Web](../src/web/docs/ui.md)). Where an app doc is stricter, follow it. The [testing standard](testing-standard.md) says which of these states need a test.

## Required states

A screen that loads or writes data handles each state that applies to it. The app's `ui.md` names the component for each one.

| State | Rule |
| --- | --- |
| Loading | The layout stays in place with a skeleton. Never a blank page, and never the empty state or the previous filter's rows while a new query loads. |
| Refreshing | A reload of the same data keeps the content on screen (Admin shows it with `ListRefresh`). |
| Empty | Say why it's empty. "No *X* yet" (with the create action) differs from "No *X* match your filters" (with Clear filters). |
| Load error | The API reason and a Retry action, in place of the content |
| Not found | A message and a way back to the list |
| Disabled or gated | The control stays visible, with the reason it's disabled |
| Pending write | `:loading` on the action, conflicting actions disabled, the dialog kept open |
| Write error | The API reason. The input stays as entered. |
| Success | Shown only after the API confirms `success: true` ([0003](decisions/0003-request-and-error-flow.md)). Name what happened, and refresh the changed data. |
| Not permitted | Hiding the entry point is navigation only. If the API refuses, show its reason, not a blank page. |
| Static data | Labeled Sample on screen and in the PR. Never presented as live. |

## Actions and feedback

- A destructive action asks first, in a confirmation that names the record.
- A form validates on submit only ([0013](decisions/0013-validate-forms-on-submit.md)), and an action can't be sent twice while it's pending.
- Errors show the API's reason. Don't replace it with a generic message when the API sent one.

## Layout and widths

- Check every screen at **390px** (phone) and **1280px and up** (desktop). Web also checks 768px. Admin also checks with the sidebar collapsed and as a slideover below `lg`.
- At 390px the page never scrolls sideways. Wide content (tables, toolbars, tab rows) scrolls inside its own container or changes layout, as the app's `ui.md` says.
- A direct visit to a URL renders the same screen as navigating to it. Where the app keeps screen state in the URL (Admin's lists, tabs, and panels), a reload keeps it too.

## Accessibility

- Every action can be reached and used with the keyboard, and focus is visible.
- Icon-only buttons have an `aria-label`. Images have `alt` text. Form fields have a visible label.
- Text meets WCAG AA contrast: use the theme's semantic colors, never hand-picked hex.
- A status never relies on color alone: it also has a word or an icon.

## Color mode and text

- Admin and Portal support light and dark, so check both. Web has light only.
- Text follows the app's language rule: English only in Admin and Web, `t()` keys in both locale files for new Portal screens.
- **UI text is sentence case:** capitalize the first word and proper names only, in labels, buttons, titles, and messages ("Discard changes", "Work email", "Back to queue"). Admin already does this. Portal and Web still have Title Case labels ("First Name", "Email Address"): when you edit one of those screens, convert the whole screen at once rather than one label ([0019](decisions/0019-sentence-case-ui-text.md)).

## Shared review checklist

Run this before handing off UI work, then the app's own checklist:

- [ ] Every required state that applies renders: try an empty result, a failed request, and a slow one.
- [ ] Success appears only after a confirmed response; a failed write keeps the input.
- [ ] Destructive actions ask first and name the record.
- [ ] It works at 390px and 1280px+, with no sideways page scroll.
- [ ] A direct visit and normal navigation both work.
- [ ] Keyboard and focus work; icon-only buttons have an `aria-label`.
- [ ] Light and dark both read well, where the app has both.
- [ ] New and edited text is sentence case.
