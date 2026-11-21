# Product scope

This is the current-behavior product reference for Syncra: the customer Portal, the public Web app, and the internal Admin console. It records what the apps do today and what that is based on. It doesn't set coding rules; those live in each app's docs ([decision 0006](../decisions/0006-product-evidence-and-standards.md)).

See the [documentation index](../README.md) for engineering guides, and [Doc AI](../features/doc-ai.md) for detailed processing behavior.

## Evidence labels

| Label | Meaning |
| --- | --- |
| **Observed** | Seen in a running app. The observations here come from a signed-in local Portal session as a company Admin, and from a read-only local check of all three apps with a simulated API (both 2026-11). Those sessions had empty history, logs, token ledger, and Bookkeeping data, and stopped before uploads, submissions, or processing. |
| **Source** | Supported by the code, config, or tests in this repository. Re-check the file before relying on it. |
| **Inferred** | A product interpretation that the owner hasn't confirmed |
| **Open** | Unresolved. Listed in [open questions](open-questions.md). |

## Project overview and goals

**Observed.** Syncra presents a company workspace for supply-chain applications. Doc AI was the enabled application. Its workspace exposes TechPack and Invoice extraction and a POM Glossary entry. The surrounding portal manages the team, company profile, account details, token usage, and company activity. Other supply-chain applications are presented in a sales catalog.

**Inferred goals.**

- Reduce manual transcription of apparel technical specifications and supplier document sets into structured spreadsheets.
- Make document processing trackable by showing the input set, estimated time, required tokens, processing status, and available outputs.
- Let a company manage team access, monitor usage, and maintain its own information in the portal.
- Keep measurement terminology consistent for downstream users where the English–Simplified Chinese glossary is enabled.

The observed portal scope includes the launcher and sales inquiry, Doc AI preparation and tracking, team management, company and account settings, token usage and requests, activity log, and the directly reachable Bookkeeping landing page. Source also describes guest authentication, onboarding, processing results, eligible glossary management, and adjacent web and internal Admin applications.

Out of scope for this verified baseline are live operation of the advertised modules, production rollout and entitlements across companies, backend extraction and accounting algorithms, storage schema, and external integration delivery guarantees. The scope records current evidence and leaves roadmap decisions to the product owner.

## Users and roles

| User or role | Evidence | Access and responsibilities |
| --- | --- | --- |
| Guest, prospective customer, invited user | Source | Sign in, register, verify a code, recover a password, or accept an invitation. The separate public website also has product discovery and sales inquiry. |
| Company Admin (`ADMIN`) | Observed and Source | Uses the portal and enabled modules, sees Team Management and Activity, edits company and representative details, and can manage the glossary when the company and API allow it. |
| Operator (`OPERATOR`) | Source | Uses the application launcher, Doc AI entry points and history, account profile, settings, and read-only company information according to the frontend role map. Team Management, Activity Log, and application advertisements are excluded from the operator permission map. Validate actual route and action access with an operator session before relying on it. |
| Internal Syncra staff and TechPack reviewers | Observed interface and Source | The separate `src/admin` app provides account screens and surfaces for leads, products, plans and pricing, hero content, and TechPack review. The browser check exercised accounts with static data. Staff authentication and permissions remain open. |

The profile distinguishes company and member account types (`COMPANY`, `MEMBER`) from permission roles. Job titles and the company representative's role/position are display and profile fields. Invitation examples in the UI include QA/QC, Merchandiser, and Product Developer. The portal sends invitations with the Operator role. [Portal role map](../../src/portal/app/composables/usePermission.ts), [profile contract](../../src/portal/app/types/dto/profile.dto.ts), [team page](../../src/portal/app/pages/team-management.vue)

## Feature inventory and screen map

Paths in the first table refer to the customer portal. Dynamic segments in square brackets represent route parameters.

