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
| `useAPI<T>`, `useRawAPI<T>` | API calls ([data access](data-access.md#the-client-stack)) |
| `useAppToast()` | `success(description)`, `failed(description)`, `exception(e)`, `base` |
| `useAuth()` | `authState`, `isAuthenticated`, `onSuccess(fn)`, `logoutProps()` → `{ pending, execute }`, `setAuthState` |
| `useProfile()` | `key`, `data`, `pending`, `refresh()`, `clear()` for the signed-in staff profile |
| `useStorage()` | `preference` (sidebar collapsed) in `localStorage` |

## Theme objects

| Export | File | Use on |
| --- | --- | --- |
| `tableTheme` | `theme/table.ts` | Every `UTable` (`:ui="tableTheme"`) |
| `tabTheme` | `theme/tab.ts` | Page-level `UTabs` (`:ui="tabTheme"`) |

## Utilities and constants

| Export | File | Use for |
| --- | --- | --- |
| `buildEndPoint<Parts>(prefix, parts)` | `utils/api.ts` | Service paths |
| `toRoute(path, ...segments)` | `utils/common.ts` | Typed links from `constants/route.ts` |
| `tw`, `IS_DEV`, `IS_SERVER` | `utils/common.ts` | Class strings in TypeScript; environment checks |
| `validatePassword*`, `getPasswordValidationMessages` | `utils/validate.ts` | Password rules |
| `routePublicMap`, `routePrivateMap`, `routeRules` | `constants/route.ts` | Protected routes (the "public" map) and guest routes (the "private" map); the generated rules |
| `ASYNC_DATA`, `STATE`, `STATUS_CODE` | `constants/key.ts` | Data keys, state keys, `expiry: 401`, `tooManyRequest: 429` |
