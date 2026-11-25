# 0014: Admin session survives API outages, and logout renews first

- Status: Accepted
- Date: 2026-11-25
- Scope: Admin. Refines points 2 and 3 of [0008](0008-admin-api-client-and-session.md).

## Context

A session audit on 2026-11-25 reproduced these with the fake transport:

- `useSession().load()` treated every failure as signed out. If the API was offline, timed out, or answered 5xx when staff opened Admin, staff with valid cookies were sent to sign-in. The same happened in `reload()`, which runs after a profile edit and in every open tab when another tab signs in.
- Logout passed `auth: false`, as 0008 said for "calls that set or clear cookies". Once the access token expired (after the staff member was idle), logout answered 401, which wasn't renewed. The staff member stayed signed in and saw "Your session has expired". The refresh cookie stayed valid, so on a shared computer the next person opening Admin was signed in.
- Query data loaded for one staff member stayed in memory after sign-out or expiry.
- A profile response that was still in flight when another tab signed out could sign this tab back in.

## Decision

1. **Only a refusal signs out.** A profile request that fails with `unauthorized`, `forbidden`, `rejected`, `validation`, or `not_found` means there's no session. Any other failure leaves the session as it was. `load()` and `reload()` resolve to that `ApiError`, and `load()` keeps `status` `unknown` so the next call tries again.
2. **The route guard shows an error, not sign-in, when the API can't answer.** It returns a fatal 503 with `data.retry` (the page asked for). `app/error.vue` shows it with Nuxt UI's `UError`. "Try again" reloads the app at that page (`reloadNuxtApp`, through `redirectTarget`). `clearError({ redirect })` isn't enough: a navigation to the page that failed is a duplicate, so the guard wouldn't run again and the page would open with no session loaded.
3. **Logout renews like any other call.** `auth: false` is only for sign-in, password reset, and refresh. If the renewal is refused, the session was already over: `end('expired')` runs, and `signOut()` still clears this tab and tells the others.
4. **Signing out forgets data.** `signOut()` and `end()` call `clearNuxtData()` once the sign-in page is showing, so empty states don't flash first.
5. **Late profiles are ignored.** Clearing the session bumps a counter, and a profile response that started before the clear is dropped.

## Alternatives

- **Treat a failed profile as signed out, but retry it a few times first.** A longer outage still signs staff out, and retries add a hidden delay to every boot.
- **Let staff through to the page when the profile fails.** Each page would show its own errors, but the staff menu has no profile and a guest page could open for a signed-in staff member.
- **Clear the session locally when logout answers 401.** The refresh cookie would still be valid, so reloading the page would sign the staff member back in. Renewing first lets the API clear it.
- **Clear query data inside `clear()`.** Screens still mounted would flash their empty states before the redirect.

## Consequences

- An API outage when Admin opens shows "Syncra Admin is unavailable" with "Try again". A short outage no longer costs a sign-in.
- A refused refresh is still recognized by its `success: false` body, even on a 5xx ([open question](../product/open-questions.md#admin)). Until the API answers 401 there, a temporary refresh fault reported that way still ends the session.
- Whether logout revokes the refresh token on the server is unconfirmed ([open question](../product/open-questions.md#admin)).
