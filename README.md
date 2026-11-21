# Syncra

Syncra helps companies turn supply-chain documents into usable data. In Doc AI, teams can upload TechPacks or invoice and packing-list sets, confirm the estimated processing cost, and retrieve available spreadsheet results.

## Applications

| App | Directory | Who uses it | Development command | Default port |
| --- | --- | --- | --- | --- |
| Web | [`src/web`](src/web) | Visitors browsing products and pricing or contacting sales | `pnpm dev:web` | 333 |
| Portal | [`src/portal`](src/portal) | Customer teams processing documents and managing their company workspace | `pnpm dev:portal` | 444 |
| Admin | [`src/admin`](src/admin) | Syncra staff managing customer accounts, catalog content, and workbook reviews | `pnpm dev:admin` | 555 |

Each Nuxt app keeps its own constants, reference data, and scripts. See the [project scope](docs/project-scope.md) for the feature inventory and the evidence behind it.

## Local setup

Use Node.js 24 and the pnpm version pinned in [package.json](package.json). From the repository root, install the workspace dependencies.

```sh
pnpm install
```

### Environment files

Create an environment file in the directory of each app you need to run. The development commands above read `.env.dev`. Use `.env.local` with `pnpm dev:web:local`, `pnpm dev:portal:local`, or `pnpm dev:admin:local` when you want your own local configuration.

- Start with the [Portal environment example](src/portal/.env.example) for Portal. For Web and Admin, use the variable names in the [Web configuration](src/web/nuxt.config.ts) and [Admin configuration](src/admin/nuxt.config.ts).
- Use the API URL and settings for your local or test environment. Portal and Admin can use a local API proxy when configured. Keep credentials and real customer files outside the repository.

### Run an app

Run its development command from the repository root. For the customer Portal, use `pnpm dev:portal` and open [http://localhost:444](http://localhost:444).

For internal Admin, use `pnpm dev:admin` and open [http://localhost:555](http://localhost:555).

The apps connect to a separately configured API. A loaded page verifies that the frontend is running. Sign-in, extraction, and other API-backed flows need a reachable service and an appropriate test account.

## Checks

Run the checks for the app you changed. For Portal changes, start with lint and the affected test suite.

```sh
pnpm --filter @syncra/portal lint
pnpm --filter @syncra/portal test:unit --run
pnpm --filter @syncra/portal test:nuxt --run
```

See [app-specific commands and browser verification](docs/architecture.md#local-development-and-verification) for Web, Admin, and focused tests.

## Documentation

- [Agent instructions](AGENTS.md) give Codex and other agents a starting point by task. [Claude Code](CLAUDE.md) loads the same instructions.
- [Documentation index](docs/README.md) links the product scope, architecture, and feature standard.
- [Doc AI feature reference](docs/features/doc-ai.md) maps the upload, retry, result, glossary, and workbook review workflows to source and tests.
