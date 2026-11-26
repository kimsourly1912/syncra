# Testing standard

Which tests and checks every feature ships with, in every app. Each app's `docs/testing.md` explains *how*: commands, mocking, and reference tests ([Admin](../src/admin/docs/testing.md), [Portal](../src/portal/docs/testing.md), [Web](../src/web/docs/testing.md)). The UI states the tests cover are defined in the [UI standard](ui-standard.md).

## The test plan

Every feature or behavior change has a test plan: one line per layer below, naming the tests you add or saying "not needed" with a reason. Write it in the spec's *Acceptance and verification* section ([feature standard](feature-standard.md#spec-template)), or in the PR description for a small change. The reviewer checks the change against it.

## Layers

| Layer | Required when the change… | Must cover |
| --- | --- | --- |
| **Unit** (Node) | adds pure logic: a helper, a status rule, a model transform, or a form → request mapping that does more than copy fields | Each branch, and edge input: empty, zero, missing or `null` fields |
| **Component** (Nuxt) | adds or changes a screen, a composable, or a store | Each [required state](ui-standard.md#required-states) the screen has. Both failure paths of every action: a resolved `success: false` and a thrown error. Success shown only after it's confirmed. The requests sent (method, path, body), with identity (company, job, file, draft) carried through. A late response dropped when its record changed. Each guard, with a test that fails when the guard is removed. |
| **E2E smoke** | adds or changes a journey across pages (sign-in to a deep link, list to detail, a multi-step flow) | The main path on the built app, with every request answered by the test. One smoke step per journey, not every state: the component tests cover states. |
| **Agent tools** | adds or changes a WebMCP tool (Admin only, [agent tools](../src/admin/docs/agent-tools.md)) | The URL state set, the request sent, the answer, a refused input, and a failed load |
| **Browser check** | changes anything on a screen | The normal entry point for each affected role, the states in the spec, the [widths](ui-standard.md#layout-and-widths), and light and dark where the app has both. Done by an agent driving a real browser (browser automation such as Playwright or a browser extension) or by a person, against a test API. |

## What each app can run today

| Layer | Admin | Portal | Web |
| --- | --- | --- | --- |
| Unit | `app/**/tests/*.test.ts` | `test/unit/` | `test/unit/` (no tests yet) |
| Component | `app/**/tests/*.nuxt.test.ts`, API mocked with `fakeApi` | `test/nuxt/`, `useAPI` or services mocked. The suite doesn't load right now ([known test debt](../src/portal/docs/testing.md#known-test-debt)). | `test/nuxt/` (no tests yet) |
| E2E smoke | `test/e2e/` (`test:e2e`) | Configured, but don't add tests until a running-service setup exists | Not set up |
| Agent tools | `installModelContext` in a component test | Not used | Not used |
| Browser check | Yes | Yes | Yes |

When the plan needs a layer the app can't run yet, say so in the plan and cover that behavior in the browser check. Setting up new test infrastructure is its own change, not part of a feature.

## Rules for every test

- **Never reach a real API.** Mock at the boundary the app's testing doc names: the HTTP transport in Admin, `useAPI` or the service in Portal and Web.
- **Assert what the user sees and what was sent**, not internal refs or call order inside the feature.
- **A new test fails without the change.** Check it once: undo the line or remove the guard, and see it fail.
- **Fixtures are sanitized and small.** Made-up IDs, names, and emails (`buyer@example.com`), shaped like the API response. Build files in memory. Never real customer documents, names, credentials, or tokens.
- **One feature per test file.** Extend the file that already covers a workflow instead of starting a parallel one.
- **Known failures** are reported as known, with the command output. They aren't a regression from your change, and fixing them is its own change.
- **Browser checks that submit data or spend tokens** run only against a test company or test staff account. Never approve or release real customer work. Without a test API, check what renders without one and report the rest as not run ([open question](product/open-questions.md#platform)).
- **After a change to `pnpm-lock.yaml`,** run every app's tests, not only the app you changed: the lockfile is shared and no hook covers it ([README](../README.md#git-hooks)).

## Report

End the handoff with the plan and what actually ran ([root rules](../AGENTS.md#verification-and-completion)):

```text
Test plan
- Unit: <test files> | not needed: <reason>
- Component: <test files> | not needed: <reason>
- E2E smoke: <test files> | not needed: <reason> | app can't run it yet
- Agent tools: <test files> | not needed: <reason>
- Browser: <routes>, <roles>, <widths>, <light/dark>; API live | mocked | static

Ran: <command> → <result>
Not run: <check> → <why>
```
