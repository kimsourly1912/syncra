# Admin architecture

Where Admin code goes, how routes and the sidebar work, and which files to copy. Shared rules are in [conventions](../../../docs/conventions.md). Screens and their evidence are in the [product scope](../../../docs/product/scope.md#web-and-internal-admin).

## Folder layout

```text
src/admin/app/
├── pages/                       # staff routes; thin for new work
│   ├── index.vue                # Account Management (static data)
│   ├── account/[id].vue         # Account Detail, tabs in ?tab= (static data)
│   ├── techpack-reviews/        # review queue + [fileId] detail (wired)
│   ├── lead-inquiry/ product/ plan-pricing/ hero.vue   # UI shells
│   └── auth/                    # sign-in, forgot, reset (guest)
├── features/<feature>/          # one staff workflow (decision 0002)
│   └── account/components/      # CompanyInformation, ModuleManagement, TokenManagement, SeatManagement
├── components/                  # shared, auto-registered WITH folder prefix (see below)
│   ├── base/ card/ form/ input/ layout/ list/ modal/ table/
├── composables/                 # useAPI, useAppToast, useAuth, useProfile, useStorage
├── services/                    # auth.service.ts, profile.service.ts
├── types/dto/                   # auth, profile, techpack-review, base
├── types/components/            # UI prop types (card.ts, list.ts)
├── schema/                      # Valibot (auth, base)
├── theme/                       # shared :ui objects for Nuxt UI (tab.ts, table.ts)
├── constants/                   # route.ts, key.ts (ASYNC_DATA, STATE, STATUS_CODE), regx.ts
├── utils/                       # api.ts (buildEndPoint), common.ts (tw, toRoute, IS_SERVER, IS_DEV), validate.ts
├── middleware/                  # auth, guest
├── layouts/                     # default (staff sidebar shell), auth
└── plugins/                     # api.client.ts ($api), steup.client.ts (loads the profile on start)
```

### What gets imported automatically

- **Components** use Nuxt's default naming, which **includes the folder**: `components/card/CardWrapper.vue` becomes `<CardWrapper>`. Every existing file already starts with its folder name, so keep that: `components/table/TableFilter.vue`, not `components/table/Filter.vue`.
- Composables and utils are auto-imported. Feature code, services, `theme/`, and DTOs are imported explicitly.
- **Session state** is in `useState(STATE.auth)` (from `useAuth`) and `useNuxtData(ASYNC_DATA.profile)` (from `useProfile`). There's no store library.

## Layers

These are the same layers as the rest of Syncra ([workspace architecture](../../../docs/architecture.md#request-flow-inside-an-app)):

```text
pages/<route>.vue → features/<f>/components/<F>Screen.vue → features/<f>/composables/use<F>.ts → services/<r>.service.ts → useAPI → $api
```

Today, TechPack review keeps everything in its route files. New staff workflows follow the layers above.

## Routes, guards, and the sidebar

- Route rules are generated in `app/constants/route.ts`:
  - `routePublicMap` entries get `appMiddleware: 'auth'` and the `default` layout. `multiple: true` adds `/**`, so nested and dynamic routes are covered.
  - `routePrivateMap` entries (auth pages) get `guest` and the `auth` layout.
  - **The names are inverted** compared with their meaning. Keep them, and read them as "protected" and "guest".
- `/techpack-reviews` isn't in `routePublicMap`. Its pages declare `definePageMeta({ middleware: 'auth' })` themselves. A new protected section should be added to `routePublicMap` with the right `multiple` value, and should also declare the middleware if it has dynamic children that the map doesn't cover.
- `toRoute(path, ...segments)` in `app/utils/common.ts` builds typed links from the route constants.
- The sidebar is the `menuItems` array in `app/layouts/default.vue`, grouped by `type: 'label'` headings: Customer Portal, Website Management, System. Add an entry only when its page exists.
- `steup.client.ts` loads the profile on start and sets the auth state to `AUTHENTICATED`. If that fails, the state stays `UNKNOWN` and `auth` sends the user to `/auth/sign-in`.

## Reference code

| Pattern | Reference | Why |
| --- | --- | --- |
| API-backed list | `pages/techpack-reviews/index.vue` | Status and zero-based page come from the URL query and are bounded. Stale requests are aborted with `AbortController`. Loading, empty, and error states are separate. It steps back to the last valid page when the current one is empty. |
| Stateful writes | `pages/techpack-reviews/[fileId].vue` | Separate flows for inline corrections and replacement workbooks. Each save uses the current `draftUuid` and reloads the inspection. Approval is gated on attestation. |
| Form with Valibot + pending | `pages/auth/sign-in.vue` | `UForm` + schema + `FIELD_NAME satisfies SchemaToString`, a `pending` flag, `toast.exception` |
| Service | `services/profile.service.ts` | `buildEndPoint<Parts>` + `useAPI` with a typed DTO |
| Tabs in the URL | `pages/account/[id].vue` | `UTabs` with `tabTheme`; the `?tab=` value selects the tab |
| Page layout | `pages/product/create.vue` | `LayoutContent` → `LayoutHeading` (with a `#suffix` for actions) → `CardWrapper` |

## Legacy: don't copy

| Pattern | Problem | Do instead |
| --- | --- | --- |
| Inline `useAPI` in pages, wrapped in `nuxtApp.runWithContext` (TechPack pages) | Requests mixed into the route | A service plus a feature composable ([data access](data-access.md)) |
| Hardcoded rows and totals (`pages/index.vue`, `pages/account/[id].vue`, account feature panels) | Looks real, but isn't | Wire to a confirmed endpoint, or label it static |
| Form shells without submit handlers (`product/create.vue`, `plan-pricing/create.vue`, `[id].vue` stubs) | No validation or request yet | Follow the [CRUD recipe](crud-recipe.md) once the API contract is confirmed |
| `~/` imports (for example `useProfile.ts`) | Two aliases | `@/` ([0004](../../../docs/decisions/0004-import-alias.md)) |

## Known gaps

- The sidebar links to `/sale-request`, `/community`, and `/setting`, but no pages exist for them ([open question](../../../docs/product/open-questions.md#admin)).
- Account Management, Account Detail, and the module card show static data.
- There are no tests and no test script ([testing](testing.md)).
- The plugin file name is misspelled: `steup.client.ts`.
