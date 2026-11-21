# Web building blocks

These are Web's shared components, composables, and utilities. Components are registered by file name (`pathPrefix: false`), and composables, utils, and `constants/` are auto-imported. When you add or change a shared block, update this page in the same change.

## Components

| Component | Use for |
| --- | --- |
| `LayoutDefault` (`components/admin/layout/`) | The page wrapper: `UMain` + a centered container. Props: `size` (`5xl`, `6xl`, `7xl` (default), `full`), `paddingTop`, `paddingBottom`, `glow` (default `true`). |
| `LayoutHeader`, `LayoutContent` (`components/admin/layout/`) | Shell parts. `LayoutContent` takes `size` `sm`, `md`, or `lg`. |
| `UserMenu` (`components/admin/`) | Unused, since no page or layout renders it. Don't build on it, because Web has no signed-in user. |
| `FormContactSale` | The inquiry form ([forms](forms.md)) |
| `ModalContactSale` | The inquiry modal (`v-model`) |
| `ModalSuccess` | The success dialog after a confirmed submit |
| `InputPhoneNumber` | A country code plus a number |
| `InputPassword` | A password with a show/hide toggle (not used on public pages today) |
| `SelectLanguage` | The language switcher. Only `en` is enabled. |
| `VideoPlayer` | A Plyr/HLS video player for marketing media |

## Composables

| Composable | Use for |
| --- | --- |
| `useAPI<T>(endpoint, options)` | Public API calls (no credentials, no refresh) |
| `useModule()` | `{ moduleData, pending, moduleExecute }`: the active module catalog (`activeOnly: true`). Call `moduleExecute()` to load it. |
| `useContactSale()` | Inquiry state and submit ([data access](data-access.md#the-contact-sales-write)) |
| `useURL()` | `toPortal(path)` and `toWeb(path)`, from runtime config |

## Utilities and data

| Export | File | Use for |
| --- | --- | --- |
| `buildEndPoint<Parts>(prefix, parts)` | `utils/api.ts` | Service paths |
| `tw` | `utils/common.ts` | Class strings in TypeScript |
| Route constants | `constants/route.ts` | Public paths (auto-imported) |
| `phoneCodes` | `assets/data/data.ts` | Phone code options |
| `countries.json`, `companySize.json`, `industryType.json`, `plan.json` | `assets/data/` | Static option lists and pricing content |
