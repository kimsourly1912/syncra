# Syncra architecture

Syncra is a pnpm workspace with three Nuxt single-page applications. There are no shared workspace packages; each app owns its constants and reference data. Each app reads its API configuration from its own Nuxt config. The checkout shows frontend contracts and client behavior. Extraction workers, the database, and authorization inside the API belong to the external service.

## Application ownership

| Area | Responsibility | Entry points |
| --- | --- | --- |
| `src/web` | Public marketing website, product catalog and pricing, and sales inquiries | [Web coding guide](../src/web/docs/coding-standards.md), [Nuxt config](../src/web/nuxt.config.ts) |
| `src/portal` | Customer workspace, processing and results, team and company administration, token activity, and Bookkeeping | [Portal coding guide](../src/portal/docs/coding-standards.md), [Nuxt config](../src/portal/nuxt.config.ts) |
| `src/admin` | Internal staff screens for company configuration, seats and tokens, leads, plans, products, and TechPack review | [Admin coding guide](../src/admin/docs/coding-standards.md), [Nuxt config](../src/admin/nuxt.config.ts) |

For the folder trees and placement rules, see feature architecture for [Portal](../src/portal/docs/coding-standards.md#feature-architecture), [Web](../src/web/docs/coding-standards.md#feature-architecture), and [Admin](../src/admin/docs/coding-standards.md#feature-architecture). Each app owns its UI, forms, query state, writes, and implementation examples in its coding guide. Use the [screen map](project-scope.md#feature-inventory-and-screen-map) for browser evidence and source links.

## How to trace a change

Find the workflow in the [project scope](project-scope.md#feature-inventory-and-screen-map), then start in the owning app's coding guide. Trace the page, its client and DTO, and the relevant test. When a workflow spans apps, keep its product contract in the root feature reference and use the local guides for implementation. [Doc AI](features/doc-ai.md) links customer processing in Portal and workbook review in Admin.

## Sessions and permissions

Web has a public API client and links to Portal for customer sign-in. Portal and Admin use separate credentialed clients. Portal derives company context and the Admin or Operator role from its profile. Internal Admin has its own staff auth and route guards. Each app guide links the actual client and route code.

Keep company ID, internal job ID, display ID, and file ID distinct where a workflow spans Portal and Admin. Check the owning service for API authorization, entitlements, and release rules.

## Local development and verification

Run `pnpm install` from the root with the version pinned in [package.json](../package.json). See the [README](../README.md#environment-files) for environment filenames. Portal includes a [sample environment file](../src/portal/.env.example) with variable names for the external API, optional local proxy, images, and auth UI flags.

| App | Run with `.env.dev` | Default port |
| --- | --- | --- |
| Web | `pnpm dev:web` | 333 |
| Portal | `pnpm dev:portal` | 444 |
| Admin | `pnpm dev:admin` | 555 |

Use the matching `dev:<app>:local` root shortcut with `.env.local`.

Use the [Web](../src/web/docs/coding-standards.md#verification), [Portal](../src/portal/docs/coding-standards.md#verification), and [Admin](../src/admin/docs/coding-standards.md#verification) guides for app checks.

On Windows with Node.js 24.22.1 and pnpm 12.21.0, a clean frozen install, all three builds, and all 81 Portal tests passed. The app lint and Vue type-check findings matched the pnpm 10 baseline. The Web sample test failed on both versions. Treat this as a compatibility snapshot. Rerun the affected checks on the current checkout.
