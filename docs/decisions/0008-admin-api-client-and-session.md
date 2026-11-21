# 0008: Admin API client with one failure path, a session feature, and page-meta route access

- Status: Accepted
- Date: 2026-11-21
- Scope: Admin. Supersedes [0003](0003-request-and-error-flow.md) for Admin, changes point 4 of [0007](0007-generated-api-contract.md), and refines rule 6 of [0002](0002-feature-folders-and-public-api.md) for app wiring.

## Context

Admin's request and session code had grown from several pieces that each did part of the job:

- `useAPI` (`composables/useAPI.ts`) refreshed the session on a 401 with `async-mutex`, a boolean flag, a double-check, and a 5-second lock timeout. It called `useNuxtApp()` and `useAuth()`, so every feature composable wrapped service calls made after an `await` in `nuxtApp.runWithContext(...)`.
- A request sent before a refresh finished, but answered with 401 after it, started a second refresh.
- When N requests expired together, `logoutProps().execute()` ran N times. If the logout call threw, the user was never sent to sign-in.
- Tabs weren't coordinated, but they share the refresh cookie.
- Services returned `{ success, data } | { success: false, reason }` from `parseEnvelope`, and composables also caught thrown errors. Every action handled two failure paths (0003), and screens read `data.reason`, `data.detail`, and `data.msg` off raw `FetchError`s.
- Session state was split across `useAuth` (`useState`), `useProfile` (`useNuxtData` plus Nuxt's internal `_asyncData`), and a blocking boot plugin with a misspelled name (`steup.client.ts`) that ran after the API plugin only because of alphabetical order.
- Route access came from `constants/route.ts`: maps named `routePublic` (meaning protected) and `routePrivate` (meaning guest) generated `routeRules`. `/techpack-reviews` wasn't in the map, so its pages added `middleware: 'auth'` themselves.
- Observed against the dev API on 2026-11-21: `POST admin/auth/refresh` without a valid refresh cookie answers HTTP 500 with `{ success: false, reason: 'refreshToken blank' }`, not 401.

NUK Cafe (`app/utils/api-fetch.ts`, `app/utils/api-error.ts`) uses a pure fetch factory that takes its session callbacks as parameters, a single `ApiError`, and a module-level `apiFetch` configured by a plugin. It has no token refresh, because Better Auth renews its cookie.

## Decision

1. **One client, one error.** `@/api` exports `api.get/post/put/patch/delete/download`. A request passes a `model`, and the client unwraps the `ResponseMsg*` envelope and parses `data` into it. Every failure throws `ApiError`, with a `kind`, a `status`, the API's `reason`, a user-safe `message`, and `silent` for cancelled requests and an ended session. A `success: false` envelope is `kind: 'rejected'` on any status except 401 and 403. `parseEnvelope` and `ApiContractError` are removed.
2. **Session recovery inside the client** (`app/api/recovery.ts`):
   - Concurrent 401s share one renewal. A request sent before the last renewal finished retries without renewing.
   - Renewal runs under a Web Lock, so tabs renew one at a time.
   - A request retries at most once.
   - A refused renewal (`rejected`, `unauthorized`, `forbidden`, `validation`) ends the session and throws a silent `unauthorized`. Any other renewal failure is thrown, and the session stays.
   - Calls that set or clear cookies pass `auth: false`. Nothing else is retried (`retry: false`).
3. **A session feature** (`features/session`) owns who is signed in: `useSession()` with `status`, `staff`, `signedIn`, `load` (one in-flight request), `reload`, `signIn`, `signOut` (confirmed by the API), and `end(reason)` (idempotent). `useSessionSync` broadcasts sign-in and sign-out to the other tabs. `features/auth` keeps the form composables.
4. **One plugin.** `plugins/session.client.ts` calls `configureApi` with the session's renewal and `end('expired')`, and starts tab sync. Nothing blocks the boot.
5. **Route access from page meta.** `middleware/access.global.ts` awaits `useSession().load()` and checks `definePageMeta({ access })`. Pages are `staff` by default; the sign-in pages are `guest` with `layout: 'auth'`. A signed-out visitor goes to `/auth/sign-in?redirect=<page>`, and `redirectTarget` accepts only in-app, non-guest paths. `constants/route.ts`, `routeRules`, `toRoute`, and the `auth` and `guest` middleware are removed.
6. **App wiring may use a feature's public API.** Plugins, middleware, and layouts import `@/features/session` and `@/features/auth` through their `index.ts`. Shared components, composables, and utils still never import features (0002 rule 6).

## Alternatives

- **Keep the two failure paths (0003) and only fix the refresh.** The refresh would work, but every action would keep two branches and screens would keep reading raw error bodies.
- **Return a result object (`{ ok, data } | { ok, error }`).** Explicit, but every call site branches, and thrown errors (network, abort, bugs) still need converting into it.
- **ofetch hooks (`retry: 1`, `retryStatusCodes: [401]`, refresh in `onResponseError`).** ofetch 1.5 runs the hook before its retry, so this works. But the auth state machine then lives in the retry count, a caller passing `retry` breaks it, and a refused refresh has to be thrown from inside a hook.
- **A queue of waiting requests (`isRefreshing` plus subscribers).** A common pattern, but equivalent to one shared promise with more state.
- **BroadcastChannel to coordinate renewal.** It can announce a renewal, but it can't stop two tabs from starting one at the same time; Web Locks can.
- **Keep the session in shared folders (`app/composables`, `app/services`), as 0002 rule 6 suggested for app-shell needs.** That recreates the scattered shape this replaces. The session is a business area with services, a model, and state, so it's a feature, and only app wiring consumes it.
- **Typed routes (`experimental.typedPages`) instead of `toRoute`.** Not adopted here: the sidebar links to routes that don't exist yet (`/sale-request`, `/community`, `/setting`), which typed routes would reject. Links are plain paths for now.
- **Port NUK Cafe's `useApiQuery` and `useMutation`.** Still more than Admin needs (0003).

## Consequences

- Feature code has one `catch`: `toast.error(e)` or `errorMessage(e, fallback)`. No `runWithContext`, no `success` checks.
- A 401 that ends the session shows "Session expired" and sends the user to sign-in with a way back. Screens show nothing for it.
- Tests replace only the transport (`test/fake-api.ts`), so they run the real client, envelopes, models, and session.
- `async-mutex` is no longer an Admin dependency.
- The 500-with-envelope special case can go if the API answers a refused refresh with 401 ([open question](../product/open-questions.md#admin)).
- Portal and Web still follow 0003 and use their own `useAPI`. They can adopt this design in their own change, without importing Admin code.
