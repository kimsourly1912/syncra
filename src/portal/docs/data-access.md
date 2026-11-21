# Portal data access

How Portal talks to the API: the client, services, reads, writes, errors, stale responses, and session state. The service and DTO file shapes are in [shared conventions](../../../docs/conventions.md#service-files). The reasoning is in [decision 0003](../../../docs/decisions/0003-request-and-error-flow.md).

## The client stack

```text
service function ──▶ useAPI<T>(endpoint, options) ──▶ $api (plugins/api.client.ts) ──▶ API
                         │ 401?
                         ├─▶ refresh once (mutex shared by all callers) ──▶ retry the request
                         └─▶ still 401 ──▶ profileStore.onLogout() ──▶ throw
```

| Piece | File | Use it for |
| --- | --- | --- |
| `$api` | `app/plugins/api.client.ts` | `$fetch.create({ baseURL: apiURL, credentials: 'include' })`. `apiURL` is `PROXY_API_PATH` or `NUXT_PUBLIC_API_URL`. Feature code never calls it directly. |
| `useAPI<T>` | `app/composables/useAPI.ts` | Every authenticated request. It's a plain async function that returns `Promise<T>`, not a reactive composable. It refreshes the session once on a 401 and retries. |
| `useRawAPI<T>` | same file | Requests that must not trigger a refresh. The auth flows use it. |
| `useFileAPI(endpoint)` | same file | Blob downloads. Returns `{ file, fileName, extension, size, unit, … }` from the response headers. |
| `downloadBlob(blob, filename)` | `app/utils/common.ts` | Saves a blob in the browser |

## Reads

Use `useAsyncData` inside the feature composable or the screen. Unwrap the envelope inside the handler, so `data` holds the payload.

```ts
// features/<feature>/composables/use<Feature>.ts
const profileStore = useProfileStore()
const query = reactive<GlossaryDTO.GlossaryEntriesQuery>({ page: 0, size: 20 })

const entries = useAsyncData(
  () => `glossary-entries-${profileStore.companyId}`,   // identity in the key
  async () => {
    const { data } = await glossaryService.getEntries({ companyId: profileStore.companyId }, query)
    return data
  },
  { lazy: true, watch: [() => query.page, () => query.size, () => profileStore.companyId] },
)
```

- **Key.** Put the key in `ASYNC_DATA` (`app/constants/key.ts`) or in a feature-local `ASYNC_KEY` object, like `useActivity` does. If the data depends on a company or record, **include that identity in the key**. A static key such as `'activity-history-detail'` shares one cache entry across records. That's legacy; don't copy it.
- **Watch** every input that changes the request. Debounce free-text search with `watchDebounced` from `@vueuse/core` and call `execute()`, as `pages/workspace/activity-history/index.vue` does.
- **`lazy: true`** is the default practice here. The page renders right away and shows its loading state.
- **States.** Render `pending`, `error`, empty, and data separately. Many existing pages ignore `error`. New screens must show an error with a retry action ([ui → states](ui.md#required-states)).
- **Pages are zero-based.** Send `page: 0` for the first page. The UI shows `page + 1`.
- **Plain arrays.** Some list endpoints return an array instead of a page (`TeamMemberRes = BaseRes<TeamMemberData[]>`). Check the DTO. Don't add client paging to an API that pages on the server, or the reverse, without checking which one the screen uses today.

## Writes

Write each action in the feature composable. It reports success only after confirming it, and returns whether it succeeded, so the caller decides whether to close a dialog or refresh. The service and DTO names below are real (`team-management.service.ts`). `members` stands for the feature's `useAsyncData` result, and `toInvitationReq` for the form's mapping function ([forms](forms.md#map-the-form-to-the-request)).

```ts
const { toast } = useAppToast()
const pending = reactive({ invite: false })

async function inviteMember(req: TeamManagementDTO.TeamInvitationReq) {
  pending.invite = true
  try {
    const { success, reason } = await teamManagementService.createTeamInvitation({ companyId: profileStore.companyId }, req)
    if (!success) {                                   // failure path 1: resolved with success: false
      toast.add('error', { title: 'Could not send the invitation', description: reason })
      return false
    }
    toast.add('success', { title: 'Invitation sent', description: req.email })
    await members.refresh()                           // refresh what the write changed
    return true
  }
  catch (e) {                                         // failure path 2: thrown FetchError
    toast.addException(e)
    return false
  }
  finally {
    pending.invite = false
  }
}
```

```ts
// Caller (component)
async function onSubmit(event: FormSubmitEvent<IInviteMemberSchema>) {
  if (await inviteMember(toInvitationReq(event.data)))
    open.invite = false
}
```

Rules:

- **No false success.** If a helper catches its own error, it must return the outcome. Never wrap self-catching helpers in `Promise.all` and then show success. That's the bug in `pages/settings/account-profile.vue`.
- **Pending state.** Keep one flag per action in a `pending` object. Disable the trigger while it's true. Keep the dialog open, with its input, until the request finishes.
- **Refresh what changed.** After a write, refresh the affected reads, such as rows and summary counts. If a write spends tokens, call `profileStore.refreshBalance()`.
- **Stay in scope.** A destructive action (deactivate, remove, cancel invite, delete files) asks first with `<ModalConfirmation>`, and carries the same company and record IDs through to the request.
- **Double submit.** A disabled button isn't enough when a request can be retried. Doc AI finalization sends `expectedFileId`, so the server can refuse a replaced draft. Keep that kind of identity on every retry.

## Errors

`useAppToast()` returns `{ toast }`:

| Call | Shows |
| --- | --- |
| `toast.add('success' \| 'error' \| 'warning' \| 'info', { title, description })` | A toast with the matching color and icon |
| `toast.addException(e)` | The `data.title`, then `data.detail` or `data.reason`, from a thrown `FetchError` |
| `toast.addServerError()` | A generic "Internal Server Error" |

- Write titles that name the action: "Could not send the invitation", not "Failed".
- Feature-specific error codes come back in `msg`. For example, the glossary helper `glossaryErrorCode` reads `GLOSSARY_PREVIEW_STALE`. Parse codes in the feature's `utils/`, and test them.
- Never put tokens, passwords, or document contents in a toast or in `console`.

## Stale responses and identity

A response is stale when its company, job, or record changed while it was in flight.

- `useAsyncData` cancels its older call when it re-runs (`dedupe: 'cancel'` is the default), so watched reads are safe for one key.
- Manual actions and polling need a guard. Copy the revision counter in `useProfileStore().refreshBalance`:

  ```ts
  let revision = 0
  watch(() => profileStore.companyId, () => { revision++ }, { flush: 'sync' })

  async function refreshThing() {
    const requested = ++revision
    const { data } = await thingService.getThing({ companyId: profileStore.companyId })
    if (requested === revision) thing.value = data
  }
  ```

- The Doc AI wizard keeps job, reviewed set, and company together across confirmation and retry. Read the [Doc AI contract](../../../docs/features/doc-ai.md#upload-and-processing) before changing it.

## Session state

- `useProfileStore()` holds the profile and the derived values: `companyId`, `userRole`, `isAdmin`, `isMember`, `onboarded`, `canExportToErp`, and `tokenBalance`. It also has `execute()` (load), `refreshBalance()`, and `onLogout()`.
- On logout, `clear()` resets the balance and calls `clearNuxtState(Object.values(STATE))`. If you add `useState` that's tied to a company or user, add its key to `STATE` in `app/constants/key.ts`, so logout clears it.
- Don't copy company or user data into `localStorage`. The only cookie is `username`, defined in `COOKIE`.

## Polling

- To poll the token balance, use `useBalancePolling(intervalMs)`. It starts on mount and stops on unmount.
- Job status polling lives in the wizard (`pages/workspace/create.vue`). Stop polling on terminal statuses (`COMPLETED`, `PARTIAL_COMPLETED`, `FAILED`, `REJECTED`) and on unmount. A `verificationPending` file keeps waiting even after its job completes.
