# Workspace architecture

Syncra is a pnpm workspace with three Nuxt 4 single-page apps. They share no packages: each app owns its constants, reference data, API client, services, DTOs, and components. All three call one external API. Extraction workers, storage, billing, and server authorization belong to that service and aren't in this repository.

```text
                    ┌──────────────── external Syncra API ────────────────┐
                    │  identity · companies · Doc AI · tokens · catalog   │
                    └───────▲──────────────────▲──────────────────▲───────┘
                            │ public, no cookies│ cookies + refresh │ cookies + refresh
                     ┌──────┴─────┐     ┌──────┴──────┐     ┌──────┴──────┐
                     │  src/web   │────▶│ src/portal  │     │  src/admin  │
                     │  :333      │ link│  :444       │     │  :555       │
                     └────────────┘     └─────────────┘     └─────────────┘
                       visitors          customer companies    Syncra staff
```

## App ownership

| App | Owns | Doesn't own |
| --- | --- | --- |
| [`src/web`](../src/web/AGENTS.md) | Public marketing pages, product catalog and detail, pricing, sales inquiries, links to Portal sign-in | Customer accounts; catalog editing (Admin) |
| [`src/portal`](../src/portal/AGENTS.md) | Customer sign-in and onboarding, Doc AI processing and results, POM glossary, team management, company and account settings, token activity, company activity log, Bookkeeping | Staff review and release; catalog content |
| [`src/admin`](../src/admin/AGENTS.md) | Staff sign-in, company accounts (company info, modules, tokens, seats), lead inquiries, hero, products, plans and pricing, TechPack review and release | Customer self-service |

Work on one workflow that spans apps, such as Doc AI processing in Portal and workbook review in Admin: the product contract lives in [`docs/features/`](features/doc-ai.md), and each app's docs own its implementation.

## Request flow inside an app

Every app uses the same layers ([decision 0003](decisions/0003-request-and-error-flow.md)):

```text
Route file (app/pages)           thin: definePageMeta, route params → renders the feature screen
   ↓
Feature screen component         renders state, calls actions
   ↓
Feature composable  use<Feature> owns useAsyncData reads, actions, pending flags, user feedback
   ↓
Service  <resource>.service.ts   endpoint + method + query/body → typed promise; no UI, no stores (Admin: none, 0009)
   ↓
useAPI / api (app client)        base URL, credentials, 401 → refresh → retry once (Portal and Admin)
   ↓
External API                     authentication, authorization, business rules, persistence
```

Dependencies point down only. A service never imports a component, store, or feature. Shared folders never import features ([decision 0002](decisions/0002-feature-folders-and-public-api.md)).

## Sessions and permissions

| App | Client | Session | Client-side access control |
| --- | --- | --- | --- |
| Web | `src/web/app/plugins/api.ts`, no credentials | None | None. Links to Portal use `useURL`. |
| Portal | `src/portal/app/plugins/api.client.ts`, `credentials: 'include'` | Cookies. `useAPI` refreshes once on 401 and logs out if that fails. The profile store (`useProfileStore`) holds the company, role, and feature flags. | `auth`, `guest`, and `onboarding` middleware; `usePermission` role map; `<ShowIf>`; `profileStore.isAdmin` |
| Admin | `src/admin/app/plugins/session.client.ts` configures `@/api`, `credentials: 'include'` | Cookies. `api` shares one renewal per tab (Web Locks across tabs), retries once, and calls `useSession().end('expired')` if renewal is refused ([0008](decisions/0008-admin-api-client-and-session.md)). | `access.global.ts` guard with `access` page meta; no role map |

- Client checks decide what to show and where to navigate. They aren't authorization. The API must refuse what a role can't do. If a change depends on server behavior, record what needs confirming in [open questions](product/open-questions.md).
- Portal's roles are `ADMIN` and `OPERATOR`. Invitations always create Operators. Account type (`COMPANY` or `MEMBER`) is a separate field from role. See [users and roles](product/scope.md#users-and-roles).

## IDs that cross apps

| ID | Meaning | Rule |
| --- | --- | --- |
| `companyId` | The tenant | Portal takes it from the profile store. Services reject `<= 0`. Never read it from the URL. |
| `jobId` | Internal extraction job ID | Used for API calls and detail routes (`/workspace/activity-history/[id]`) |
| `formattedId` | Display ID (`PID-0174`) | For display only. Never send it as an identifier. |
| `fileId` | One file within a job | Invoice finalization sends the reviewed `expectedFileId`. Admin review routes use `/techpack-reviews/[fileId]`. |
| `draftUuid` | Admin review draft | Saves and approval use the current draft. |

## Local development

Run `pnpm install` from the root, using the Node and pnpm versions pinned in [`package.json`](../package.json). Environment files are described in the [README](../README.md#environment-files).

| App | Dev command (`.env.dev`) | With `.env.local` | Port | Package filter |
| --- | --- | --- | --- | --- |
| Web | `pnpm dev:web` | `pnpm dev:web:local` | 333 | `@syncra/web` |
| Portal | `pnpm dev:portal` | `pnpm dev:portal:local` | 444 | `@syncra/portal` |
| Admin | `pnpm dev:admin` | `pnpm dev:admin:local` | 555 | `admin` |

Portal can proxy the API in development: set `PROXY_API_PATH` and `PROXY_API_TARGET` and the `nitro.devProxy` in its `nuxt.config.ts` handles it. Admin always proxies in development: it reads `.env`, its dev server forwards `/_api` to `NUXT_PUBLIC_API_URL`, and `pnpm dev:admin` listens on the network (`--public`) so you can open it from a phone on the same Wi-Fi ([Admin data access](../src/admin/docs/data-access.md)). Sign-in, extraction, and other API-backed flows need a reachable service and a suitable test account.

Each app's `AGENTS.md` lists its checks, and its `docs/testing.md` explains them.
