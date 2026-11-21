# Syncra repository instructions

Syncra helps companies turn supply-chain documents into usable data. The pnpm workspace contains the public website in `src/web`, the customer workspace in `src/portal`, and the internal staff console in `src/admin`. Start with the app that owns the user's workflow. A company Admin is a role in the Portal.

## Rules that apply across the workspace

- Use the [project scope](docs/project-scope.md) for the current product baseline. Treat observed behavior, frontend source evidence, and proposed requirements as different kinds of evidence. Record unresolved business or authorization questions and continue work that does not depend on the answer.
- Preserve app boundaries. Follow the owning app's existing route, service, API client, DTO, and form conventions.
- Preserve company scoping and explicit permissions in Portal requests. Take the company from the authenticated profile. Client middleware and hidden controls govern navigation and interaction. Confirm external API authorization with the owning service when a change depends on it.
- Keep extraction job IDs, display IDs, and file IDs distinct. Preserve confirmation and company/job/file identity through Invoice retries. Keep estimated cost, recorded charges, refunds, and current balance distinct. Respect workbook release and company ERP eligibility.
- Keep credentials, real customer documents, and personal data out of docs and test fixtures. Use sanitized fixtures and a suitable test company for browser checks that submit data or consume tokens.

## Where to start by task

Read the relevant sections and their linked source. Use the [documentation index](docs/README.md) for broader navigation.

| Work | Start here |
| --- | --- |
| Product behavior, scope, or a screen | [Project scope and screen map](docs/project-scope.md#feature-inventory-and-screen-map) |
| UI, forms, queries, CRUD, or other app code | [Portal coding guide](src/portal/docs/coding-standards.md), [Web coding guide](src/web/docs/coding-standards.md), or [Admin coding guide](src/admin/docs/coding-standards.md) |
| Feature directory layout and import boundaries | [Portal](src/portal/docs/coding-standards.md#feature-architecture), [Web](src/web/docs/coding-standards.md#feature-architecture), or [Admin](src/admin/docs/coding-standards.md#feature-architecture) |
| Cross-app ownership or service boundaries | [Workspace architecture](docs/architecture.md) |
| Invoice or TechPack upload, confirm, retry, or results | [Doc AI](docs/features/doc-ai.md#upload-and-processing), then the Portal wizard and its focused tests |
| Glossary, workbook verification, or ERP export | [Doc AI](docs/features/doc-ai.md#results-verification-and-exports), then the Portal or Admin files for that action |
| Team access, onboarding, or company settings | [User roles and journeys](docs/project-scope.md#users-and-roles) and [permission boundaries](docs/architecture.md#sessions-and-permissions) |
| New feature or behavior change | [Feature standard](docs/feature-standard.md) and the closest existing implementation |
| Setup, lint, tests, or browser verification | [Repository README](README.md) and the owning app's verification section |

## Verification

Use pnpm from the repository root. Select checks for each affected app. For a changed workflow, exercise its normal entry point and relevant disabled, error, and permission states. Report the commands, routes and roles checked, and whether responses were mocked or came from a running service. For docs changes, check links and commands against the checkout. Update the owning guide when a rule or contract changes.
