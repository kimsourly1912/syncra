# 0016: Admin tests sit beside the code they cover

- Status: Accepted
- Date: 2026-11-26
- Scope: Admin. Portal and Web keep `test/unit` and `test/nuxt`.

## Context

Admin's code is organized by feature (0002, 0015), but its tests were organized by Vitest environment: `test/unit/*.test.ts` and `test/nuxt/*.test.ts`. The two layouts disagreed:

- Some test files covered several features. `admin-lists-screens.test.ts` held the account, lead, and sale request lists. `product-plan-forms.test.ts` held two features. Removing or reworking a feature meant editing shared files.
- Tests deep-imported feature internals through `../../app/features/<f>/…`. The lint boundary only covered `app/**`, so nothing checked this.
- `test/unit/**` and `test/fake-api.ts` weren't in any tsconfig, so `pnpm typecheck` never checked them.
- The globs were flat (`test/unit/*.test.ts`), so the folders couldn't grow subfolders.

The folder only existed to tell Vitest which environment a file needs. A file suffix can do that.

## Decision

1. A test lives in a `tests/` folder beside the code it covers: `app/features/<f>/tests/`, `app/api/tests/`, `app/composables/tests/`, `app/utils/tests/`.
2. The suffix picks the environment. `*.nuxt.test.ts` runs in the `nuxt` project; any other `*.test.ts` runs in `unit` (Node).
3. One feature per test file. A test inside a feature imports that feature with relative paths, and anything else through `@/` (other features only through their `index.ts`). `unit` tests import relatively, because the Node project has no Nuxt aliases.
4. `test/` keeps only what no single folder owns: `test/app-shell/` (the route guard, the layout), `test/support/` (`fakeApi`, imported as `#test/fake-api`), and `test/e2e/`.
5. Lint and typecheck cover every test, the same as the code beside it. Tests are exempt only from the feature ban on `try`/`catch`.

## Alternatives

- **Keep `test/unit` and `test/nuxt`, with feature subfolders.** This fixes the multi-feature files, but the tests stay away from the code. They stay outside lint's `app/**` rules and outside the app tsconfig.
- **Put `*.test.ts` next to each source file, with no `tests/` folder.** Nuxt ignores `*.test.ts` when it scans components and pages. It does scan the top level of `composables/` and `utils/` for auto-imports, so a `tests/` folder is the layout that is safe everywhere.

## Consequences

- Deleting a feature folder deletes its tests.
- New tests were typechecked and linted for the first time when they moved. Leftovers from the split, such as unused fixtures, failed lint and were removed.
- The Admin `nuxt.config.ts` defines the `#test` alias and adds `test/app-shell` and `test/support` to the app tsconfig.
