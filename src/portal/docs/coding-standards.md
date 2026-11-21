# Portal coding guide

Portal is the customer workspace. Use the [project scope](../../../docs/project-scope.md) for product rules and the [Doc AI reference](../../../docs/features/doc-ai.md) for extraction, review, and export behavior. The examples below describe current code. Prefer the applicable pattern for the feature you are changing.

## Feature architecture

**In use today.** Portal already groups Doc AI and glossary components under [`app/features/workspace`](../app/features/workspace) and [`app/features/glossary`](../app/features/glossary). The [upload wizard](../app/pages/workspace/create.vue) still owns much of its workflow in the route. Services, DTOs, and existing form schemas are app-level.

**Recommended for new feature work.** Place business-specific UI and coordination in `app/features/<feature>/`. Add the folders the feature actually uses. Keep existing routes and imports working when changing older code.

```text
src/portal/
├── app/
│   ├── pages/<route>.vue                       # Route metadata and feature screen composition
│   ├── features/<feature>/
│   │   ├── components/
│   │   │   ├── <Feature>Screen.vue             # Screen rendered by the route
│   │   │   └── <Feature>Form.vue               # Form owned by this feature
│   │   ├── composables/use<Feature>.ts          # Feature reads, mutations, or workflow state
│   │   ├── schemas/<feature>-form.ts           # Feature-local validation and form-to-request mapping
│   │   └── index.ts                            # Optional exports for other features
│   ├── services/<resource>.service.ts          # Endpoint, method, query, and request body
│   ├── types/dto/<resource>.dto.ts              # External API request and response types
│   ├── schema/                                 # Existing app-level form schemas
│   └── components/                             # Reusable Portal UI and shell components
└── test/
    ├── unit/                                   # Helpers, validation, and mapping
    └── nuxt/                                   # Stateful UI and workflow behavior
```

- A route composes its feature screen and owns route metadata. The screen and its feature composables handle workflow state. Keep company scope and the Portal API wrapper at the request boundary.
- A form with one owning feature can keep its validation and mapping beside that feature. Keep service request and response types in the DTO directory and reuse existing schemas where they already cover the form.
- If another feature needs a building block, expose just that component, composable, or type through `index.ts`. The owning route can import its screen directly. Keep private form and workflow details inside the feature.

## Architecture and ownership

| Code | Responsibility |
| --- | --- |
| [Pages](../app/pages), [layouts](../app/layouts), [route constants](../app/constants/route.ts) | Route, shell, title and metadata, page state, and feature composition. Some existing pages also own workflow logic. |
| [Features](../app/features) and [shared components](../app/components) | Keep workspace or glossary-specific UI and helpers with that feature. Reuse shared components for patterns already used across Portal screens. |
| [Services](../app/services), [DTOs](../app/types/dto), [schemas](../app/schema) | Services describe endpoint, verb, and request options. DTOs describe API payloads and responses. Valibot schemas validate the fields the user can edit. |
| [Profile store](../app/stores/useProfileStore.ts), [auth guard](../app/middleware/auth.ts), [permission map](../app/composables/usePermission.ts) | Session, company, role, feature flags, and client navigation. Keep API operations scoped to the authenticated company and verify service authorization separately. |

### Invoice upload and result

The [launcher](../app/pages/index.vue) loads enabled applications and the [Doc AI workspace](../app/pages/workspace/index.vue) loads processor cards. The [upload wizard](../app/pages/workspace/create.vue) validates the Invoice set, restores or stages the draft, and presents the token estimate. The [Doc AI service](../app/services/docai.service.ts) finalizes the reviewed set, polls status, and retrieves the result through the existing API client. [History](../app/pages/workspace/activity-history/index.vue) links to the [detail screen](../app/pages/workspace/activity-history/%5Bid%5D.vue) using the internal job ID. The [Invoice tests](../test/nuxt/invoice-workspace.test.ts) cover validation and recovery with mocked responses.

## UI and forms

- Use Portal's [Nuxt UI configuration](../app/app.config.ts), [Tailwind theme](../app/assets/css/tailwind.css), and [dashboard shell](../app/layouts/default.vue). Match empty, loading, and action states to the nearest existing Portal screen. Check the affected layout in light and dark mode and at the widths it supports.
- Use `UForm` and `UFormField` with the matching Valibot schema. Keep field names aligned with the form model and map the validated data to the service DTO at submission. [Account Profile](../app/pages/settings/account-profile.vue) separates profile details from the password form. [Profile schemas](../app/schema/profile.schema.ts)
- Use the existing [toast helper](../app/composables/useAppToast.ts) where the screen already uses it. Keep localization consistent with the touched screen and check both locale files when changing translated text. [Portal locales](../i18n/locales)

## Reads and query state

Use a service with [`useAPI`](../app/composables/useAPI.ts). The [API plugin](../app/plugins/api.client.ts) configures credentials, and the wrapper coordinates refresh and retry for 401 responses. Supply the company ID from the profile for company-scoped requests. Preserve request and response identity when the company, job, or record changes.

Use the existing data lifecycle for the screen. [Team Management](../app/pages/team-management.vue) loads roles, member rows, and seat counts with `useAsyncData`. The page filters its loaded table rows. The list service also accepts typed page, search, and status parameters. When changing a list, check whether the filter runs in the table or on the service before changing its behavior. [Team service](../app/services/team-management.service.ts), [team DTO](../app/types/dto/team-management.dto.ts)

For Doc AI, job polling and workbook release have their own lifecycle. Use the wizard and result views as the reference when changing those workflows.

## Writes and CRUD

| Situation | Pattern |
| --- | --- |
| Invite or edit a member | Validate the form, resolve the Operator role ID for invitations, call the company-scoped service, and refresh the affected rows and seat counts as applicable. Check which responses count as success before changing when the dialog closes. |
| Deactivate, reactivate, remove, or cancel an invite | Follow the action menu and confirmation for the member's status. Carry the existing company and member identifiers through the action. Preserve failure feedback and avoid showing success before the request completes. |
| Change profile information | Map the editable fields to the existing DTO and preserve the separate password flow. The screen refreshes profile data after its profile and avatar operations. If changing that flow, check both outcomes before showing success. |
| Finalize or retry Invoice processing | Preserve the reviewed file ID, company, and job across confirmation and recovery. Separate a submitted or uncertain job from a replacement draft. [Doc AI](../../../docs/features/doc-ai.md#upload-and-processing) |

Use the API's actual operation and semantics. Invitation cancellation, access changes, and file removal have domain-specific behavior. Include the affected record's before/after state when testing a mutation.

## Verification

From the workspace root, use `pnpm --filter @syncra/portal lint`, `pnpm --filter @syncra/portal test:unit --run`, and the affected Nuxt tests. For example, run `pnpm --filter @syncra/portal test:nuxt --run test/nuxt/invoice-workspace.test.ts` for changes to the Invoice wizard. Use `pnpm --filter @syncra/portal build` for app-wide changes. [Portal scripts](../package.json), [Vitest config](../vitest.config.ts)

For customer workflows, report the role, route, and data source used to verify the change. Check disabled, failure, and retry cases when they matter. A mocked test establishes frontend behavior for its fixtures. A configured test company is needed for end-to-end API effects.
