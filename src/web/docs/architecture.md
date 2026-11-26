# Web architecture

Where Web code goes, how pages and navigation work, and which files to copy. Shared rules are in [conventions](../../../docs/conventions.md). Routes and their evidence are in the [product scope](../../../docs/product/scope.md#web-and-internal-admin).

## Folder layout

```text
src/web/
├── app/
│   ├── pages/                   # public routes: index, about, products/{index,[slug]}, pricing,
│   │                            #   learn-more, download, news-center, community/{index,[slug]},
│   │                            #   privacy-policy, terms-of-use
│   ├── features/<feature>/      # only for multi-step or stateful workflows (none yet)
│   ├── components/              # shared, auto-registered by file name (pathPrefix: false)
│   │   ├── admin/layout/        # LayoutDefault, LayoutHeader, LayoutContent (site shell, despite the folder name)
│   │   ├── app/ base/ form/ modal/
│   ├── composables/             # useAPI, useModule, useContactSale, useURL
│   ├── services/                # module.service.ts, contact-sale.service.ts
│   ├── types/dto/               # module, contact-sale, base
│   ├── schema/                  # contact-sale.schema.ts, base.schema.ts
│   ├── constants/               # route.ts, regx.ts (auto-imported: imports.dirs ['constants'])
│   ├── assets/data/             # countries, company sizes, industries, plan.json, phone codes (data.ts)
│   ├── layouts/default.vue      # header navigation, footer, Portal links
│   ├── plugins/                 # api.ts ($api, no credentials), directive.client.ts
│   └── utils/                   # api.ts (buildEndPoint), common.ts (tw)
├── config/icon.ts               # @nuxt/icon options and custom collections
├── i18n/locales/                # en-US.json enabled; zh-CN.json present but disabled in nuxt.config.ts
└── vitest.config.ts             # unit (test/unit) and nuxt (test/nuxt) projects; no tests yet
```

### What gets imported automatically

- **Components** are registered by file name without the folder (`pathPrefix: false`), so file names must be unique.
- **Composables**, **utils**, and **`constants/`** are auto-imported (`imports.dirs: ['constants']`).
- **Services, DTOs, schemas, and feature code** are imported explicitly, with `@/`.

## Layers

```text
pages/<route>.vue → (features/<f>/ when a workflow needs it) → composables/use<Thing>.ts → services/<r>.service.ts → useAPI → $api
```

- A static content page holds its content and `useHead` in the page. `about.vue` is the reference.
- An API-backed page calls a composable or service from the page. Move it into a feature folder when it grows several components or steps.
- Reusable inquiry UI (the Contact Sales form and modal) stays in shared `components/` because several pages open it.

## Navigation and cross-app links

- Header and footer items live in `layouts/default.vue` (`headerItems`, `footerItems`). Mark a header item active with `route.path.startsWith(...)`.
- Links to Portal (sign in, get started) use `useURL().toPortal('/auth/sign-in')`, which reads `NUXT_PUBLIC_PORTAL_URL`. Links within Web use `NuxtLink` with a path.
- The runtime config is `apiURL`, `webURL`, `portalURL`, and `awsS3Url`, from `NUXT_PUBLIC_*` variables.

## Reference code

| Pattern | Reference | Why |
| --- | --- | --- |
| Static page with metadata | `pages/about.vue` | Content plus `useHead` |
| Read with both failure paths | `useModule()` in `composables/useModule.ts` | Checks `success` and catches a thrown error, with a toast for each. `pages/products/index.vue` consumes it, but doesn't render loading or empty states yet, so add them when you edit it. |
| Detail read by slug | `pages/products/[slug].vue` | `useAsyncData` + `useHead` from the loaded content. **Except** for its fixed key; see Known gaps. |
| Public service | `services/module.service.ts` | `PREFIX.public` + `buildEndPoint<Parts>` + typed DTO |
| Inquiry form | `components/form/FormContactSale.vue` + `schema/contact-sale.schema.ts` | `defineModel('data')`, a Valibot schema, a validated `submit` event, `pending` passed in by the caller |
| Form → request mapping | `useContactSale().execute()` | Joins the phone code and number, and maps fields to `ContactSaleReq` |

## Known gaps

- **Contact Sales reports success after a failure.** `submit()` in `composables/useContactSale.ts` calls `onSuccess()` after `execute()` even when `execute()` caught an error or got `success: false`. The success dialog therefore isn't proof of delivery.
- **The product detail key is fixed.** `pages/products/[slug].vue` uses the key `'marketing-content'` and doesn't watch `slug`. Going from one product to another can show the previous product's content.
- **Mock catalog data.** `moduleItems` in `composables/useModule.ts` is a hardcoded list with staging asset URLs, marked TODO.
- **No tests.** Vitest is configured, but there are no test files, so the test commands exit 1 ([testing](testing.md)).
- **The `components/admin/` folder** holds the public site shell. The name is misleading, but keep it until a dedicated rename.
