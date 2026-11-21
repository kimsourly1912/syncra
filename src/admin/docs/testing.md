# Admin testing and verification

Admin uses Vitest, with the projects defined in `vitest.config.ts`:

| Project | Files | Environment | Use for |
| --- | --- | --- | --- |
| `unit` | `test/unit/*.test.ts` | Node | Pure code: the API client, errors, and session recovery (`api-client.test.ts`), contract helpers, feature utils |
| `nuxt` | `test/nuxt/*.test.ts` | Nuxt (`@nuxt/test-utils`, happy-dom) | Services, composables, the route guard, and mounted screens (`session.test.ts`, `auth-forms.test.ts`, `techpack-review-*.test.ts`) |
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

- **Mock the transport, not the service.** `fakeApi({ 'GET admin/…': ok(data) })` from `test/fake-api.ts` replaces only the HTTP transport, so tests run the real client, envelopes, models, and errors. Unknown requests fail. `test/nuxt/techpack-review-service.test.ts` is the reference.
- **Screens:** mount them with `mountSuspended`, answer each endpoint through `fakeApi`, and assert the visible states: data, a refused request, and a contract error. `test/nuxt/techpack-review-screens.test.ts` is the reference.
- **The session:** reset it in `beforeEach` (`await useSession().load()`, then `clearNuxtState(['session:status', 'session:staff'])`). Spy on the real router (`vi.spyOn(useRouter(), 'push')`); mocking `useRouter` breaks the Nuxt boot. `test/nuxt/session.test.ts` is the reference.
- **Cover the failures** for an action: a `success: false` envelope (`refused(reason)`), a thrown error (`httpError(status)`), and a response that breaks the model.
- **Use sanitized fixtures** that are shaped like the API response. Never use real customer files, names, or credentials.
- **Tests never reach a real API.** The `nuxt` project overrides `apiURL` to `http://api.test.invalid`, because the route guard loads the session when the app boots. Each test then installs `fakeApi`.
- **The Nuxt boot is slow.** It takes about 15 seconds on a cold Windows run, so the `nuxt` project's `hookTimeout` is 60 seconds.
- Imports in tests use relative paths into `app/` (`../../app/features/auth`), as Portal's tests do.

## Browser verification

Screen tests mount components with a mocked API. They don't cover real layout, routing, file downloads, or the live API, so every change to a screen still needs a browser check:

| Area | Check |
| --- | --- |
| Static account screens | Account Management → **Manage** → Account Detail, and switching tabs (`?tab=` updates). These work without an API, using static data. |
| TechPack review queue | Switch In Review and Reviewed, change pages, land on an empty page and get sent back, see the error state when the API fails, and Refresh |
| TechPack review detail | Load it, save a correction, upload a replacement, check that attestation resets when the draft changes, approve, and return to the queue |
| Auth and session | Signed out on a deep link → sign-in → back to the link. Sign out, also with a second tab open. An expired session (refresh refused) → "Session expired" and sign-in. An API outage during renewal keeps the session. Forgot and reset password. |
| Wired CRUD | List with data, empty, and with an error; create, edit, and delete; Back after a filter or page change |

- Use a staff test account against a test API.
- Never approve or release real customer workbooks while testing.
- Report which data was static, mocked, or live.
