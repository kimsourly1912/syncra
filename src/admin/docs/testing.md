# Admin testing and verification

Admin uses Vitest, with the projects defined in `vitest.config.ts`:

| Project | Files | Environment | Use for |
| --- | --- | --- | --- |
| `unit` | `test/unit/*.test.ts` | Node | Pure code, such as the API contract helpers and feature utils (`api-contract.test.ts`, `techpack-findings.test.ts`) |
| `nuxt` | `test/nuxt/*.test.ts` | Nuxt (`@nuxt/test-utils`, happy-dom) | Services, composables, and mounted screens (`auth-forms.test.ts`, `techpack-review-service.test.ts`, `techpack-review-screens.test.ts`) |
| `e2e` | `test/e2e/*.test.ts` | Node | None yet |

## Commands

Run from the repository root:

```bash
pnpm --filter admin exec eslint .
```

```bash
pnpm --filter admin typecheck   # nuxt typecheck (vue-tsc): app, .vue templates, and config
```

```bash
pnpm --filter admin test
```

```bash
pnpm --filter admin build
```

```bash
pnpm dev:admin
```

## Writing tests

- **Mock the transport, not the service.** Mock `useAPI` or `useRawAPI` with `mockNuxtImport`, and call the real feature service or composable, so tests also run the model parsing. `test/nuxt/techpack-review-service.test.ts` is the reference.
- **Screens:** mount them with `mountSuspended`, mock `useAPI` per endpoint, and assert the visible states: data, a resolved failure, and a contract error. `test/nuxt/techpack-review-screens.test.ts` is the reference.
- **Code that `nuxt.config.ts` imports** (`app/constants/route.ts`) is type-checked in the Node config project, where the `@/` alias doesn't exist. Use relative imports there.
- **Cover both failure paths** for an action: a resolved `success: false`, and a thrown error. Add a case for a response that breaks the model (`ApiContractError`).
- **Use sanitized fixtures** that are shaped like the API response. Never use real customer files, names, or credentials.
- **Tests never reach a real API.** The `nuxt` project overrides `apiURL` to `http://api.test.invalid`, because the profile plugin sends a request when the app boots.
- **The Nuxt boot is slow.** It takes about 15 seconds on a cold Windows run, so the `nuxt` project's `hookTimeout` is 60 seconds.
- Imports in tests use relative paths into `app/` (`../../app/features/auth`), as Portal's tests do.

## Browser verification

Screen tests mount components with a mocked API. They don't cover real layout, routing, file downloads, or the live API, so every change to a screen still needs a browser check:

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
