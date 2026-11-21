# 0009: Admin endpoints typed from the spec, no service layer, and query, mutation, and list helpers

- Status: Accepted
- Date: 2026-11-21
- Scope: Admin. Builds on [0008](0008-admin-api-client-and-session.md) and [0007](0007-generated-api-contract.md).

## Context

After 0008, Admin had one client and one error type, but feature code still had these problems:

- **Hand-written, unchecked paths.** Each service repeated `PREFIX`/`PARTS` constants and built paths with `buildEndPoint<Parts>`. Its part type is `DeepValue<T> | ({} & string | number)`, so any string compiled. A typo or a removed endpoint failed only at runtime.
- **The spec already knew every endpoint.** `types.gen.ts` has each Admin operation's URL template (`url: '/admin/docai/techpack-reviews/{fileId}/approve'`) with typed `path`, `query`, and `body`, but nothing connected it to the calls. Request bodies weren't checked against the spec.
- **Services were pass-throughs.** After 0008, `getReview` was one line: `api.get(fileEndpoint(id), { signal, model })`. The layer added a file, an import, and a mock target, but no logic.
- **Every composable hand-wrote request state.** `useReviewQueue` and `useReviewDetail` held three `AbortController`s, a `disposed` flag, and loading and error refs, plus `try`/`catch`/`finally` per call. The most-copied code was the boilerplate.
- **A god composable and a god screen.** `useReviewDetail.ts` (337 lines) and `ReviewDetailScreen.vue` (625 lines) held the PDF preview, the inspection, the edits, the uploads, the downloads, and approval.
- **The queue's URL page was zero-based** (`?page=1` showed "Page 2").
- **Review detail toasted with `useToast()` directly**, unlike the rest of the app.
- **The layout's menu was written twice** (sidebar and drawer). The drawer had a leftover `title="qweqwe"`, and links to missing pages raised router warnings.

NUK Cafe has no service layer: feature composables call `apiFetch` inside `useApiQuery` (built on `useAsyncData`) and `useMutation` (toasts, record locks, batches, undo). Nuxt 4.6's `useAsyncData` passes an abort `signal` to the handler, has an `enabled` option, and keeps the previous key's data while a new key loads. It also rethrows failures through `createError`, so the original error ends up in `cause`.

## Decision

1. **Endpoints typed from the spec.**
   - `pnpm --filter admin api:gen` runs `scripts/gen-endpoints.mjs` after `openapi-ts`. The script writes `generated/endpoints.gen.ts`, which maps `'METHOD /path'` to the request type `@hey-api/typescript` generated for it.
   - The generator fails if a name doesn't resolve to a type with the same URL.
   - `api.get('/admin/x/{id}', { path, query, body })` checks the method, path, path params, query, and body at compile time. Options are required when the operation has required params.
   - Multipart operations are listed in `MULTIPART_ENDPOINTS`, and their object body is sent as `FormData`.
   - `buildEndPoint`, `PREFIX`, and `PARTS` are removed.
2. **No service layer.** Feature composables call `api` directly with a model. Features have `models/`, `composables/`, `components/`, and `utils/`, with no `services/`. The session's renewal call (`renewSession`) is a named export of `useSession.ts`, because the plugin passes it to the client.
3. **`useApiQuery(key, fetcher, { enabled })`** (`app/composables/`):
   - It's built on `useAsyncData`. The key is `'<feature>:<name>:<inputs…>'`; a getter key reloads when its inputs change, and the fetcher receives `signal`.
   - It returns `data`, `loading`, `refreshing`, `pending`, `error` (an `ApiError`), and `refresh`.
   - The last good data stays on screen through a `retryable` failure, for the same key only.
   - `invalidateQueries(...prefixes)` refreshes the matching queries on screen.
4. **`useApiMutation(fn, { success, error, invalidate })`.** `execute(input)` never throws: it resolves to `{ ok: true, data }` or `{ ok: false, error }`. It shows the success and failure toasts (none for silent errors), exposes `pending`, skips a call while one is running, and invalidates after success. Features write no `try`/`catch`.
5. **`useListQuery(choices)`.** Filters and the page live in the URL, and the page is 1-based there. Each filter is one of its choices, and the first choice is the default, left out of the URL. A filter change goes back to page 1, and `clampPage` moves a page past the end back to the last one.
6. **`ApiError.from` walks the `cause` chain**, and `ApiError` gains `retryable` (`network`, `timeout`, `server`).
7. **TechPack review is the reference again.** It's split into `useReview`, `useSourcePreview`, `useDraftInspection`, and `useReviewActions`, composed by `useReviewDetail`. The panels (`ReviewSourcePanel`, `ReviewWorkbookPanel`, `ReviewFindingsList`, `ReviewWorkbookGrid`, `ReviewActionsBar`) read it through VueUse's `createInjectionState`. A change of `draftUuid` clears the staged edits and the attestation.
8. **The layout menu is one component** (`LayoutNavMenu`). It hides links to pages that don't exist, using the route table, so the router logs no warnings.

## Alternatives

- **A URL union only (no method map).** Path params would still be typed, but method, query, and body wouldn't be checked.
- **`openapi-typescript` for its `paths` type** (the type `openapi-fetch` uses). It's standard and fully typed, but it means two type generators side by side, and our client would still need its own session recovery.
- **The hey-api SDK plugin.** Its function names come from the backend's unstable operation IDs (`getMyProfile_1`), as 0007 noted.
- **Keep thin request files per feature.** They allow reuse outside composables, but with typed paths each function is one line, and every request would gain an indirection. The one request used outside a composable (`renewSession`) is a named export.
- **Port NUK Cafe's full toolkit** (record locks, batches with progress, undo, `staleTime` caching). Admin's screens don't need it yet; each piece can be added when a screen does.
- **Use `useAsyncData` directly in features.** Every feature would repeat the key convention, the `ApiError` conversion, keeping data through a dropped connection, and invalidation.

## Consequences

- A spec change that removes or changes an endpoint fails typecheck at the call site.
- Feature composables are short, and the screen composables read as: inputs → `useApiQuery` → state → `useApiMutation` actions.
- Tests target composables and screens through the fake transport (`test/fake-api.ts`), with keys that use the filled-in path. Screen tests call `clearNuxtData()` between tests, because queries share data by key.
- **Behavior changes:** the queue URL page is 1-based. The review's Back link keeps the queue's tab and page. Review errors and success messages are toasts instead of inline alerts. Sidebar links to missing pages are hidden.
- Typecheck checks every call against 70 operations. That's fast in practice (seconds), but a call that fails to type-check can make TypeScript evaluate many candidates.
- Portal and Web keep 0003 and their services; adopting this is a separate change.
