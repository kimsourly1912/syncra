# 0013: Forms validate on submit only

- Status: Accepted
- Date: 2026-11-25
- Scope: Web, Portal, Admin. Rule owned by [conventions → forms](../conventions.md#forms).

## Context

Nuxt UI's `UForm` defaults to `validateOn: ['input', 'blur', 'change']` (checked in the installed 4.3.0 and 4.13.0). With that default, a field the user tabs through shows "This field is required" before they've finished the form, and a field that was blurred once re-validates on every keystroke. We want errors to appear only after the user asks to submit.

## Decision

- Every `UForm` sets `:validate-on="[]"`. Validation then runs only on submit, through the schema, before `@submit`.
- An error stays visible until the next submit. It doesn't clear while the user types.
- Don't add `@blur` or `@input` handlers that call the form's `validate()`.
- Put the attribute before the event handlers (`@submit`, `@error`) so it keeps the ESLint attribute order.

## Alternatives

- **Keep the default.** Rejected: it shows errors mid-entry, which is the behavior we're removing.
- **`:validate-on="['input']"`.** Rejected: Nuxt UI still tracks blur for input validation, so a field re-validates on typing after the first blur. That's still validation before submit.
- **One app-wide default.** Not possible: `app.config.ts` `ui.form` sets classes, not props, and a wrapper component would be a new helper in three apps. A per-form attribute is explicit and easy to check in review.

## Consequences

- Users see errors only after pressing Submit, all at once.
- A fixed field keeps its error until the next submit. If that becomes a complaint, revisit with `['input']` only after a failed submit.
- Each new `UForm` must add the attribute. The UI review checklists in each app check it.
