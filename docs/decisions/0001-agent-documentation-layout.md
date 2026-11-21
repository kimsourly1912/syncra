# 0001: Root instructions plus one instruction file per app

- Status: Accepted
- Date: 2026-11-21
- Scope: Repository documentation, all apps

## Context

Syncra is one pnpm workspace with three independent Nuxt apps: `src/web`, `src/portal`, and `src/admin`. Each app has its own config, API client, components, and checks. Agents need the rules for the app they edit, without loading the other two apps' rules.

The agents find instruction files in different ways. The documentation for each tool, as read on 2026-11-21, says:

- **Claude Code** loads `CLAUDE.md` from the working folder and every folder above it at startup. It loads a `CLAUDE.md` in a subfolder only when it reads or edits a file in that subfolder. It reads `AGENTS.md` itself only when no `CLAUDE.md` exists, so a `CLAUDE.md` must import it with `@AGENTS.md`. Imports resolve relative to the importing file and can nest up to four levels. Source: [Claude Code memory](https://code.claude.com/docs/en/memory).
- **Codex** walks from the repository root down to the working folder and joins every `AGENTS.md` on that path. Files closer to the working folder come later and win on conflicts. It does not load files below the working folder. The combined size limit defaults to 32 KiB (`project_doc_max_bytes`). Source: the [Codex AGENTS.md guide](https://developers.openai.com/codex/guides/agents-md).
- **ChatGPT and other chat tools** load nothing by themselves. They read the files a person gives them or the links those files contain.

The NUK Cafe reference repository uses one root file and no nested instruction files. That suits one app. It does not suit three apps with different stacks and rules.

## Decision

1. The root `AGENTS.md` holds what Syncra is, the rules for every app, which app owns which work, and verification. It stays under 6 KiB.
2. Each app has `src/<app>/AGENTS.md` with that app's rules and a task-to-doc routing table. Each stays under 4 KiB.
3. Each `CLAUDE.md`, at the root and in each app, contains only `@AGENTS.md`. There is one source of truth per folder.
4. The root file tells every agent: "Before editing under `src/<app>/`, read `src/<app>/AGENTS.md`." This covers Codex started at the root, which never loads nested files by itself.
5. Detailed standards live in `docs/` next to the instructions that route to them. Agents read them by section, for the task at hand. Links are navigation, not a request to read every linked file.
6. Each app uses the same doc file names: `architecture.md`, `data-access.md`, `ui.md`, `forms.md`, `crud-recipe.md`, `building-blocks.md`, and `testing.md`. An app can skip a file it has no content for.
7. We don't use `.claude/rules/`, skills, or `AGENTS.override.md` for project rules. They would duplicate `AGENTS.md` and work in only one tool.

## Alternatives

- **One root file only.** Codex would get every app's rules on every task. The root file would grow past a useful size and mix three stacks.
- **Root docs only, no app files.** Agents would have to work out which app a rule belongs to, and per-app differences would get lost.
- **`.claude/rules/` with path globs.** This works only in Claude Code and creates a second copy of each rule.

## Consequences

- An agent started anywhere gets the root rules. Claude Code gets the app rules when it touches app files. Codex gets them when it starts in the app folder, or when it follows the routing rule.
- Instruction files must stay small. If a rule needs a long explanation, put the explanation in `docs/` and keep a one-line rule in `AGENTS.md`.
- When a convention changes, update the doc that owns it in the same change. [`docs/README.md`](../README.md) shows which doc owns which rule.