| Screen and route | Evidence | Current behavior |
| --- | --- | --- |
| Application `/` | Observed and Source | Shows entitled applications and links Doc AI to its workspace. The observed catalog offered Contact Sales and Learn More for Score Card, P&L Analytics, QC, Carbon Offset, Alert, Production Status, Production Planning, and Automate Help Desk. The portal derives enabled and catalog items from module and access responses. |
| Module details `/learn-more/[id]` | Observed and Source | Product information. The Score Card detail opened at `/learn-more/8`. Its marketing claims describe the offering. |
| Doc AI Workspace `/workspace` | Observed and Source | Processor cards and recent extraction jobs, with a link to Activity History. The session showed TechPack, POM Glossary, and Invoice cards. Processor availability comes from the API. |
| Extraction wizard `/workspace/create?type=TECHPACK` and `?type=INVOICE` | Observed and Source | Upload → Process → Completed. TechPack showed a staged PDF, estimated time, cost, and a confirmation dialog. Invoice offered two input modes and kept Process disabled until the required set was selected. Processing and result actions were reviewed in source. |
| POM Glossary `/workspace/glossary` | Observed and Source | The workspace card was marked Active, but its destination reported the glossary unavailable due to company configuration or access. Source shows entries, upload history, template download, and an Admin upload action when available. |
| Glossary upload preview `/workspace/glossary/uploads/[id]` | Source | Review changes, warnings, and blocking issues for a particular upload, then apply or discard when permitted. |
| Extraction Activity History `/workspace/activity-history` | Observed and Source | Shows Total Processing, Completed, and Rejected summary cards. Offers text search, status and module filters, generated-date sort, and a table with Processing ID, Brand / Style, Module, Status, and Generated. Browser data was empty. |
| Extraction job detail `/workspace/activity-history/[id]` | Source | Shows a job summary, progress or outcome, file-level output and source-file controls, and retention information where applicable. The list passes the internal job ID. |
| Team Management `/team-management` | Observed and Source | Member counts and seats, Active/Deactivated/Pending Invites summaries, search and status filters, invitation form, and status-specific actions. The browser showed an active Admin and deactivated Operator. |
| Company Activity Log `/activity-log` | Observed and Source | Audit view with user, application, and start/end date filters and Export Log. The browser showed Doc AI in the application filter and an empty result. Source uses a CSV filename fallback. |
| Settings `/settings` | Observed and Source | Links to Account Profile and Company Information. Provides English / Simplified Chinese and theme controls. Timezone appears in the Settings description. A timezone editor was not observed. |
| Account Profile `/settings/account-profile` | Observed and Source | Avatar, first and last name, and job title controls. Login email and role are read-only. A separate form accepts current, new, and confirmation passwords. |
| Company Information `/settings/company-information` | Observed and Source | Representative contact and position fields plus company identity, email, industry, size, country/region, contact phone, and address. Admin saw save controls for both sections. |
| Token balance and activity `/token` | Observed and Source | Header balance opens a popover with a link to token activity. The page shows balance, usage, period and team-member filters, and All / Consumed / Received tabs. A sales-request modal accepts a token amount and optional message. |
| Bookkeeping `/bookkeeping` | Observed and Source | Direct URL loaded a year-filtered period list with an empty state and a New Period form for year and month. The main navigation did not expose Bookkeeping in this session. |
| Bookkeeping period `/bookkeeping/[periodId]` and child routes `/transactions`, `/export`, `/payroll` | Source | Bank statement upload and processing, transaction review and single/bulk categorization, template-based Excel export, and period payroll with employee records, exchange rate, prior-period copy, and GDT workbook export. |
| Sign in, registration, verification, recovery, invitation | Source | `/auth/sign-in`, `/auth/sign-up`, `/auth/verify`, `/auth/forgot-password`, `/auth/invite`. These use a guest layout and redirect authenticated users to Application. |
| Company onboarding and policies | Source | `/onboarding` collects representative and company details and offers deferral. `/policy/terms`, `/policy/privacy`, and `/policy/facebook-data-deletion` provide policy pages. |

### Web and internal Admin

