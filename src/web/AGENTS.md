# Web agent instructions

Web (`src/web`, package `@syncra/web`, port 333) is Syncra's public marketing site. It has the home and about pages, the product catalog and product detail, pricing, learn more, download, news, community, legal pages, and the Contact Sales inquiry. Stack: Nuxt 4 SPA, Nuxt UI 4 (no color mode), Tailwind 4, Valibot, `@nuxtjs/i18n` (only `en` enabled), and Vitest. The [root rules](../../AGENTS.md) and [shared conventions](../../docs/conventions.md) apply here too.

## Web rules

- **Public only.** Web has no session. Its `$api` client sends no credentials. Never add customer or staff data, tokens, or authenticated endpoints. Customer actions link to Portal through `useURL().toPortal(path)`.
- **Catalog content comes from the API.** Product modules and marketing content are published from Admin and read through `services/module.service.ts`. The `moduleItems` array in `composables/useModule.ts` is mock data marked TODO, so don't extend it.
- **Requests.** Feature code calls service functions, and services call `useAPI`. Handle both failure paths, and show the success dialog only after a confirmed success ([data access](docs/data-access.md)). `useContactSale().submit()` currently gets this wrong; see Known gaps in [architecture](docs/architecture.md#known-gaps).
- **Reads tied to a route** use a key that includes the param, and re-run when it changes. `products/[slug].vue` uses a fixed key, which is legacy.
- **Page metadata.** Set the title with `useHead` in the page.
- **Structure.** Simple public pages stay in `app/pages/`. A multi-step or stateful workflow goes in `app/features/<feature>/` ([architecture](docs/architecture.md)).
- **Endpoint spellings.** Keep existing ones, such as `anonymouse` in the contact-sales path, unless the API contract changes.

## Read for the task

| Task | Read |
| --- | --- |
| Where code goes, routes, navigation, what to copy | [architecture](docs/architecture.md) |
| Catalog reads, contact sales, errors | [data-access](docs/data-access.md) |
| Layout, sections, responsive rules | [ui](docs/ui.md), [building-blocks](docs/building-blocks.md) |
| Inquiry forms | [forms](docs/forms.md) |
| Tests and verification | [testing](docs/testing.md) |

## Verify

Run from the repository root:

```bash
pnpm --filter @syncra/web lint
```

```bash
pnpm --filter @syncra/web build
```

```bash
pnpm --filter @syncra/web test:unit --run
```

The only unit test, `test/unit/sum.test.ts`, is a placeholder that fails (it expects `1 + 1` to be `4`). Report it as known, don't count it as a regression, and don't "fix" it as part of unrelated work. For pages, check normal navigation, direct visits, a second product navigation, and phone and desktop widths.
