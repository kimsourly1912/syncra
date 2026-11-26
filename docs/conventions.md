# Shared conventions

These rules are the same in Web, Portal, and Admin. Each app's docs cover only how that app differs ([decision 0005](decisions/0005-shared-conventions-location.md)). Existing code doesn't always follow them. New and edited code does.

## Stack

| Concern | Choice | Notes |
| --- | --- | --- |
| Framework | Nuxt 4, `ssr: false` (single-page apps) | Code runs in the browser. Middleware returns early on the server: `import.meta.server` (Portal) or `IS_SERVER` (Admin). |
| UI | Nuxt UI 4 + Tailwind CSS 4 | Theme tokens live in each app's `app/assets/css/tailwind.css` and `app/app.config.ts`. |
| Validation | Valibot | Form schemas everywhere. API responses: typed, not validated, in Portal and Web; parsed into feature models from the generated schemas in Admin ([0007](decisions/0007-generated-api-contract.md)). |
| HTTP | `$fetch.create` in an app plugin, used through `useAPI` (Portal, Web) or `api` from `@/api` (Admin) | Never call `$fetch` or `useFetch` directly in feature code. |
| Lint | `@nuxt/eslint` with `stylistic: true` | Two-space indent, single quotes, no semicolons. Run the app's `lint:fix` (Portal and Web), or `pnpm --filter admin exec eslint . --fix` for Admin. |
| Package manager | pnpm, version pinned in the root `package.json` | Node `^24` |

## TypeScript