| App and route | Evidence | Current behavior |
| --- | --- | --- |
| Web `/` and `/about` | Observed and Source | Home presents Syncra's supply-chain offering, with Products, Community, and Download navigation and pricing and Contact Sales calls to action. The About Syncra footer link opened `/about` and rendered its heading. [Home](../../src/web/app/pages/index.vue), [About](../../src/web/app/pages/about.vue), [Web navigation](../../src/web/app/layouts/default.vue) |
| Web catalog, sales, and content | Source | Pages cover the product catalog and details, pricing, Learn More, downloads, news, community, and legal notices. Sales inquiries use the Web contact form. Catalog data and inquiry delivery need a configured API. [Web pages](../../src/web/app/pages), [sales form](../../src/web/app/components/form/FormContactSale.vue) |
| Admin Account Management `/` | Observed and Source | The dashboard shows registration and onboarding summaries and a company account table. A row's **Manage** link opened `/account/0` in the local build. The summary numbers and account rows are hardcoded in the current page. [Account Management page](../../src/admin/app/pages/index.vue) |
| Admin Account Detail `/account/[id]` | Observed and Source | The detail has Company Information, Module, Token, and Seat tabs. Company Information displayed representative and company details. Selecting Module set `?tab=module` and showed a Doc AI card with activation period and feature sections. The Module card uses static content. [Account Detail](../../src/admin/app/pages/account/%5Bid%5D.vue), [Module Management](../../src/admin/app/features/account/components/ModuleManagement.vue) |
| Admin navigation and remaining pages | Observed links and Source | The sidebar includes TechPack Reviews and the lead, hero, product, and pricing sections. It also displays Sale Request (`/sale-request`), Community Management (`/community`), and Setting (`/setting`), whose paths have no matching page files in this checkout. The TechPack review queue and detail have source-backed review and release controls. [Admin sidebar](../../src/admin/app/layouts/default.vue), [Admin pages](../../src/admin/app/pages) |
| Admin authentication | Local redirect observed and Source | Source has sign-in, forgot, and reset routes. The isolated build redirected `/auth/sign-in` to `/` with no credential entry. Staff sign-in, role enforcement, and unauthenticated routing need a check against the configured Admin API. [Guest middleware](../../src/admin/app/middleware/guest.ts), [Admin auth pages](../../src/admin/app/pages/auth) |

## User journeys and business rules

### 1. Enter a company workspace

**Source.** A new customer registers and verifies a code. A company user can supply representative then company details or defer onboarding. The guest and onboarding middleware account for authenticated sessions, verification flow state, member profiles, and partially completed onboarding. Email and phone forms are present. Runtime flags control social sign-in and phone-related entry choices, so visible choices can vary by environment.

**Source.** An invited user follows the invitation, supplies a temporary password, sets a new password, and completes their profile. **Observed.** Once signed in as an Admin, the sidebar links to Application, Team Management, Activity, and Settings. [Auth pages](../../src/portal/app/pages/auth), [onboarding](../../src/portal/app/pages/onboarding.vue), [auth guard](../../src/portal/app/middleware/auth.ts), [onboarding guard](../../src/portal/app/middleware/onboarding.ts)

### 2. Extract a TechPack

1. **Observed.** Open Application → Go to Workspace → TechPack. The upload screen supports a file chooser or drag and drop. A restored staged file appeared with name, type, size, and upload status, and the page displayed total files, ETA, and cost.
2. **Observed.** Process opens a review dialog asking the user to confirm that the uploaded files match TechPack. The existing draft showed **Confirm (1)** and Cancel. This is an example quote for one file, rather than a pricing rule.
3. **Source.** The portal supports multiple staged files and restores the current draft by company and document type. The initial dropzone advertises PDF and the non-Invoice queue checks a 50 MiB limit per submitted batch. Other chooser code also lists JPEG and PNG, so server support for images and the overall job limit remain open.
4. **Source.** Confirm finalizes the job. The UI polls status, fetches results, and refreshes the token balance. It handles full completion, partial completion, failure, rejection, and verification pending. Results can expose spreadsheets, source files, and file actions depending on availability and status. [Wizard](../../src/portal/app/pages/workspace/create.vue), [job API client](../../src/portal/app/services/docai.service.ts), [file results](../../src/portal/app/features/workspace/components/ExtractionFileInfo.vue)

### 3. Extract an Invoice set

| Input mode | Required inputs | Limits shown in the UI |
| --- | --- | --- |
| Combined PDF (default) | One PDF described as containing invoice, packing list, and fabric rolls | 25 MB per file |
| Separate files | Invoice PDF and packing list PDF or XLSX. Fabric rolls PDF is optional. | 25 MB per file and 49 MB total |

**Observed.** One set represents one job. Selecting Separate files changed the inputs and the required-file hint. Process stayed disabled without the required files.

