# Feature standard

Use this guide when you add a feature or change behavior. Find the workflow in the [product scope](product/scope.md), find the owning app in [architecture](architecture.md), and follow that app's `docs/architecture.md` for the reference code to copy. [Doc AI](features/doc-ai.md) is the worked example of a feature that spans apps.

## Evidence and decisions

| Label | Meaning | What it allows |
| --- | --- | --- |
| Observed | Seen in a running app. Record the app, role, environment, and data state. | Describing current behavior |
| Source | Supported by current code, config, or tests. Cite the file, and say when responses were mocked. | Describing current behavior |
| Approved | A requirement the product owner accepted. Record the source or date and the scope. | Building new behavior |
| Open | The business rule, API behavior, or rollout still needs confirming. | Nothing until it's resolved. Record it in [open questions](product/open-questions.md). |

An inference can explain a likely goal, but it can't authorize behavior. New role access, token charging, file retention, release rules, and integration behavior need an Approved rule or an established API contract. You can make reversible implementation choices yourself. Call out any choice that users would notice.

## Before you code

1. Write or update the spec using the template below. For a small change, a few lines in the PR description are enough.
2. Find the closest reference implementation in the owning app's `docs/architecture.md`.
3. Confirm the API contract: endpoint, method, request and response DTOs, the error shape, and whether the request is scoped to the company. If the contract doesn't exist, write the DTO you propose and record the question. Don't build an unconfirmed flow as if it were supported.

## Spec template

| Section | What to capture |
| --- | --- |
| Purpose and scope | User, goal, entry point, expected outcome, and what is explicitly out of scope |
| Roles and availability | App, company settings, module entitlements, and roles. List client visibility and confirmed API authorization separately. |
| Journey and screen states | Main steps and outcomes. For each step, the states that apply: empty, loading, validation, disabled, error, success, recovery. |
| Forms and data | Labels, types, required or optional, defaults, limits, and how the form maps to the request. Link the service and DTO. |
| Business rules and side effects | What changes state, spends tokens, publishes a result, or calls another system. Cover retries, double submission, and stale state where they apply. |
| Acceptance and verification | Specific inputs, actions, and expected results. Name the focused tests and the browser checks that need a running service. |
| Open questions | Unresolved policy, contract, and deployment details, with the evidence or decision that would settle each one |

## Definition of done

**Code**

- The code follows the owning app's layers and folders: thin route, feature screen, `use<Feature>` composable, service, DTO.
- Company scope comes from the profile. Identity (company, job, file, draft) is carried through every action and retry.
- Both API failure paths are handled, and success shows only after it's confirmed ([decision 0003](decisions/0003-request-and-error-flow.md)).
- Every screen state in the spec exists: loading, empty, error with a way to retry, disabled with a reason, success.
- New text follows the screen's localization (Portal: see its `docs/ui.md`).

**Verification**

- The app's lint passes, and its relevant tests pass. New logic that can be tested has a test.
- The normal entry point works for each affected role, and so do the error or recovery states.
- The report says what ran, what was mocked, and what needs a configured service.

**Docs (same change)**

- [Product scope](product/scope.md) or the feature reference reflects accepted behavior changes.
- The app doc that owns a changed convention or shared building block is updated, for example `building-blocks.md` for a new shared component.
- A new decision record exists when you chose between real alternatives.
- Questions that were answered are removed from [open questions](product/open-questions.md), and the answer is recorded where the rule lives.
