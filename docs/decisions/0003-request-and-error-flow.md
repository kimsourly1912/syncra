# 0003: Service → feature composable → component, with both API failure paths handled

- Status: Accepted for Portal and Web. Superseded for Admin by [0008](0008-admin-api-client-and-session.md): one thrown `ApiError` replaces the two failure paths.
- Date: 2026-11-21
- Scope: Portal, Admin, Web

## Context

All three apps call one external API. Its response envelope is `BaseRes<T> = { data, msg, reason, success }`. A request can fail in two different ways:

1. The request **resolves**, but with `success: false` and a `reason`. Example: `src/web/app/composables/useModule.ts` checks `success` before using `data`.
2. The request **throws** a `FetchError`. Its body has `title` and `detail` (`BaseError`), or `reason`/`msg` (`BaseRes`). Example: the `catch` blocks that call `toast.addException` in Portal.

Each page handles these cases its own way, and some get it wrong:

- In `src/portal/app/pages/settings/account-profile.vue`, `updateProfile` catches its own errors. The surrounding `Promise.all` therefore always resolves and shows the success toast even when a request failed.
- In `src/web/app/composables/useContactSale.ts`, `submit()` calls `onSuccess()` after `execute()`, even when `execute()` already reported a failure.

No app has a shared read or mutation helper. Pages call `useAsyncData` directly and write their own `try/catch`, pending refs, and toasts. NUK Cafe solves this with `useApiQuery` and `useMutation`. Syncra doesn't have these, and the docs must not pretend it does.

## Decision

1. **Layers:**
   - A **service** (`app/services/<resource>.service.ts`) builds the endpoint, method, query, and body. It returns the typed `useAPI` promise. It doesn't show toasts, touch stores, or catch errors.
   - A **feature composable** (`use<Feature>`) owns the read state (`useAsyncData`), the action functions, their pending flags, and user feedback.
   - A **component** renders state and calls actions.
2. **An action reports success only after it has confirmed success.** It treats both a thrown error and a resolved `success: false` as failure. A helper that catches its own error must return the outcome, so the caller can tell whether the request worked.
3. **Report failures in one place,** with the app's toast helper. The app data-access docs give the exact snippet.
4. **Read keys include the record's identity**, for example `` `glossary-upload-${companyId}-${uploadId}` ``. Watch the inputs that change the request, and drop responses that arrive after their inputs changed.
5. **Follow-up (not done):** add a small shared helper to each app that turns the two failure paths into one result, for example `{ ok: true, data } | { ok: false, message }`. Change this record to name it once it exists. Until then, use the inline pattern in each app's `docs/data-access.md`.

## Alternatives

- **Port NUK Cafe's `useApiQuery` and `useMutation` now.** They are a large abstraction with concurrency, locking, and batch rules that Syncra hasn't needed yet. Building and migrating them is its own project.
- **Keep each page free to choose.** That is the current state, and it has already produced the success-after-failure bugs above.

## Consequences

- New code is consistent, and agents have one pattern to copy.
- Existing pages keep their own handling until someone edits them. Fix the failure-path handling in any flow you change.
- If several features copy the same result-handling code, that is the signal to build the follow-up helper.