**Source.** Each slot accepts one nonempty file with a supported extension. The byte checks use MiB. Changing input mode clears the prior selections. Process stages the selected set together, shows the uploaded set for review, and uses the reviewed file ID at finalization. The wizard restores staged sets, reloads on draft conflict, and distinguishes an ambiguous finalization response from a confirmed failure. A retry of an uncertain submission remains tied to the same reviewed set. Balance checks compare the estimate with available tokens before confirmation. An Invoice result's usage display uses recorded charges and can reflect a later refund.

**Source.** The result can offer Process another invoice set or Replace files and try again. Staging, confirmation, processing, and success or retry with a complete Invoice set remain unverified in a running app. [Wizard](../../src/portal/app/pages/workspace/create.vue), [Invoice behavior tests](../../src/portal/test/nuxt/invoice-workspace.test.ts), [charge and retention tests](../../src/portal/test/nuxt/activity-file-retention.test.ts)

### 4. Find, review, and export results

**Observed.** Recent Activities links to the full extraction Activity History. The history status filter offers Completed, Processing, Partial Completed, Failed, and Rejected. The module filter lists Purchase Order, Techpack, and Invoice. Purchase Order appeared in the filter but had no launch card in the observed workspace. Source accepts `PURCHASE_ORDER` in the wizard, so processing availability for this tenant remains open.

**Source.** A list row opens job detail using `jobId`. The formatted Processing ID is for display. A verification-pending workbook remains withheld, and the UI continues polling the result. Only eligible rows with released workbooks expose history bulk download. The detail view handles file deletion and expiry using API metadata. A null expiry can display as no automatic deletion. For enabled companies, an eligible TechPack file's **Download & Export to ERP** starts the workbook download and then calls the ERP export API. Preview remains read-only and a failed ERP export can be retried without starting a second copy of the download.

**Source.** Internal reviewers have a verification queue and a detail view that compares the original PDF with the workbook, supports correcting values or supplying a corrected XLSX, and requires reviewer attestation before approval and release. [History list behavior](../../src/portal/app/features/workspace/composables/useActivity.ts), [job detail](../../src/portal/app/pages/workspace/activity-history/%5Bid%5D.vue), [ERP behavior tests](../../src/portal/test/nuxt/extraction-download-export.test.ts), [internal review screen](../../src/admin/app/pages/techpack-reviews/%5BfileId%5D.vue)

### 5. Maintain POM translations

**Observed.** The glossary describes an English and Simplified Chinese workbench for TechPack measurement terms. In the inspected session it showed an unavailable message even though the workspace card was active.

**Source.** When available, users can browse entries and upload history by company-wide or brand scope. An Admin can upload an XLSX to generate a preview with additions, changes, removals, unchanged counts, warnings, and blocking issues. Apply requires a valid current preview and extra confirmation for removals. The UI can discard a preview or start a revert preview from eligible history. DTOs distinguish company-brand, company-wide, and global entry layers, and glossary versus generative AI provenance. The API's precedence and translation fallback rules remain open. [Glossary pages](../../src/portal/app/pages/workspace/glossary), [glossary contracts](../../src/portal/app/types/dto/glossary.dto.ts), [preview helpers](../../src/portal/app/features/glossary/utils/glossary.ts)

### 6. Invite and manage people

**Observed.** Invite Member asks for email address and job title. The title picker supports search or creation. Team filters offer Active, Deactivate, Invited - Expired, and Invited - Pending. Opening the deactivated member's menu showed Reactivate User and Remove from workspace.

**Source.** A new invitation uses the Operator role. The portal checks seat availability before opening the invitation form and offers a seat-request flow at capacity. The current user and Admin rows have no action menu. Active members can be deactivated or removed. Pending and expired invitations offer resend, edit email, and cancel. Change Role has code and a dialog, but the normal active-member menu item is disabled. [Team page](../../src/portal/app/pages/team-management.vue), [team API client](../../src/portal/app/services/team-management.service.ts)

### 7. Manage settings, monitor usage, or contact sales

**Observed.** Account profile and password edits are separate. The password form displays a minimum of eight characters, no spaces, upper and lower case letters, a digit, and a symbol. Company Information has separate forms for representative details and company details.

