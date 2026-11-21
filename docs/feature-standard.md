# Syncra feature standard

Use this guide when adding a feature or changing behavior. Start from [project scope](project-scope.md), find the owner in [architecture](architecture.md), and follow the closest working feature in that app. [Doc AI](features/doc-ai.md) is the first worked reference.

## Evidence and decisions

| Label | Meaning |
| --- | --- |
| Observed | Verified in a running app. Record the app, role, environment, and relevant state. |
| Source | Supported by current code, configuration, or tests. Cite the file and identify mocked responses where relevant. |
| Approved | A requirement explicitly accepted by the product owner. Include the decision source or date and scope. |
| Open | The business rule, API behavior, or rollout needs confirmation. Describe the decision and how to verify it. |

An inference can explain the likely goal. New role access, token charging, file retention, or integration behavior needs an approved rule or an established contract. Keep reversible implementation choices within the current scope and flag choices that affect user-visible behavior.

## Feature spec template

| Section | What to capture |
| --- | --- |
| Purpose and scope | User, goal, entry point, expected outcome, and explicit exclusions for the work. |
| Roles and availability | Which app, company settings, module entitlements, and roles apply. Identify client visibility and confirmed API authorization separately. |
| Journey and screen states | Main steps and outcomes. Include applicable empty, loading, validation, disabled, error, success, and recovery states. |
| Forms and data | Field labels, types, required vs optional values, defaults, limits, and request mapping. Link the API client and DTOs. |
| Business rules and side effects | Which action changes state, consumes tokens, publishes a result, or invokes another system. Cover retry, duplicate submission, and stale state where relevant. |
| Acceptance and verification | Specific inputs, actions, and expected results. Link focused tests and list browser checks that depend on a running service. |
| Open questions | Unresolved policy, contract, and deployment details. State what evidence or decision would settle each one. |

## Before marking a change complete

- Exercise the normal entry point for the affected app and role. Check the relevant error or recovery state as well as the happy path.
- Use the [app-specific verification commands](architecture.md#local-development-and-verification). Record which checks ran, which API responses were mocked, and which checks require a configured service.
- Keep the scope or feature reference current when accepted behavior changes. Record the reason for a new cross-app design decision when it would help future changes.
