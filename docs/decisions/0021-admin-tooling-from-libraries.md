# 0021: Admin checks its architecture, routes, accessibility, and dead code with libraries

- Status: Accepted
- Date: 2026-11-26
- Scope: Admin. Knip and the doc-link check are set up at the root; only Admin is configured.

## Context

Admin's rules were checked by hand-written lint patterns, a home-made exports test, and review. Several gaps had no check at all:

- "Shared code never imports a feature" lived only in the docs.
- Route paths were strings, so a renamed page left broken links.
- Nothing checked accessibility beyond icon-only buttons. The first automated scan found every page missing `<html lang>`, and text and badges below WCAG AA contrast.
- Unused files, exports, and dependencies built up. The first scan found 8 unused exported models, 12 dead types, and `ofetch` used but not listed.
- Test fakes were written by hand against a transport stub.

## Decision

1. **Layers in lint** with `eslint-plugin-boundaries` (`boundaries/dependencies`, `default: 'disallow'`). Each folder under `app/` is an element and each feature its own. The allowed imports are listed in `eslint.config.mjs`. `eslint-import-resolver-typescript` resolves `@/` from `.nuxt/tsconfig.app.json`. The older `FEATURE_INTERNALS` restriction stays, for its clearer message.
2. **Typed routes** with Nuxt's `experimental.typedPages`. Pages read params through `useRoute('<name>')`, and the sidebar names routes. String paths still compile unchecked.
3. **Accessibility** with `@axe-core/playwright` in the e2e sweep, at WCAG 2.1 A and AA, in light and dark mode. To pass it:
   - `<html lang="en">`;
   - light-mode status colors darkened like primary (0012): success and warning 800, info and error 700. Dark mode keeps the 400 shades;
   - `text-dimmed` replaced by `text-muted`, and banned in lint. Placeholder previews use italics to stay distinct.
4. **Dead code** with Knip (`knip.json`), run in the pre-push hook for Admin (about 2 seconds). Nuxt's implicit packages are listed under `ignoreDependencies`.
5. **Tailwind class lint** with Nuxt UI's `@nuxt/ui/eslint` (`eslint-plugin-better-tailwindcss`): raw palette colors and conflicting classes are errors. It's registered in `eslint.config.mjs`, not with `ui: { eslint }`, because on Windows that option generates an import of a bare `C:/` path, which Node rejects.
6. **Dates** with `@internationalized/date`, the library Nuxt UI's `UCalendar` and `UInputDate` use. `utils/format.ts` parses calendar days with it (`parseCalendarDay`) and formats them in UTC, so a day is the same day for every reader.
7. **MSW** from Hey API's `msw` plugin, as a pilot. `test/support/msw.ts` (`useMswApi`) sends requests through the real `$fetch` and answers with the generated handlers, which are typed per endpoint. `fakeApi` stays the default. Lint keeps `msw` out of app code.

## Alternatives

- **Hey API's Faker plugin.** Tried and dropped: `openapi-ts.config.ts` makes every field nullable to match Spring's output, so the generated fakes are `null` half the time and fail the feature models. Revisit when the spec marks required fields.
- **Moving every test to MSW now.** The plugin is "In Progress" upstream, and the generated handler names follow the backend's unstable operationIds (`getPackages1`). One pilot test, behind one helper, keeps the cost of a breaking change small.
- **Contrast fixes per screen.** Over 30 places used `text-dimmed` or the 500-shade badges; a token-level fix covers them, and lint plus axe keep it fixed.
- **Hand-written exports test only.** Knip also finds unused files and dependencies, which the test couldn't.

## Consequences

- Each new top-level folder needs a boundaries element.
- Typed routes and the MSW plugin are both experimental upstream, so an upgrade can break them.
- The e2e sweep fails on accessibility regressions; keyboard use and focus order still need a person.
- The pre-push hook gains Knip; the commit hook's lint is slower by the boundaries resolver.
