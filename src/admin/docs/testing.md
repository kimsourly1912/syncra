# Admin testing and verification

Admin has **no automated tests, no Vitest config, and no `test` script**. Its `package.json` has no `lint` script either, so lint runs through `exec`.

## Commands

Run from the repository root:

```bash
pnpm --filter admin exec eslint .
```

```bash
pnpm --filter admin build
```

```bash
pnpm dev:admin
```

## Browser verification

Every Admin change needs a browser check, because there are no tests to catch regressions:

| Area | Check |
| --- | --- |
| Static account screens | Account Management → **Manage** → Account Detail, and switching tabs (`?tab=` updates). These work without an API, using static data. |
| TechPack review queue | Switch In Review and Reviewed, change pages, land on an empty page and get sent back, see the error state when the API fails, and Refresh |
| TechPack review detail | Load it, save a correction, upload a replacement, check that attestation resets when the draft changes, approve, and return to the queue |
| Auth | Sign in, sign out, forgot and reset password. A session that has expired is sent to sign-in. |
| Wired CRUD | List with data, empty, and with an error; create, edit, and delete; Back after a filter or page change |

- Use a staff test account against a test API.
- Never approve or release real customer workbooks while testing.
- Report which data was static, mocked, or live.

## Adding tests

When Admin gets its first focused tests, copy Portal's setup: `vitest.config.ts` with `unit` and `nuxt` projects, the `@nuxt/test-utils` module, and `test:unit` / `test:nuxt` scripts, with the patterns in [Portal testing](../../portal/docs/testing.md). Then update this page and Admin's `AGENTS.md` with the new commands, in the same change. Start with pure helpers, such as review status and finding logic, after moving them out of `pages/techpack-reviews/[fileId].vue`.
