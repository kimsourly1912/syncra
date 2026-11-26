# 0019: UI text is sentence case

- Status: Accepted
- Date: 2026-11-26
- Scope: All apps

## Context

The apps disagreed on capitalization. Admin labels are sentence case ("Discard changes", "Temporary password", "Back to queue"). Portal and Web labels are mostly Title Case ("First Name", "Email Address", "Save Change"), with some sentence case mixed in ("Phone number" next to "Phone Number"). No doc set a rule, so each agent picked one, and the mix grew.

## Decision

1. Labels, buttons, titles, tab names, and messages are sentence case: capitalize the first word and proper names only (Syncra, TechPack, Doc AI, ERP).
2. Existing Title Case text stays until its screen is edited. Then convert the whole screen, so one screen never mixes the two.
3. In Portal, the text lives in the locale files: convert the `en-US.json` values the screen uses. Check whether other screens share those keys before changing them.

## Alternatives

- **Title Case everywhere.** Matches more of Portal and Web today, but Admin is fully sentence case and Nuxt UI's own text is sentence case, so it would mean converting Admin and still mixing with the library.
- **Each app chooses.** That's the state that produced mixed screens inside Portal.

## Consequences

- One rule for agents and reviewers, checked in the [UI standard](../ui-standard.md) checklist.
- Portal and Web convert gradually, a screen at a time. A full conversion is its own change.

## Follow-up

- 2026-11-26: Admin wasn't fully sentence case, as the context said: its sidebar, page and navbar titles, "Add Member", and "In Review" were Title Case. They're converted. Names stay proper where the [glossary](../product/scope.md#glossary) makes them so ("Customer Portal", "Create Admin" for a Portal Admin). Admin page names now come from `definePageMeta({ title })` ([0020](0020-admin-lists-and-page-names-from-one-source.md)).
