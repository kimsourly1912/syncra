# Web coding guide

Web is Syncra's public marketing app. It presents products and company information and collects sales inquiries. Use the [screen map](../../../docs/project-scope.md#web-and-internal-admin) for confirmed routes. The examples below describe current code and point to checks for the affected flow.

## Feature architecture

**In use today.** Web organizes code by role. The [public routes](../app/pages), [module service](../app/services/module.service.ts), and [sales inquiry flow](../app/composables/useContactSale.ts) live in app-level directories. Web currently has no `app/features/` directory.

**Recommended for new feature work.** Keep simple public pages in `app/pages/`. When a workflow has several related components or stateful steps, group its private implementation in `app/features/<feature>/`. Catalog discovery and a multi-step inquiry are examples of workflows that could use this layout.

```text
src/web/
├── app/
│   ├── pages/
│   │   └── <route>.vue                         # Public route, page metadata, and composition
│   ├── features/<feature>/                     # For a grouped workflow when needed
│   │   ├── components/<Feature>Screen.vue       # UI specific to the workflow
│   │   ├── composables/use<Feature>.ts          # Feature reads or submission state
│   │   ├── schemas/<feature>-form.ts           # Feature-local form validation and mapping
│   │   └── index.ts                            # Optional exports for other features
│   ├── components/                             # Site navigation and reusable Web components
│   ├── services/<resource>.service.ts          # Public API calls
│   ├── types/dto/<resource>.dto.ts              # Public API request and response types
│   └── schema/                                 # Existing app-level form schemas
└── test/
    └── unit/                                   # Pure logic and mapping tests
```

- Keep site metadata and navigation with the route or shell. Put workflow state and one-feature UI in the feature once they warrant their own files.
- Keep reusable forms, such as Contact Sales used across several pages, at app level while they serve that role. If feature code needs to be shared with another feature, export the reusable building block through `index.ts`.
- Preserve Web's public API client and Portal links when moving code. Use actual public service methods and DTOs when adding a read or inquiry.

## Architecture and ownership

| Code | Responsibility |
| --- | --- |
| [Pages](../app/pages), [site layout](../app/layouts/default.vue) | Public routes, navigation, page content, and metadata. The public site owns the landing, catalog, and inquiry experience. |
| [Public API plugin](../app/plugins/api.ts), [API wrapper](../app/composables/useAPI.ts), [services](../app/services) | API base URL comes from Web's Nuxt config. Services define the public endpoints and use Web's typed API wrapper. |
| [DTOs](../app/types/dto), [schemas](../app/schema), [form components](../app/components/form) | API request and response shapes, validation, and form UI. |
| [URL helper](../app/composables/useURL.ts) | Configured links between Web and Portal. Preserve the destination for sign-in and other cross-app links. |

## UI and forms

- Use Web's [Nuxt UI configuration](../app/app.config.ts), [Tailwind theme](../app/assets/css/tailwind.css), and [site layout](../app/layouts/default.vue). Keep landing content and product content readable across the screen widths it supports. Web disables Nuxt UI color mode in its [Nuxt config](../nuxt.config.ts).
- Keep page metadata with the page. [About](../app/pages/about.vue) is a simple static-page example. Web currently configures English. Use the existing locale mechanism for translated content and verify the enabled locales in [Nuxt config](../nuxt.config.ts). [Web locale files](../i18n/locales)
- Reuse the [sales inquiry form](../app/components/form/FormContactSale.vue) and its [Valibot schema](../app/schema/contact-sale.schema.ts) for inquiry entry. The form emits a validated submit event and receives pending state from its caller.

## Reads and query state

The [catalog](../app/pages/products/index.vue) uses [`useModule`](../app/composables/useModule.ts) to load public module data. [Product detail](../app/pages/products/%5Bslug%5D.vue) reads the slug, calls the [module service](../app/services/module.service.ts), and uses the content to set the page title. Preserve the distinction between a pending load, available content, and the fallback screen. When changing route-driven reads, verify a second product navigation as well as a direct visit.

Keep endpoint construction and response DTOs in Web's service and type directories. Public Web requests follow Web's client behavior. Links to Portal are navigation across apps.

## Writes and CRUD

The main public write documented here is **Contact Sales**. [`useContactSale`](../app/composables/useContactSale.ts) maps the form into the [request DTO](../app/types/dto/contact-sale.dto.ts), combines the phone country code with the local number, and calls the [sales service](../app/services/contact-sale.service.ts). Keep the existing endpoint spelling unless the owning API contract changes.

**Known source gap.** The submit wrapper currently calls its success handler after `execute()` resolves, while `execute()` can catch or report an API failure and then resolve. Use this flow as a reference for form and payload mapping. A changed submission flow needs separate checks for success and rejection before its success dialog is treated as delivery evidence.

Product and content management belong to internal Admin. Web consumes the published catalog and submits inquiries through the public API.

## Verification

From the workspace root, use `pnpm --filter @syncra/web lint` and `pnpm --filter @syncra/web build` for Web changes. The unit command is `pnpm --filter @syncra/web test:unit --run`. Its current sample test failed on both pnpm versions in the compatibility check. [Web scripts](../package.json), [sample test](../test/unit/sum.test.ts)

For routing or content changes, verify the page from normal navigation, relevant links or calls to action, and the affected viewport widths. Home → About worked in the local browser check. Verify API-backed catalog and sales submission with a test service when the change touches those flows.
