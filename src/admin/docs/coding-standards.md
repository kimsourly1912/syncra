# Admin coding guide

Admin is Syncra's internal staff console. The [screen map](../../../docs/project-scope.md#web-and-internal-admin) records local browser evidence and which screens are backed by static data. For account or review changes, identify the actual endpoint and permissions before relying on the visible controls.

## Feature architecture

**In use today.** Admin keeps account panels under [`app/features/account/components`](../app/features/account/components). The [TechPack review queue and detail](../app/pages/techpack-reviews) currently keep their request logic in the route files. Auth and profile services live at app level.

**Recommended for new feature work.** Group each staff workflow's screen, form, and state helpers under `app/features/<feature>/`. Use the route for staff middleware, parameters, and screen composition. Add folders as the feature needs them.

```text
src/admin/
└── app/
    ├── pages/<route>.vue                       # Route metadata and staff screen composition
    ├── features/<feature>/
    │   ├── components/
    │   │   ├── <Feature>Screen.vue             # Screen rendered by the route
    │   │   └── <Feature>Form.vue               # Feature-specific editing or confirmation UI
    │   ├── composables/use<Feature>.ts          # Queue reads, edits, or approval workflow
    │   ├── schemas/<feature>-form.ts           # Feature-local edit or form validation
    │   └── index.ts                            # Optional exports for other features
    ├── components/                             # Reusable staff layouts, tables, and dialogs
    ├── services/<resource>.service.ts          # Admin API calls through the app client
    ├── types/dto/<resource>.dto.ts              # External API request and response types
    └── schema/                                 # Existing app-level form schemas, including auth
```

- Keep account-specific panels in the account feature. Use shared staff components for UI already used by multiple screens. When another feature needs a building block, expose it through `index.ts` and keep private editing and review logic inside its feature.
- Reuse the Admin API wrapper for data access. Feature state should carry the record and draft identifiers the operation requires. Preserve staff route guards and verify permissions with the service when wiring a static screen.

## Architecture and ownership

| Code | Responsibility |
| --- | --- |
| [Pages](../app/pages), [staff layout](../app/layouts/default.vue), [route configuration](../app/constants/route.ts) | Staff routes, sidebar entries, and shell. Review pages also declare auth middleware in their page metadata. |
| [Account components](../app/features/account/components), [shared components](../app/components) | Company Information, Module, Token, and Seat panels and reusable staff screen building blocks. |
| [Admin API plugin](../app/plugins/api.client.ts), [`useAPI`](../app/composables/useAPI.ts), [services](../app/services), [DTOs](../app/types/dto) | The Admin client sends credentials and handles refresh for the configured expiry condition. Auth and profile use services. TechPack review pages call the wrapper directly with typed contracts. |

Check whether the page is wired to a service. [Account Management](../app/pages/index.vue) uses hardcoded rows and totals, and [Account Detail](../app/pages/account/%5Bid%5D.vue) maps the active tab to `?tab=`. Use these pages as UI examples. TechPack review is a better reference for request behavior.

## UI and forms

- Use Admin's [Nuxt UI configuration](../app/app.config.ts), [Tailwind theme](../app/assets/css/tailwind.css), and [layout components](../app/components/layout). Keep staff screens consistent with the surrounding shell, table, dialog, and tab patterns. Verify focus and disabled states for record actions.
- [Admin sign-in](../app/pages/auth/sign-in.vue) shows the app's `UForm`, `UFormField`, Valibot, and pending-state pattern. It uses the [auth schema](../app/schema/auth.schema.ts) and [toast helper](../app/composables/useAppToast.ts). Confirm real staff authentication and permissions in a configured environment.

## Reads and query state

Use the [TechPack review queue](../app/pages/techpack-reviews/index.vue) as the reference for an API-backed list. It derives review status and zero-based page from route query values, bounds the page value, aborts stale requests, and exposes distinct loading, empty, and error states. It returns to a valid page when an out-of-range page has no items. Use the existing Admin API wrapper and [review DTO](../app/types/dto/techpack-review.dto.ts).

Confirm the service-side authorization for any new staff action. Admin's visible controls and route middleware describe frontend behavior.

## Writes and CRUD

The [TechPack review detail](../app/pages/techpack-reviews/%5BfileId%5D.vue) is the working source example for stateful writes. Preserve separate flows for inline corrections and replacement workbooks. Saves use the current draft UUID and refresh the inspection afterward. Approval checks the current work and reviewer attestation before requesting release, then returns to the Reviewed queue on success. [Doc AI results and verification](../../../docs/features/doc-ai.md#results-verification-and-exports)

For account, catalog, or pricing work, check each form's submit handler and owning API before using it as a CRUD example. When wiring a static screen, document the proposed endpoint, required permissions, validation, and post-save refresh in its feature spec before treating the flow as supported.

## Verification

From the workspace root, use `pnpm --filter admin exec eslint .` and `pnpm --filter admin build`. Admin has no dedicated test script in this checkout. [Admin manifest](../package.json)

For read-only account screens, check Account Management → Manage → Account Detail and tab navigation. Those routes worked with static data in the local browser check. For review or permissions changes, verify the relevant request states with a test API and check staff access, workbook readiness, errors, and release separately.
