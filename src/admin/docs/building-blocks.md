# Admin building blocks

These are Admin's shared components, composables, and utilities. Components and composables are auto-imported. Component names include their folder: `card/CardStats.vue` becomes `<CardStats>`. When you add or change a shared block, update this page in the same change.

## Nuxt UI first

Page chrome, cards, and states come straight from Nuxt UI ([0010](../../../docs/decisions/0010-admin-nuxt-ui-dashboard-shell.md)). Don't wrap these in Admin components:

| Need | Use |
| --- | --- |
| Page shell | `UDashboardPanel` → `#header`: `UDashboardNavbar` (`title`, back button in `#leading`, actions in `#right`) + optional `UDashboardToolbar` (list filters, page tabs) → `#body` |
| Titled card | `UPageCard title variant="outline"` |
| Section heading with actions | `UPageCard title variant="naked" orientation="horizontal"`, actions in the default slot |
| Empty or placeholder state | `UEmpty` |
| Round icon | `UBadge icon square class="rounded-full p-3"` |

## Components

Only what Nuxt UI doesn't provide and two or more screens use:

| Component | Use for |
| --- | --- |
| `CardStats` | A stat grid of `items: CardStat[]` (`label`, `value`, `icon`, `color`), built on `UPageGrid` + `UPageCard`. Columns follow the item count. `#value="{ item }"` replaces the value. The `CardStat` type is exported from `CardStats.vue`. |
| `ListDetails` | A label and value list (`items: ListDetail[]`; `type` is `text` by default or `badge`). The `ListDetail` type is exported from `ListDetails.vue`. |
| `ModalConfirm` | A `UModal` confirmation. `v-model` opens it. Props: `title` (default "Are you sure?") and `description` (or the `#description` slot). Emits `confirm` and `cancel`. **It has no loading prop.** |
| `InputPassword` | A password field with a show/hide toggle |

## Composables

| Composable | Use for |
| --- | --- |
| `useApiQuery(key, fetcher, { enabled })` | Reads: `data`, `loading`, `refreshing`, `pending`, `error` (`ApiError`), `refresh` ([reads](data-access.md#reads-useapiquery)) |
| `useApiMutation(fn, { success, error, invalidate })` | Writes: `execute(input)` → `{ ok, data \| error }`, `pending`, `error` ([writes](data-access.md#writes-useapimutation)) |
| `invalidateQueries(...prefixes)` | Refresh the queries on screen whose key starts with a prefix |
| `useListQuery(choices)` | A list's filters and 1-based page in the URL ([lists](data-access.md#lists-uselistquery)) |
| `useAppToast()` | `success(description, title?)`, `failed(description, title?)`, `error(e, title?)` (skips silent errors), `base` |

## API and session

Imported explicitly, not auto-imported.

| Export | From | Use for |
| --- | --- | --- |
| `api.get/post/put/patch/delete/download` | `@/api` | Every API call, with the spec's path (`'/admin/x/{id}'`) ([calling the API](data-access.md#calling-the-api)) |
| `ApiError`, `errorMessage(e, fallback)` | `@/api` | Reading a thrown error; inline alert text |
| `defineModel`, `parseData`, `Api.*`, `v*` | `@/api` | Feature models and request types |
| `useSession()` | `@/features/session` | `status`, `staff`, `signedIn`, `load`, `reload`, `signIn`, `signOut`, `end` ([session](data-access.md#the-session)) |
| `SESSION_PATHS`, `redirectTarget(value)` | `@/features/session` | Home and sign-in paths; a safe `?redirect=` target |
| `useSignIn`, `useSignOut`, `useForgotPassword`, `useResetPassword` | `@/features/auth` | The auth forms and the Log Out button |
| `signInSchema`, `forgotPasswordSchema`, `resetPasswordSchema`, `PasswordSuggestion` | `@/features/auth` | Auth form schemas; the live password rule checklist |

## Utilities

| Export | File | Use for |
| --- | --- | --- |
| `saveFile(blob, filename)` | `utils/file.ts` | Hand a downloaded file to the browser |
