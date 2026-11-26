# Syncra agent instructions

Syncra helps companies turn supply-chain documents into usable data. This pnpm workspace holds three independent Nuxt 4 single-page apps. They have no shared packages and they call one external API. The API's source, database, and server authorization aren't in this repository.

| App | Folder | Who uses it | Instructions |
| --- | --- | --- | --- |
| Web | `src/web` | Public visitors: products, pricing, contact sales | [src/web/AGENTS.md](src/web/AGENTS.md) |
| Portal | `src/portal` | Customer companies: Doc AI processing, results, team, settings, tokens | [src/portal/AGENTS.md](src/portal/AGENTS.md) |
| Admin | `src/admin` | Syncra staff: accounts, catalog content, TechPack review | [src/admin/AGENTS.md](src/admin/AGENTS.md) |

**Before editing under `src/<app>/`, read `src/<app>/AGENTS.md`.** It lists that app's rules and which docs to read for each task. A company "Admin" is a role inside Portal. It is not the Admin app.

## Rules for every app

- **Evidence.** Treat observed behavior, source evidence, and proposed requirements as different things. Unresolved business, permission, billing, or retention rules are owner decisions. Add them to [open questions](docs/product/open-questions.md), carry on with work that doesn't depend on them, and never code a guess.
- **App boundaries.** Don't import code from another app. Each app owns its API client, API types (services and DTOs, or Admin's generated contract), schemas, and components. Cross-app links go through configured URLs.
- **Security.** Take the company, user, and role from the authenticated profile, never from route params, query strings, or form input. Hidden buttons and route middleware are navigation, not authorization. The API enforces access. If a change depends on server authorization, confirm it with the API owner.
- **Identity and money.** Keep extraction job ID, display ID (`formattedId`), and file ID distinct. On Invoice retries, keep the confirmed file and the same company, job, and file. Keep estimated cost, recorded charges, refunds, and current balance distinct. Respect workbook release and per-company ERP eligibility. Details: [Doc AI](docs/features/doc-ai.md).
- **Code shape.** Follow [shared conventions](docs/conventions.md) and the [decision records](docs/decisions/README.md):
  - feature folders with a public `index.ts`
  - service → feature composable → component, with both API failure paths handled (Admin has no services: the composable calls the generated `api` with a feature model)
  - `@/` imports only
- **Copy only reference code.** Each app's `docs/architecture.md` lists the files to copy and the legacy files not to copy. If none fits, follow the docs. Don't invent helpers that don't exist.
- **Libraries.** Use Nuxt, Nuxt UI, VueUse, and Valibot before custom code or new dependencies. Check their APIs against the installed version, not from memory.
- **Data safety.** Keep credentials, real customer documents, and personal data out of code, docs, and fixtures. Use sanitized fixtures. Run browser checks that submit data or spend tokens only against a test company.
- **Scope.** Don't refactor unrelated code. Fix legacy patterns in the code you are already changing.

## Where to start

| Work | Read first |
| --- | --- |
| Code in one app | That app's `AGENTS.md`, then the docs its routing table names |
| Product behavior, roles, screens, what a term means | [Product scope](docs/product/scope.md), and its [glossary](docs/product/scope.md#glossary) |
| Doc AI upload, confirm, retry, results, glossary, review, ERP | [Doc AI](docs/features/doc-ai.md), then the app files it links |
| Work across apps, the API boundary, sessions | [Workspace architecture](docs/architecture.md) |
| New feature or behavior change | [Feature standard](docs/feature-standard.md), then the [testing](docs/testing-standard.md) and [UI](docs/ui-standard.md) standards |
| Changing an established pattern | [Decision records](docs/decisions/README.md) |
| Setup and commands | [README](README.md) |
| Docs only | [Documentation index](docs/README.md) |

Read the sections the task needs. Links are navigation, not a request to read every linked file.

## Verification and completion

- Use pnpm from the repository root, and run the checks for each app you changed. The commands are in each app's `AGENTS.md`. There's no CI: git hooks (`lefthook.yml`) lint staged files on commit and run tests on push, only for the app touched. Never skip them (`--no-verify`) to get a change through. After a change to `pnpm-lock.yaml`, run every app's tests: the lockfile is shared and no hook covers it.
- Name branches, commits, and pull requests as the [README](README.md#branches-commits-and-pull-requests) says.
- For a changed workflow, exercise its normal entry point and its relevant disabled, error, and permission states.
- Report the commands you ran, the routes and roles you checked, whether responses were mocked or came from a running service, and any check you couldn't run.
- When a rule, convention, or contract changes, update the doc that owns it in the same change. [`docs/README.md`](docs/README.md) shows which doc owns which rule.
- When a decision with real alternatives changes, add a decision record.
- Keep instruction files short: under 6 KiB at the root and under 4 KiB per app.
