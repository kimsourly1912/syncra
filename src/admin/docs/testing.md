# Admin testing and verification

Admin uses Vitest, with the projects defined in `vitest.config.ts`:

| Project | Files | Environment | Use for |
| --- | --- | --- | --- |
| `unit` | `app/**/tests/*.test.ts` | Node | Pure code: the API client, errors, and session recovery (`api/tests/client.test.ts`), contract helpers, `utils/format.ts`, feature utils |
| `nuxt` | `app/**/tests/*.nuxt.test.ts`, `test/app-shell/*.nuxt.test.ts` | Nuxt (`@nuxt/test-utils`, happy-dom) | Composables, shared list components (`composables/tests/list-toolkit.nuxt.test.ts`), the query and mutation helpers, mounted screens (`features/techpack-review/tests/review-screens.nuxt.test.ts`), and the app shell (route guard, layout) |
| `e2e` | `test/e2e/**/*.test.ts` | Node, with Chromium (`@nuxt/test-utils/e2e`) | Smoke flows on the built app with every API request answered by the test (`smoke.test.ts`): sign-in from a deep link, a wired list, the TechPack queue. Not part of `pnpm test`. |

### Where a test goes

In a `tests/` folder beside the code it covers ([0016](../../../docs/decisions/0016-admin-tests-beside-the-code.md)): `features/<f>/tests/`, `api/tests/`, `composables/tests/`, `utils/tests/`. The suffix picks the project: `.nuxt.test.ts` needs the Nuxt app, plain `.test.ts` runs in Node. One feature per file. `test/` holds only `app-shell/` (guard, layout), `support/` (`fakeApi`, `installModelContext` for [agent tools](agent-tools.md#testing)), and `e2e/`.

## Commands

Run from the repository root:

```bash
pnpm --filter admin exec eslint .
```

```bash
pnpm --filter admin typecheck   # nuxt typecheck (vue-tsc): app, .vue templates, and config
```

```bash
pnpm --filter admin test       # unit + nuxt
```

```bash
pnpm --filter admin build
```

```bash
pnpm --filter admin test:e2e   # builds the app, then drives it in Chromium; first: pnpm --filter admin exec playwright-core install chromium-headless-shell
```

```bash
pnpm dev:admin
```

There's no CI. The git hooks in the root `lefthook.yml` run the checks instead, when a commit or push touches `src/admin`: on commit, ESLint on the staged files, plus `scripts/check-api-contract.mjs` when the spec, the generator, or `app/api/generated` changes; on push, `typecheck`, `test`, then `test:e2e`, stopping at the first failure (about 80 seconds). Run `build` yourself before a merge request.

## Writing tests

- **Mock the transport only.** `fakeApi({ 'GET /admin/docai/techpack-reviews/101': ok(data) })` from `#test/fake-api` (`test/support/fake-api.ts`) replaces the HTTP transport (keys use the filled-in path), so tests run the real client, envelopes, models, and errors. Unknown requests fail.
- **Screens:** mount them with `mountSuspended`, answer each endpoint through `fakeApi`, drive them through the UI (click, then `flushPromises()`), and assert the visible states and the requests sent. Call `clearNuxtData()` in `beforeEach`: queries share data by key across tests. `features/techpack-review/tests/review-screens.nuxt.test.ts` is the reference.
- **A composable on its own:** run it inside a mounted component (`inComponent` in `composables/tests/api-composables.nuxt.test.ts`), because `useApiQuery` needs a component scope.
- **The session:** reset it in `beforeEach` (`await useSession().load()`, then `clearNuxtState(['session:status', 'session:staff'])`). Spy on the real router (`vi.spyOn(useRouter(), 'push')`); mocking `useRouter` breaks the Nuxt boot. `mountSuspended` itself calls `router.replace('/')`, so assert on the calls your code makes, not on none at all. `features/session/tests/session.nuxt.test.ts` is the reference.
- **Cover the failures** for an action: a `success: false` envelope (`refused(reason)`), a thrown error (`httpError(status)`), and a response that breaks the model. Where a decision depends on loaded data (an approval gate), also cover a reload that fails while the old data is still shown.
- **Use sanitized fixtures** that are shaped like the API response. Never use real customer files, names, or credentials.
- **Tests never reach a real API.** The `nuxt` project overrides `apiURL` to `http://api.test.invalid`, because the route guard loads the session when the app boots. Each test then installs `fakeApi`. It also turns `agentTools` on, as in `nuxt dev`.
- **The Nuxt boot is slow.** It takes about 15 seconds on a cold Windows run, so the `nuxt` project's `hookTimeout` is 60 seconds.
- **Imports:** a test imports its own feature relatively (`../components/LeadListScreen.vue`), and everything else through `@/` (another feature only through its `index.ts`). `unit` tests import relatively: the Node project has no Nuxt aliases. Lint and typecheck cover tests like the code beside them.

## Browser verification

Screen tests mount components with a mocked API. They don't cover real layout, routing, file downloads, or the live API, so every change to a screen still needs a browser check:

| Area | Check |
| --- | --- |
| Shell | Sidebar collapses on desktop and opens as a slideover below `lg`. Ctrl/⌘+K and the Search button open page search. Ctrl/⌘+B collapses and expands the sidebar (opens the drawer below `lg`), but not while typing in a field. `?` and the staff menu's Keyboard shortcuts open the shortcut list. The staff menu shows the signed-in email and logs out. Light and dark both work, and a fresh browser starts in light. On a 1920px+ screen the title, toolbar, and content line up, centered at 1280px (forms 896px). A detail or create page keeps its section highlighted in the sidebar. At 390px the toolbar wraps and status tabs scroll. |
| Wired lists (Account Management `/`, Lead Inquiry, Sale Requests) | Totals load, and their failure shows its own error. Search (typing, Enter, Clear; Back skips the typing), status tabs, the sale request type filter, rows per page, and paging all update the URL and the request. Clear filters on a filtered empty list. The error state with Retry. A name opens the account. A lead or sale request row opens its read-only panel (`?lead=`, `?request=`), which survives reload and closes on a filter change; an old `/lead-inquiry/7` link opens the panel. At 390px these lists show cards. |
| Settings (`/setting`) | Tabs update `?tab=`. Profile: change the display name (the staff menu follows), upload and remove a logo. Staff access: a weak or mismatched temporary password is refused before sending; invite, resend, enable, and disable (it asks first) only with a test staff email. Email templates: a template opens read-only (`?template=`). Token packages show in their sort order. Each tab's load error shows Retry. |
| Product and plan forms (UI only) | New and Edit open from the list (⋮ → Edit, or the name). Edit is prefilled from the same sample row, shows Unsaved changes after an edit and Discard changes puts it back, and has Save, Deactivate, and Delete disabled with a reason. An unknown id shows Not found. The preview follows the fields; at 390px the navbar holds Preview and Save. |
| Account Detail | `/account/<id>` loads the summary and Company tab (loading placeholders, an error with Retry, "Account not found" for a bad id or a 404). Switching tabs updates `?tab=`; Modules, Tokens, and Seats say Sample. At 390px the summary stacks, label/value rows stack, and token, member, and seat-history tables become lists. |
| TechPack review queue | Switch In Review and Reviewed, change pages, land on an empty page and get sent back, see the error state with Retry when the API fails, and Refresh (the list dims under a thin bar) |
| TechPack review detail | Load it, save a correction, upload a replacement, check that attestation resets when the draft changes, approve, and return to the queue. With the inspection request failing after a save, the checklist says "Inspection unavailable" and asks for the workbook download. |
| Auth and session | Signed out on a deep link → sign-in → back to the link. Sign out, also with a second tab open. An expired session (refresh refused) → "Session expired" and sign-in. An API outage during renewal keeps the session. An API outage when opening the app → the error page, then "Try again". Sign out after the access token expired. Forgot and reset password (the token leaves the address bar after the change). |
| Wired CRUD | List with data, empty, and with an error; create, edit, and delete; Back after a filter or page change |

- Use a staff test account against a test API.
- Never approve or release real customer workbooks while testing.
- Report which data was static, mocked, or live.
