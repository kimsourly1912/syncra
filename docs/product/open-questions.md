# Open questions

These are unresolved product, permission, and contract questions. An open question doesn't authorize behavior. Build only what doesn't depend on the answer, and don't code a guess. When a question is answered, record the answer in the doc that owns the rule (scope, feature reference, or app docs) and delete it here.

Known code defects aren't questions. They're listed under **Known gaps** in each app's `docs/architecture.md`.

## Product and entitlements

| Question | Blocks | Evidence that would settle it |
| --- | --- | --- |
| Which processors are sold and enabled today? Where should Purchase Order appear? It's in the history filter and the wizard accepts `PURCHASE_ORDER`, but there's no launch card. | New processor UI, history filters | A production or staging entitlement matrix and a tenant with Purchase Order enabled |
| Is Bookkeeping shipped, a pilot, or unfinished? Who may see statements and payroll? Its pages exist, but the main navigation doesn't link them. | Bookkeeping changes and navigation | A product decision, access rules, and a non-production company with populated periods |
| Why did the glossary card show Active while its page said unavailable? | Glossary availability logic | A glossary-enabled company, with the company flag and API response side by side |
| Which sign-in options and onboarding paths are enabled in each environment? Should Settings have a timezone control? | Auth and settings UI | Environment settings, plus guest and signed-in checks with test accounts |

## Permissions

| Question | Blocks | Evidence that would settle it |
| --- | --- | --- |
| What can an Operator actually do? Token history, job detail and files, glossary preview links, role changes, and audit export are all unclear. The client role map (`src/portal/app/composables/usePermission.ts`) lists only exact top-level routes for Operators. | Any Operator-facing change; fixing the Operator route check | A test session for each role, and server authorization docs |
| Should Operators open detail routes under sections they may use, such as `/workspace/activity-history/[id]` and `/workspace/glossary/uploads/[id]`? | Fixing the Portal route guard | A product decision, confirmed against API behavior |
| Who may view the glossary, manage it, and open preview links? | Glossary role controls | A glossary-enabled Admin and Operator session |
| What are Admin staff roles and permissions? Admin has no role map. | Any permission-aware Admin screen | Admin API auth contract and staff test accounts |

## Doc AI contracts

| Question | Blocks | Evidence that would settle it |
| --- | --- | --- |
| Which TechPack file types does the server accept, and what are its limits per job? The dropzone advertises PDF, another chooser lists JPEG and PNG, and the client checks a 50 MiB batch. | Changing upload validation | The current API contract and sanitized boundary-case fixtures |
| Which Invoice layouts and attachments does the server accept, and what does it validate? | Changing Invoice validation | The API contract and sanitized fixtures, including valid layouts |
| Which workbooks need internal verification? When are outputs released, charged, refunded, kept, or deleted? Who may approve a release? | Changes to results, retention, or billing display | Representative jobs in every state, plus backend policy |
| Which companies have ERP export? What counts as a confirmed export, and when is a retry safe? | Changes to ERP export | The ERP integration contract and a non-production company with ERP enabled |
| How do glossary layers take precedence, and what is the translation fallback? There are company-brand, company-wide, and global layers. | Glossary display or editing logic | The owning team's documented rules |

## Admin

| Question | Blocks | Evidence that would settle it |
| --- | --- | --- |
| Which account actions are wired to the service? The account list and module card use static data. | Wiring Account Management | The Admin API contracts and a staff test environment |
| Should a refused session refresh return 401? `POST admin/auth/refresh` without a valid refresh cookie answers HTTP 500 with `success: false` (`refreshToken blank`), so the client treats any `success: false` body as refused ([0008](../decisions/0008-admin-api-client-and-session.md)). Does the API rotate refresh tokens? | Dropping that special case; tuning the cross-tab renewal lock | The API owner's refresh contract |
| Are Sale Request (`/sale-request`), Community Management (`/community`), and Setting (`/setting`) planned? The sidebar links to them, but no pages exist. | Adding or removing those entries | A product decision |
| What are the endpoints, validation, and permissions for products, plans and pricing, hero content, and lead inquiries? Those pages are UI shells with no submit wiring. | Building Admin CRUD for them | The Admin API contracts |
| Which response fields are always present and non-null? The OpenAPI spec declares `required` on 24 of 330 schemas, marks no field nullable, documents no error responses, and leaves the date-time format unverified. Admin guards this with feature models ([0007](../decisions/0007-generated-api-contract.md)). | Tightening generated types; enforcing formats | A spec with `required`/`nullable` set, or confirmed sample responses from the API owner |
| What is the real shape of TechPack inspection findings? The spec has a single `Finding` schema (with `aiValue`) for both PDF and AI findings, probably because springdoc collapsed two classes with that name. Admin reads `pdfValue` on PDF findings, based on the working review screen (`features/techpack-review/models/workbook-inspection.ts`). Inner classes named `Result` and `Sheet` suggest the same naming issue. | Trusting the generated inspection types | Distinct schema names in the spec (for example `PdfFinding`/`AiFinding`), or a confirmed sample response |

## Platform

| Question | Blocks | Evidence that would settle it |
| --- | --- | --- |
| Where are the API source, the authoritative API contracts, the deployment environments, and the owners for Doc AI, billing, and identity? | Confirming any server rule | Links to the owning repositories or API specs, and an environment inventory |
