# Admin building blocks

These are Admin's shared components, composables, and utilities. Components and composables are auto-imported. Component names include their folder: `card/CardWrapper.vue` becomes `<CardWrapper>`. When you add or change a shared block, update this page in the same change.

## Components

| Component | Use for |
| --- | --- |
| `LayoutContent` | The page container (`max-w-7xl`, vertical spacing) |
| `LayoutHeading` | The page `title` and `description`. With `to`, it shows a back arrow. `#suffix` holds page actions. |
| `CardWrapper` | A `UCard` with a `CardTitle` header (`title`) |
| `CardTitle` | A card heading |
| `CardBoxWrapper` + `CardBoxItem` | A stat grid (`cols`) of `items: CardBoxItem[]`. The types are in `types/components/card.ts`. |
| `ListWrapper` + `ListItem` | A label and value list (`items: ListItem[]`, with types `text` or `badge`). The types are in `types/components/list.ts`. |
| `TableFilter` | The filter row above a table |
| `ModalConfirm` | A confirmation dialog. `v-model` opens it. Props: `title` (default "Are you sure?") and `description` (or the `#description` slot). Emits `confirm` and `cancel`. **It has no loading prop.** |
| `BaseIconBadge` | A round colored icon (`icon`, `size`, `color`) |
| `BaseLink` | `ULink` with Admin styles (takes `LinkProps`) |
| `InputPassword` | A password field with a show/hide toggle |
| `FormPasswordSuggestion` | A live password rule checklist |

## Composables

| Composable | Use for |
| --- | --- |
| `useAppToast()` | `success(description)`, `failed(description)`, `error(e)` (skips silent errors), `base` |
| `useStorage()` | `preference` (sidebar collapsed) in `localStorage` |

## API and session

Imported explicitly, not auto-imported.

| Export | From | Use for |
| --- | --- | --- |
| `api.get/post/put/patch/delete/download` | `@/api` | Every API call ([data access](data-access.md#the-client)) |
| `ApiError`, `errorMessage(e, fallback)` | `@/api` | Reading a thrown error; inline alert text |
| `defineModel`, `parseData`, `Api.*`, `v*` | `@/api` | Feature models and request types |
| `useSession()` | `@/features/session` | `status`, `staff`, `signedIn`, `load`, `reload`, `signIn`, `signOut`, `end` ([session](data-access.md#the-session)) |
| `SESSION_PATHS`, `redirectTarget(value)` | `@/features/session` | Home and sign-in paths; a safe `?redirect=` target |
| `useSignIn`, `useSignOut`, `useForgotPassword`, `useResetPassword` | `@/features/auth` | The auth forms and the Log Out button |

## Theme objects

| Export | File | Use on |
| --- | --- | --- |
| `tableTheme` | `theme/table.ts` | Every `UTable` (`:ui="tableTheme"`) |
| `tabTheme` | `theme/tab.ts` | Page-level `UTabs` (`:ui="tabTheme"`) |

## Utilities and constants

| Export | File | Use for |
| --- | --- | --- |
| `buildEndPoint<Parts>(prefix, parts)` | `utils/api.ts` | Service paths |
| `tw`, `IS_DEV` | `utils/common.ts` | Class strings in TypeScript; dev check |
| `validatePassword*`, `getPasswordValidationMessages` | `utils/validate.ts` | Password rules |