- Avoid `any`. If a library type forces it, add `// eslint-disable-next-line @typescript-eslint/no-explicit-any` with a reason.
- Prefer inference. Annotate exported function parameters, API types (DTOs, or Admin's models), and component props.
- Use `satisfies` to check an object literal without widening its type: `FIELD_NAME = { … } satisfies SchemaToString<IForm>`. `SchemaToString` is defined in Portal `types/common.ts`; Admin writes it inline as `satisfies { [K in keyof IForm]: K }`. Web has only the weaker `ObjectValueToString`.
- Use `as const` objects for fixed sets: endpoint parts, `ASYNC_DATA` keys, route maps, status maps. Derive types from them, for example `ExtractObjectValue<typeof ROUTE_PRIVATE>`.
- Put type-only imports in their own statement:

  ```ts
  import { glossaryScopeQuery } from '@/features/glossary'
  import type { GlossaryDTO } from '@/types/dto'
  ```

- Use `@/` for app imports, and relative paths only inside one feature ([decision 0004](decisions/0004-import-alias.md)).

## Functions and state

- Use function declarations for any function longer than a few lines. Use arrow functions for callbacks, short transforms, and event handlers.
- Pass an options object when a function needs more than two or three inputs. Destructure it in the body, not in the parameter list:

  ```ts
  // src/portal/app/services/team-management.service.ts
  export function getTeamMembers(param: TeamManagementDTO.TeamMemberParam, query: TeamManagementDTO.TeamMemberQuery = {}) {
    const { companyId } = param
    const { page = 0, size = 10 } = query
    // …
  }
  ```

- In composables, declare the functions first and then return them in an object. Don't define long functions inline in the returned object.
- Use `shallowRef` for single values, `reactive` for grouped UI state (`open`, `pending`, `selected`), and `computed` for anything derived. Keep request results in `useAsyncData` `data` or in the owning store, not copied into loose refs.
- Group the visibility and pending state of each dialog and action, the way `src/portal/app/pages/team-management.vue` does:

  ```ts
  const open = reactive({ invite: false, confirmation: false })
  const pending = reactive({ invite: false, remove: false })
  ```

## File and symbol names

| Kind | File name | Symbol |
| --- | --- | --- |
| Page | `app/pages/<route>.vue`, kebab-case, `[param]` for dynamic segments | — |
| Component | `PascalCase.vue`. In Portal and Web, the name must be unique across the app because the folder isn't part of the name (`pathPrefix: false`). In Admin, the name must start with its folder name, as in `card/CardStats.vue`. | `<FeatureThing>` |
| Composable | `useCamelCase.ts` | `export function useThing()` |
| Store (Portal) | `app/stores/use<Name>Store.ts` | `defineStore(STORE_ID.<name>, () => { … })` |
| Service | `app/services/<resource>.service.ts`, kebab-case | One exported function per endpoint |
| DTO (Portal, Web) | `app/types/dto/<resource>.dto.ts`, kebab-case | Re-exported as a namespace: `export * as GlossaryDTO from './glossary.dto'` |
| Model (Admin) | `app/features/<feature>/models/<name>.ts`, kebab-case | `<name>Model = defineModel(v<Schema>, …)` and `type <Name> = v.InferOutput<typeof <name>Model>` ([0007](decisions/0007-generated-api-contract.md)) |
| Form schema | `app/features/<feature>/schemas/<name>-form.ts` (new), or `app/schema/<resource>.schema.ts` (existing; Portal and Web) | `<name>Schema` and `type I<Name>Schema = v.InferOutput<typeof <name>Schema>` |
| Feature folder | `app/features/<kebab-name>/` | Public API in `index.ts` |
| Test (Portal, Web) | `test/unit/<subject>.test.ts` or `test/nuxt/<subject>.test.ts` | `describe('<behavior>')` |
| Test (Admin) | `<folder>/tests/<subject>.test.ts` (Node) or `<subject>.nuxt.test.ts` (Nuxt), beside the code ([0016](decisions/0016-admin-tests-beside-the-code.md)) | `describe('<behavior>')` |

**Existing misspellings:** `setingCompany.dto.ts`, `SatisticCard.vue`, `settingcompanyRepresentative.vue`, `company-infomation`, `privatecy`. Keep these names when you only edit nearby code, because renaming touches every importer. Never copy the spelling into new names. A rename belongs in its own change.

## API response envelope

All three apps call one API. Portal and Web define its shapes in `types/dto/base.dto.ts`. Admin generates them from the OpenAPI spec into `app/api/` and doesn't use DTO files ([decision 0007](decisions/0007-generated-api-contract.md), [Admin data access](../src/admin/docs/data-access.md#the-api-contract)).

```ts
interface BaseRes<T> { data: T, msg: string, reason: string, success: boolean }
interface BaseError { title: string, detail: string, status: number, type: string, instance: string } // thrown error body
```

- **A request can fail in two ways.** It can resolve with `success: false` and a `reason`, or it can throw a `FetchError` whose body has `title`/`detail` or `reason`/`msg`. Handle both. Each app's `docs/data-access.md` has the pattern ([decision 0003](decisions/0003-request-and-error-flow.md)).
- **Paged lists are zero-based.** Spring-style responses use `content`, `totalElements`, `totalPages`, and `number` (`BaseQueryRes` in Portal), or `PageRes<T>` (`content`, `totalElements`, `totalPages`, `pageNumber`, `pageSize`). The UI may show page `n + 1`, but the request always sends the zero-based `page`.
- Some lists come back as plain arrays, for example `TeamMemberRes = BaseRes<TeamMemberData[]>`. Check the DTO before assuming a page shape.

## DTO files

Portal and Web only. Admin uses generated types and feature models instead ([0007](decisions/0007-generated-api-contract.md)).

Group types in this order, each under a comment heading. `src/portal/app/types/dto/team-management.dto.ts` is the reference. The example below uses a made-up `supplier` resource to show the shape:

```ts
import type { BaseRes, PageRes } from './base.dto'

// Param: path identifiers
export interface SupplierParam { companyId: number, supplierId: number }
export type SupplierListParam = Pick<SupplierParam, 'companyId'>

// Query: query-string filters
export interface SupplierListQuery { page?: number, size?: number, search?: string }

// Data: the `data` payload of a response
export interface SupplierData { id: number, name: string, email: string }

// Request: request bodies
export interface SupplierCreateReq { name: string, email: string }

// Response: the envelope
export type SupplierRes = BaseRes<SupplierData>
export type SupplierListRes = BaseRes<PageRes<SupplierData>>
```

- Suffixes: `Param`, `Query`, `Data`, `Req`, `Res`. Use string-literal unions for API enums: `type TeamMemberStatus = 'ACTIVE' | 'DEACTIVATED' | …`.
- A DTO describes the API, not a form. Map form values to a `Req` in a separate function.
- Re-export each DTO file from `types/dto/index.ts` as a namespace, and import it with `import type { GlossaryDTO } from '@/types/dto'`.

## Service files

Portal and Web. Admin has no service files: its composables call a client typed from the spec ([decision 0009](decisions/0009-admin-typed-endpoints-and-query-toolkit.md)).

`src/portal/app/services/glossary.service.ts` is the reference.

```ts
import type { GlossaryDTO } from '@/types/dto'

const ENDPOINT = {
  prefix: '/companies',
  parts: { docai: 'docai', glossary: 'glossary', uploads: 'uploads' },
} as const

type Parts = typeof ENDPOINT.parts

function glossaryEndpoint(companyId: number, parts: Array<string | number> = []) {
  if (companyId <= 0) throw new Error('Glossary: companyId is required')
  return buildEndPoint<Parts>(ENDPOINT.prefix, [companyId, 'docai', 'glossary', ...parts])
}

export function getUpload(param: GlossaryDTO.GlossaryUploadParam) {
  return useAPI<GlossaryDTO.GlossaryPreviewRes>(glossaryEndpoint(param.companyId, ['uploads', param.uploadId]), { method: 'GET' })
}
```

- A service does transport only: endpoint, method, query, body, and the response type. It doesn't catch errors, show toasts, read stores, or navigate.
- The caller passes `companyId` (and other identity) in a `Param` object. A company-scoped service rejects `companyId <= 0` before sending anything.
- Build paths with `buildEndPoint<Parts>(prefix, parts)` from `app/utils/api.ts`, which is auto-imported. Don't use Portal's curried `buildEndpoint`; nothing uses it.
- Verbs for new functions: `get<Thing>` (one), `list<Things>` (many), `create<Thing>`, `update<Thing>`, `delete<Thing>`, plus domain verbs such as `finalizeJob`, `applyUpload`, or `approveReview`. Keep existing names such as `findTeamSummary` when editing.
- Uploads build a `FormData` inside the service, as `uploadGlossary` does.
- Downloads: in Portal, `useFileAPI(endpoint)` returns `{ file, fileName, extension, … }` (`ExtractFileHeaderReturn` in `app/utils/file.ts`). Some services wrap it and return their own shape; check the service's return type.

## Forms

- Write a Valibot schema for the fields the user edits. In Portal and Web, reuse `baseSchema` from `app/schema/base.schema.ts` for required strings, emails, phones, files, and passwords. Admin has no `baseSchema`: each field starts from the generated request schema ([Admin forms](../src/admin/docs/forms.md)).
- Derive the form type with `v.InferOutput`. Name the field constants with `satisfies SchemaToString<IForm>` (Admin: the inline mapped type), so a renamed field breaks the build.
- **Validate on submit.** Every `UForm` sets `:validate-on="[]"`, so errors appear only when the user submits, not on blur, input, or change. An error stays until the next submit. Don't add `@blur` handlers that call `validate()` ([decision 0013](decisions/0013-validate-forms-on-submit.md)).
- Map form values to a `Req` in a pure function next to the schema. Unit-test it when it does more than copy fields.
- Each app's `docs/forms.md` has the component pattern.

## Comments and TODOs

- Comments explain *why*, not *what*.
- A TODO names the condition that removes it ("remove when the API returns a page shape"), not just "fix later".
- Delete commented-out code instead of committing it.