**Observed.** The token request opens a sales inquiry form with amount choices of 1.6M, 3.2M, 4.8M, and 6.4M tokens and an optional message limited to 400 words. The product sales dialog preselects the clicked product and offers a message field. **Source.** These actions submit inquiries for follow-up. The portal shows the company balance, and the token ledger can include grants, usage, refunds, expiry, adjustments, and transfers. The audit log export is a separate action from extraction downloads and token history.

**Observed.** Bookkeeping allows an Admin in this session to open the New Period form and choose a year and month. **Source.** Period pages then support bank statement processing, transaction review and categorization, and workbook export, with a separate payroll view for the period. The activity of creating or modifying a period remains unverified. [Account profile](../../src/portal/app/pages/settings/account-profile.vue), [company settings](../../src/portal/app/pages/settings/company-information.vue), [token page](../../src/portal/app/pages/token.vue), [token request](../../src/portal/app/composables/useRequestToken.ts), [audit log](../../src/portal/app/pages/activity-log.vue), [Bookkeeping pages](../../src/portal/app/pages/bookkeeping)

## Data concepts and API boundaries

These are frontend concepts and API contracts. The checkout contains three Nuxt apps. The portal uses a configured API base URL with credentials, a local proxy option, and a session-refresh wrapper. Database tables, storage, processing workers, payment or accounting rules, and server-side authorization need separate evidence. Client route and button visibility alone cannot establish API permissions.

| Concept | Relationships and fields | Source |
| --- | --- | --- |
| Company, profile, representative, membership | Company ID scopes most portal data. Profile carries account type, privilege role, onboarding flags, and representative/company details. Membership adds job title, email, status, and seat summary. | [Profile DTO](../../src/portal/app/types/dto/profile.dto.ts), [team DTO](../../src/portal/app/types/dto/team-management.dto.ts) |
| Module access and processor | A module entitlement controls launcher access. Doc AI processors describe extraction types available to a company. Company feature flags can separately enable ERP export. | [Application launcher](../../src/portal/app/pages/index.vue), [workspace](../../src/portal/app/pages/workspace/index.vue), [profile store](../../src/portal/app/stores/useProfileStore.ts) |
| Extraction job, files, results | A company-scoped job has an internal `jobId` and a formatted Processing ID, document type, status, progress, estimated credits and duration, and optionally brand/style pairs. A job contains files with source metadata and output references. An Invoice set can include named attachments. The job contract includes DRAFT, PENDING, PROCESSING, COMPLETED, PARTIAL_COMPLETED, FAILED, and REJECTED. Verification pending and file deletion also have separate fields. | [Doc AI DTO](../../src/portal/app/types/dto/docai.dto.ts) |
| Glossary entry and upload | English and Chinese text, normalized key, source and layer. Upload has a company/brand scope and a preview diff, status, issues, and optional revert lineage. | [Glossary DTO](../../src/portal/app/types/dto/glossary.dto.ts) |
| Token balance and transaction | Company balance supports preflight and display. Ledger entries record amount, type, status, timestamps, initiator and activity. A job estimate and a recorded debit are distinct fields. | [Token DTOs](../../src/portal/app/types/dto/token), [job detail](../../src/portal/app/pages/workspace/activity-history/%5Bid%5D.vue) |
| Audit event and sales inquiry | Audit events support company, user, module, and date filtering. Sales inquiries carry product or token request details. | [Activity log DTO](../../src/portal/app/types/dto/activity-log.dto.ts), [contact sales service](../../src/portal/app/services/contact-sale.service.ts) |
| Bookkeeping period, statement, transaction, payroll | A year/month period groups uploaded bank statements, transaction and category data, exports, and a payroll record with employees. | [Bookkeeping DTO](../../src/portal/app/types/dto/bookkeeping.dto.ts), [payroll DTO](../../src/portal/app/types/dto/payroll.dto.ts) |

## Where to go next

- For code structure and the reference files to copy, read the owning app's `AGENTS.md`: [Portal](../../src/portal/AGENTS.md), [Admin](../../src/admin/AGENTS.md), [Web](../../src/web/AGENTS.md).
- For cross-app IDs, sessions, and ports, read [workspace architecture](../architecture.md).
- Unresolved product and permission questions are in [open questions](open-questions.md).
