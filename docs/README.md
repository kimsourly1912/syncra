# Syncra documentation

Start with the [root instructions](../AGENTS.md), then the instructions for the app you are changing. This index shows which doc owns which rule. When a rule changes, edit the doc that owns it and link to it from other docs instead of copying it.

## How to read these docs

- Read the sections your task needs. Search headings first: `grep -n '^#' docs/conventions.md`.
- Links are navigation. Don't read every linked file.
- Rules marked *pending* or *follow-up* describe intended work. They don't authorize code that depends on helpers that don't exist yet.

## Repository docs

| Doc | Owns |
| --- | --- |
| [Root instructions](../AGENTS.md) | Rules for every app, app routing, verification |
| [Workspace architecture](architecture.md) | App ownership, the external API boundary, sessions and permissions, IDs that cross apps, local ports |
| [Shared conventions](conventions.md) | TypeScript, naming, service and DTO shape, response envelope, Valibot schemas, file names |
| [Feature standard](feature-standard.md) | How to specify a feature, and the definition of done |
| [Testing standard](testing-standard.md) | The test plan every feature ships with: which layers, what each covers, the report |
| [UI standard](ui-standard.md) | UX rules for every screen: required states, feedback, widths, accessibility |
| [Decision records](decisions/README.md) | Why the architecture and docs look the way they do |
| [Product scope](product/scope.md) | Users, roles, screen map, journeys, data concepts, the glossary: current behavior with evidence labels |
| [Open questions](product/open-questions.md) | Unresolved product, permission, and contract questions |
| [Doc AI](features/doc-ai.md) | Cross-app contract for extraction, results, glossary, workbook review, ERP export |
| [README](../README.md) | Setup, environment files, run commands, git hooks, branches, commits, and pull requests |

## App docs

Every app uses the same file names, so you can find a topic in any app the same way. An app can skip a file it has nothing to say in.

| Topic | Portal | Admin | Web |
| --- | --- | --- | --- |
| App instructions | [AGENTS.md](../src/portal/AGENTS.md) | [AGENTS.md](../src/admin/AGENTS.md) | [AGENTS.md](../src/web/AGENTS.md) |
| Folders, layers, routes, reference and legacy code | [architecture](../src/portal/docs/architecture.md) | [architecture](../src/admin/docs/architecture.md) | [architecture](../src/web/docs/architecture.md) |
| API client, services, reads, writes, errors | [data-access](../src/portal/docs/data-access.md) | [data-access](../src/admin/docs/data-access.md) | [data-access](../src/web/docs/data-access.md) |
| Theme, layout, page patterns, UI states, review checklist (shared rules: [UI standard](ui-standard.md)) | [ui](../src/portal/docs/ui.md) | [ui](../src/admin/docs/ui.md) | [ui](../src/web/docs/ui.md) |
| Forms and validation | [forms](../src/portal/docs/forms.md) | [forms](../src/admin/docs/forms.md) | [forms](../src/web/docs/forms.md) |
| End-to-end CRUD recipe | [crud-recipe](../src/portal/docs/crud-recipe.md) | [crud-recipe](../src/admin/docs/crud-recipe.md) | Not needed: Web has one public write |
| Shared components, composables, utils | [building-blocks](../src/portal/docs/building-blocks.md) | [building-blocks](../src/admin/docs/building-blocks.md) | [building-blocks](../src/web/docs/building-blocks.md) |
| Tests and verification (shared rules: [testing standard](testing-standard.md)) | [testing](../src/portal/docs/testing.md) | [testing](../src/admin/docs/testing.md) | [testing](../src/web/docs/testing.md) |
| Agent tools (WebMCP) | Not used | [agent-tools](../src/admin/docs/agent-tools.md) | Not used |

## Maintaining the docs

- Root instructions stay under 6 KiB and each app's `AGENTS.md` under 4 KiB. Codex joins every instruction file from the root to its working folder, up to a 32 KiB total. `scripts/check-instruction-size.mjs` enforces the limits on commit (`lefthook.yml`).
- Each `CLAUDE.md` contains only `@AGENTS.md`.
- Code examples must match real code. When you name a reference file, check that the file still exists and still follows the rule.
- Relative links must point at a file and `#heading` that exist. The commit hook runs `scripts/check-doc-links.mjs` when a `.md` file is staged; after moving or renaming a doc, run it from the repository root:

```bash
node scripts/check-doc-links.mjs
```
