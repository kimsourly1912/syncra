# Doc AI

Doc AI helps customer teams extract usable data from supply-chain documents. This reference is the product contract for a workflow that spans apps: processing and results in Portal, and workbook review in Admin. Each app's docs own the implementation. See [product scope](../product/scope.md) for roles and screens, and [architecture](../architecture.md#ids-that-cross-apps) for the IDs that cross apps.

**Evidence.** A browser session (Observed) confirmed the entry points, the Invoice mode switch, and the TechPack cost confirmation. Code and tests (Source) describe staging, retries, polling, results, glossary changes, and internal review. Completing a workflow end to end, and backend behavior, need a configured environment and a test company. Labels are defined in the [product scope](../product/scope.md#evidence-labels).

## Ownership and entry points

| Workflow | UI and primary code |
| --- | --- |
| Find processors | Portal `/` → `/workspace`. The [workspace](../../src/portal/app/pages/workspace/index.vue) uses company processor data and recent job history. |
| Upload and process | Portal `/workspace/create?type=TECHPACK` or `?type=INVOICE`. Both modes use the same [wizard](../../src/portal/app/pages/workspace/create.vue), [service](../../src/portal/app/services/docai.service.ts), and [DTOs](../../src/portal/app/types/dto/docai.dto.ts). |
| History and result | Portal `/workspace/activity-history` → `/workspace/activity-history/[id]`. See [history list](../../src/portal/app/pages/workspace/activity-history/index.vue), [history behavior](../../src/portal/app/features/workspace/composables/useActivity.ts), [job detail](../../src/portal/app/pages/workspace/activity-history/%5Bid%5D.vue), and [file results](../../src/portal/app/features/workspace/components/ExtractionFileInfo.vue). |
| POM Glossary | Portal `/workspace/glossary` and `/workspace/glossary/uploads/[id]`. See [glossary pages](../../src/portal/app/pages/workspace/glossary), [service](../../src/portal/app/services/glossary.service.ts), and [DTOs](../../src/portal/app/types/dto/glossary.dto.ts). |
| Verify a workbook | Internal Admin `/techpack-reviews` → `/techpack-reviews/[fileId]`. See the [review queue](../../src/admin/app/features/techpack-review/composables/useReviewQueue.ts), [review detail](../../src/admin/app/features/techpack-review/composables/useReviewDetail.ts), and [review models](../../src/admin/app/features/techpack-review/models/review-item.ts). |

Company entitlement and processor responses determine which entry points are offered. The Portal role map includes workspace access for Admin and Operator. The glossary management controls require Portal Admin in the client. Confirm the actual permissions for deep links, operations, and file downloads against the backend. Purchase Order appears in the history filter and the wizard recognizes its type, but no launch card was observed for it. [Portal role map](../../src/portal/app/composables/usePermission.ts)

## Upload and processing

### TechPack

- The wizard can restore a draft and stage multiple files. The initial dropzone advertises PDF. The existing non-Invoice queue caps the submitted batch at 50 MiB. Another chooser advertises JPEG and PNG, so confirm the server's accepted file types and total job limit before changing validation.
- The upload step displays the staged files, count, estimated time, and token cost. Process opens a confirmation dialog. Confirm submits the job for processing.

### Invoice

| Mode | Inputs | Client limits |
| --- | --- | --- |
| Combined PDF, the default | One PDF containing the invoice, packing list, and fabric rolls as described by the UI | 25 MiB |
| Separate files | Invoice PDF, packing list PDF or XLSX, and optional fabric rolls PDF | 25 MiB per file and 49 MiB total |

Each field accepts one nonempty file with an allowed extension. The UI labels the limits in MB and compares byte counts using MiB. Switching mode clears prior selections. With required files missing or invalid, the wizard shows guidance and keeps Process disabled.

Pressing Process stages one set in a multipart request. The service uses `mode` plus `mainFile`, and includes `packing_list` and `fabric_rolls` where selected. The review dialog uses the staged set, including known attachments. The wizard compares its estimated cost with the company balance before presenting confirmation.

Confirm submits the reviewed file ID with the job. Keep the same reviewed set and job when checking an unknown finalization outcome. A changed or stale draft must be reloaded and reviewed before finalization. Staging failure can keep file selections for retry. A restored draft may need the original documents selected again after failure. Requests and recovery stay tied to the company and workspace that started them.

### Status and tokens

The screen progresses from Upload to Process to Completed. The underlying job can be `DRAFT`, `PENDING`, `PROCESSING`, `COMPLETED`, `PARTIAL_COMPLETED`, `FAILED`, or `REJECTED`. Terminal responses prompt result retrieval and a balance refresh. Partial completion can return usable workbooks alongside failed files. Verification pending is a separate field and can keep a result in a waiting state after extraction.

The preflight token estimate comes from the draft or job summary. Invoice result usage uses recorded credits and can reflect a refund. The underlying charge timing, rates, and refund rules belong to the external API. [Wizard](../../src/portal/app/pages/workspace/create.vue), [job detail](../../src/portal/app/pages/workspace/activity-history/%5Bid%5D.vue), [profile store](../../src/portal/app/stores/useProfileStore.ts)

## Results, verification, and exports

- History search and filters use job metadata. The row shows the formatted Processing ID and opens detail with the internal job ID. Brand/style pairs can be supplied by the API.
- A verification-pending file is shown as waiting. The UI polls for updates. Individual workbook actions use the URLs supplied by the API. History bulk download checks for downloadable workbooks, with a compatibility fallback for older responses. Preserve the distinction between a completed job and a released file.
- Result details use API expiry and deletion fields for retention and action availability. The job can remain in history after its files are removed.
- For a company with ERP export enabled and a confirmed TechPack file type, the combined action starts the workbook download before calling ERP export. Preview makes no ERP call. If export fails after the download starts, the retry action calls only ERP. Confirm the destination's state before retrying an uncertain export.
- In Admin, a finding opens the relevant workbook cell and the cited PDF page when available. Staff can save cell corrections or upload a replacement XLSX, then verify the current draft and request release. PDF differences and flagged workbook layout issues block release. An AI flag alone is advisory. The decision to send a workbook to verification and the service's release guarantees remain open.

## POM Glossary

The glossary supports English and Simplified Chinese measurement terms. Source shows company-wide and brand views, XLSX template and upload, a diff preview, and apply or discard actions. A stale preview or blocking issue prevents applying it through the normal flow. Removals require a confirmation, with the removal count typed for ten or more. Eligible applied or superseded uploads can start a revert preview. The glossary contract has company-brand, company-wide, and global layers. Confirm service precedence and fallback rules with the owning team. [Glossary helpers](../../src/portal/app/features/glossary/utils/glossary.ts), [upload preview](../../src/portal/app/pages/workspace/glossary/uploads/%5Bid%5D.vue)

## Acceptance and verification

These are checks for the frontend behaviors above. Use the Portal and Admin verification commands ([Portal testing](../../src/portal/docs/testing.md), [Admin testing](../../src/admin/docs/testing.md)) and a test company with sanitized documents for service checks.

| Scenario | Expected outcome | Existing coverage or verification |
| --- | --- | --- |
| Separate mode with only one required document, an unsupported extension, or a set above the limit | Process remains unavailable and the form shows the applicable guidance or error. | [Invoice workspace tests](../../src/portal/test/nuxt/invoice-workspace.test.ts). Also check both modes in a browser. |
| Complete combined or separate set | One multipart request stages the set, and the review shows the attached files before confirmation. | [Invoice workspace tests](../../src/portal/test/nuxt/invoice-workspace.test.ts). Verify actual API acceptance in a configured environment. |
| A response is lost or the company or draft changes during the flow | Recovery stays tied to the reviewed set. A stale request cannot update another company's workspace or confirm a replacement. | [Invoice workspace tests](../../src/portal/test/nuxt/invoice-workspace.test.ts), [profile balance tests](../../src/portal/test/nuxt/profile-balance.test.ts) |
| Charge pending, debit recorded, or refund observed for Invoice | Result usage follows recorded charges, and the next confirmation uses the refreshed balance when available. | [Invoice workspace tests](../../src/portal/test/nuxt/invoice-workspace.test.ts), [activity detail tests](../../src/portal/test/nuxt/activity-file-retention.test.ts) |
| Verification pending, released workbook, or file retention expired | Availability follows the backend's result metadata. Verify a pending and released workbook, and an expired file, in the browser. | [Bulk download tests](../../src/portal/test/nuxt/activity-workbook-download.test.ts), [retention tests](../../src/portal/test/nuxt/activity-file-retention.test.ts). End-to-end release requires internal review and a configured service. |
| TechPack workbook for an ERP-enabled company | Download starts before ERP export. Retry after an export failure does not repeat the download. A disabled company gets ordinary download. | [Download and ERP tests](../../src/portal/test/nuxt/extraction-download-export.test.ts). Verify destination delivery separately. |
| Glossary enabled or unavailable | Company/access state controls availability. Apply follows valid preview and removal confirmation rules. | [Glossary helper tests](../../src/portal/test/unit/glossary.test.ts). Verify full upload and apply with an enabled test company. |

## Open questions

Doc AI's unresolved questions are in [open questions → Doc AI contracts](../product/open-questions.md#doc-ai-contracts): server file limits, release, charging and retention policy, ERP eligibility and safe retry, and glossary precedence.
