# 0018: Shared testing and UI standards at the root

- Status: Accepted
- Date: 2026-11-26
- Scope: All apps, and the docs that agents follow when they build a feature

## Context

Each app had its own `testing.md` and `ui.md`, but nothing at the root said which tests a feature must ship with, or which UX rules every screen follows:

- The feature standard said only "new logic that can be tested has a test", so each agent decided which layers a feature needed.
- Rules that apply everywhere were written three times in different words: fixtures, both failure paths, required states, the browser report.
- The shared UX rules were uneven. Admin named the 390px phone width and an accessibility baseline; Portal named some of it; Web checked 375px and none of the focus rules. Only Web said success appears only after a confirmed response.

## Decision

1. [`docs/testing-standard.md`](../testing-standard.md) owns *which* tests a feature needs. Every feature or behavior change writes a test plan with one line per layer (unit, component, e2e smoke, agent tools, browser check), naming the tests or saying why a layer isn't needed. The handoff ends with its report template.
2. [`docs/ui-standard.md`](../ui-standard.md) owns the UX rules for every screen: required states, actions and feedback, widths (390px and 1280px+), accessibility, color mode, and a shared review checklist.
3. Each app's `testing.md` and `ui.md` keep the mechanics: commands, mocking, reference tests, theme, page anatomy, components, and the app's own checklist. Where an app doc is stricter, it wins.
4. WebMCP is a test layer only when a feature adds or changes an agent tool. The browser check for a screen is done by an agent driving a real browser (browser automation) or by a person, against a test API.
5. A layer the app can't run yet (Portal e2e, Web's empty suites) is named in the plan and covered by the browser check. Setting up test infrastructure is its own change.

## Alternatives

- **Keep the rules in each app's docs.** That's what drifted: three wordings of one rule, and Web missing half of them.
- **Move the app testing and UI docs to the root.** The mechanics really differ (Admin mocks the transport, Portal mocks `useAPI`; Admin is a dense console, Web a marketing site), so one doc would mix three apps on every page. This follows [0005](0005-shared-conventions-location.md): shared rules at the root, app differences in the app.

## Consequences

- An agent and a reviewer check a feature against the same plan, and an unneeded layer is a written choice, not an omission.
- Web's checklist moved from 375px to 390px to match.
- The app docs still repeat some shared rules. Remove a repeat when you edit that section, and link to the standard instead.
