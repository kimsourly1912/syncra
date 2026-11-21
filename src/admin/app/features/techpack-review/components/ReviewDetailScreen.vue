<script setup lang="ts">
import { useReviewDetail } from '../composables/useReviewDetail'
import { cellKey, editKey, findingColumn } from '../utils/findings'

const props = defineProps<{
  fileId: string
}>()

const {
  backLink, loadingReview, pageError, busy, reviewError, selected, replacement, confirmed, message,
  source, sourcePage, sourceZoom, sourceLoading, sourceError,
  inspection, inspectionLoading, inspectionError, sheetIndex, activeCell, inlineEdits,
  sheet, pdfFindings, aiFindings, findings, activeFinding, stagedEdits, flaggedCells, checkedGrid, pdfBlocksApproval, canConfirm,
  workbookInput, sourceViewport, gridViewport,
  loadSource, selectSheet, findingLocation, stageValue, undoValue, useAllPdfValues, displayCell, showFinding,
  download, chooseReplacement, saveReplacement, saveInlineCorrections, approve,
} = useReviewDetail(props.fileId)
</script>

<template>
  <section class="min-w-0 space-y-4">
    <header class="space-y-3">
      <UButton
        label="TechPack reviews"
        icon="lucide:arrow-left"
        color="neutral"
        variant="ghost"
        :to="backLink"
        :disabled="busy"
      />
      <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h1 class="min-w-0 break-all text-2xl font-semibold text-highlighted">
          {{ selected?.filename ?? 'TechPack review' }}
        </h1>
        <UBadge
          v-if="selected"
          :color="selected.status === 'IN_REVIEW' ? 'warning' : 'success'"
          :label="selected.status === 'IN_REVIEW' ? 'In Review' : 'Reviewed'"
          variant="subtle"
        />
      </div>
      <p
        v-if="selected"
        class="text-sm text-muted"
      >
        Company {{ selected.companyId }} · Job {{ selected.jobId }}
      </p>
    </header>

    <UAlert
      v-if="pageError"
      color="error"
      :title="pageError"
    />
    <p
      v-else-if="loadingReview"
      class="text-sm text-muted"
      role="status"
    >
      Loading review…
    </p>
    <UAlert
      v-else-if="selected?.status === 'REVIEWED'"
      color="success"
      title="Workbook reviewed and released."
    />
    <div
      v-else-if="selected?.draftUuid"
      class="space-y-4"
    >
      <div class="grid overflow-hidden rounded-lg border border-default bg-default divide-y divide-default lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:divide-x lg:divide-y-0">
        <div class="flex min-w-0 flex-col">
          <div class="review-toolbar">
            <h2 class="flex items-center gap-2 font-semibold text-highlighted">
              <UIcon
                name="lucide:file-text"
                class="size-5 text-primary"
              />
              Source PDF
            </h2>
            <UButton
              label="Download PDF"
              icon="lucide:download"
              color="neutral"
              variant="ghost"
              size="sm"
              :disabled="busy"
              @click="download('source')"
            />
          </div>
          <div
            v-if="source"
            class="flex flex-wrap items-center justify-between gap-1 border-b border-default bg-default px-3 py-1"
          >
            <div class="flex items-center gap-1">
              <UButton
                aria-label="Previous PDF page"
                icon="lucide:chevron-left"
                color="neutral"
                variant="ghost"
                size="sm"
                :disabled="sourceLoading || sourcePage <= 1"
                @click="loadSource(sourcePage - 1)"
              />
              <span
                aria-live="polite"
                class="min-w-20 text-center text-sm text-muted"
              >Page {{ sourcePage }} of {{ source.pageCount }}</span>
              <UButton
                aria-label="Next PDF page"
                icon="lucide:chevron-right"
                color="neutral"
                variant="ghost"
                size="sm"
                :disabled="sourceLoading || sourcePage >= source.pageCount"
                @click="loadSource(sourcePage + 1)"
              />
            </div>
            <div class="flex items-center gap-1">
              <UButton
                aria-label="Zoom out PDF"
                icon="lucide:minus"
                color="neutral"
                variant="ghost"
                size="sm"
                :disabled="sourceZoom <= 100"
                @click="sourceZoom -= 50"
              />
              <span class="min-w-10 text-center text-sm text-muted">{{ sourceZoom === 100 ? 'Fit' : sourceZoom + '%' }}</span>
              <UButton
                aria-label="Zoom in PDF"
                icon="lucide:plus"
                color="neutral"
                variant="ghost"
                size="sm"
                :disabled="sourceZoom >= 250"
                @click="sourceZoom += 50"
              />
            </div>
          </div>
          <div
            v-if="sourceLoading || sourceError"
            class="border-b border-default px-4 py-2 text-sm text-muted"
            role="status"
          >
            {{ sourceLoading ? 'Loading PDF…' : sourceError }}
          </div>
          <div class="relative min-h-[22rem] flex-1 bg-elevated lg:min-h-[29rem]">
            <div
              v-if="source"
              ref="sourceViewport"
              class="absolute inset-0 overflow-auto p-3"
              tabindex="0"
              aria-label="Original TechPack PDF preview"
            >
              <img
                :src="`data:image/png;base64,${source.pngBase64}`"
                :alt="`Original TechPack PDF, page ${sourcePage}`"
                :style="{ width: sourceZoom + '%' }"
                class="max-w-none bg-white shadow-sm"
                draggable="false"
                @error="sourceError = 'PDF preview unavailable. Download the source PDF to compare it.'"
              >
            </div>
          </div>
        </div>

        <div class="flex min-w-0 flex-col">
          <div class="review-toolbar">
            <h2 class="flex items-center gap-2 font-semibold text-highlighted">
              <UIcon
                name="lucide:sheet"
                class="size-5 text-primary"
              />
              Draft workbook
            </h2>
            <UButton
              label="Download workbook"
              icon="lucide:download"
              color="neutral"
              variant="ghost"
              size="sm"
              :disabled="busy"
              @click="download('draft')"
            />
          </div>

          <div
            v-if="inspection"
            class="flex min-w-0 flex-1 flex-col"
          >
            <div
              v-if="inspection.sourceCheck?.verified"
              class="flex items-start gap-2.5 border-b border-success/20 bg-success/5 px-4 py-3"
              role="status"
            >
              <UIcon
                name="lucide:circle-check"
                class="mt-0.5 size-4 shrink-0 text-success"
              />
              <div class="text-sm">
                <p class="font-semibold text-highlighted">
                  No differences found
                </p>
                <p class="text-muted">
                  All {{ inspection.sourceCheck.comparedCells }} size and tolerance cells match the PDF.
                  This workbook is already in review and needs admin approval to release.
                </p>
              </div>
            </div>
            <div
              v-else-if="inspection.sourceCheck"
              class="space-y-1 border-b border-default px-4 py-3 text-sm text-muted"
            >
              <p v-if="inspection.sourceCheck.comparedCells">
                Compared {{ inspection.sourceCheck.comparedCells }} size and tolerance cells with the PDF.
              </p>
              <p
                v-for="note in inspection.sourceCheck.notes"
                :key="note"
                class="text-highlighted"
              >
                {{ note }}
              </p>
            </div>
            <p
              v-else
              class="border-b border-default px-4 py-3 text-sm text-muted"
            >
              Source comparison unavailable. Verify the workbook against the PDF.
            </p>
            <div
              v-if="inspection.aiReview"
              class="space-y-1 border-b border-default px-4 py-3 text-sm text-muted"
              role="status"
            >
              <p class="flex items-center gap-2 font-semibold text-highlighted">
                <UIcon
                  name="lucide:scan-search"
                  class="size-4 text-primary"
                />
                Second AI review
              </p>
              <p v-if="inspection.aiReview.comparedCells">
                The AI read the original PDF and compared {{ inspection.aiReview.comparedCells }} size and tolerance cells with the workbook.
                <template v-if="!aiFindings.length">
                  No differences in the cells it compared.
                </template>
              </p>
              <p
                v-for="note in inspection.aiReview.notes"
                :key="note"
              >
                {{ note }}
              </p>
              <p>Verify the workbook against the source PDF before approving release.</p>
            </div>
            <div
              v-if="findings.length"
              class="border-b border-warning/20 bg-warning/5 px-4 py-3"
            >
              <div class="flex flex-wrap items-center justify-between gap-2">
                <h3 class="flex items-center gap-2 text-sm font-semibold text-highlighted">
                  <UIcon
                    name="lucide:triangle-exclamation-point"
                    class="size-4 text-warning"
                  />
                  <template v-if="aiFindings.length">
                    {{ aiFindings.length }} {{ aiFindings.length === 1 ? 'possible difference' : 'possible differences' }} flagged by AI
                  </template>
                  <template v-else>
                    {{ pdfFindings.length }} {{ pdfFindings.length === 1 ? 'difference' : 'differences' }} from the PDF
                  </template>
                </h3>
                <UButton
                  v-if="pdfFindings.length > 1"
                  label="Use all PDF values"
                  icon="lucide:copy-check"
                  size="sm"
                  variant="soft"
                  :disabled="busy || !!replacement"
                  @click="useAllPdfValues"
                />
              </div>
              <ul class="mt-2 grid max-h-32 gap-2 overflow-auto pr-1">
                <li
                  v-for="finding in findings"
                  :key="editKey(finding)"
                >
                  <button
                    type="button"
                    class="flex w-full flex-wrap items-start gap-x-3 gap-y-1 rounded-md border border-warning/25 bg-default px-3 py-2 text-left hover:bg-warning/10 focus-visible:outline-2 focus-visible:outline-primary"
                    :aria-pressed="activeFinding === finding"
                    :class="{ 'ring-1 ring-primary': activeFinding === finding }"
                    @click="showFinding(finding)"
                  >
                    <span class="min-w-0 flex-1">
                      <span class="block text-sm font-semibold text-highlighted">
                        {{ finding.measurement }} · {{ findingColumn(finding) }}
                      </span>
                      <span class="block text-sm text-muted">
                        {{ finding.origin === 'ai' ? 'AI read' : 'PDF' }} {{ finding.referenceValue || 'blank' }} · Workbook {{ finding.workbookValue || 'blank' }}
                      </span>
                    </span>
                    <span class="flex shrink-0 items-center gap-1 text-xs font-medium text-muted">
                      {{ findingLocation(finding) }}
                      <template v-if="finding.sourcePage">
                        · {{ finding.origin === 'ai' ? 'AI cited page' : 'PDF page' }} {{ finding.sourcePage }}
                      </template>
                      <UIcon
                        name="lucide:pencil"
                        class="size-4"
                      />
                    </span>
                  </button>
                </li>
              </ul>
              <div
                v-if="activeFinding"
                class="mt-3 flex flex-wrap items-end gap-2 rounded-md border border-default bg-default px-3 py-2.5"
              >
                <div class="min-w-0 space-y-1">
                  <label
                    for="techpack-inline-value"
                    class="block text-sm font-semibold text-highlighted"
                  >
                    Correct {{ activeFinding.measurement }} · {{ findingColumn(activeFinding) }}
                  </label>
                  <input
                    id="techpack-inline-value"
                    type="text"
                    maxlength="64"
                    autocomplete="off"
                    class="w-full max-w-48 rounded-md border border-default bg-default px-2.5 py-1.5 text-sm text-highlighted focus-visible:outline-2 focus-visible:outline-primary"
                    :value="inlineEdits.get(editKey(activeFinding)) ?? activeFinding.workbookValue"
                    :disabled="busy || !!replacement"
                    @input="stageValue(activeFinding, ($event.target as HTMLInputElement).value)"
                  >
                </div>
                <UButton
                  v-if="activeFinding.origin === 'pdf'"
                  :label="activeFinding.referenceValue ? 'Use PDF value' : 'Use blank from PDF'"
                  size="sm"
                  variant="soft"
                  :disabled="busy || !!replacement"
                  @click="stageValue(activeFinding, activeFinding.referenceValue)"
                />
                <UButton
                  v-if="inlineEdits.has(editKey(activeFinding))"
                  label="Undo change"
                  size="sm"
                  color="neutral"
                  variant="ghost"
                  :disabled="busy"
                  @click="undoValue(activeFinding)"
                />
              </div>
            </div>
            <p
              v-if="inspection.partial"
              class="border-b border-warning/20 bg-warning/5 px-4 py-2 text-sm text-highlighted"
            >
              This preview is limited. Download the full workbook before confirming your review.
            </p>
            <div
              v-if="sheet"
              class="flex flex-1 flex-col"
            >
              <div
                class="flex items-center gap-2 overflow-x-auto border-b border-default bg-default px-4 py-2"
                aria-label="Workbook sheets"
              >
                <UButton
                  v-for="(tab, index) in inspection.sheets"
                  :key="tab.name"
                  :label="tab.name"
                  :variant="sheetIndex === index ? 'soft' : 'ghost'"
                  :color="sheetIndex === index ? 'primary' : 'neutral'"
                  :aria-pressed="sheetIndex === index"
                  size="sm"
                  class="shrink-0"
                  @click="selectSheet(index)"
                />
                <span
                  v-if="checkedGrid && sheet.gridHeaderRow === null"
                  class="shrink-0 text-xs text-muted"
                >No size grid checks on this sheet</span>
              </div>
              <div
                ref="gridViewport"
                class="max-h-[48dvh] min-h-52 flex-1 overflow-auto bg-default"
                tabindex="0"
                :aria-label="`${sheet.name} workbook preview`"
              >
                <table class="review-grid">
                  <thead>
                    <tr>
                      <th scope="col">
                        Row
                      </th>
                      <th
                        v-for="column in sheet.columns"
                        :key="column"
                        scope="col"
                      >
                        {{ column }}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="row in sheet.rows"
                      :key="row.number"
                      :class="{ 'grid-header': row.number === sheet.gridHeaderRow }"
                    >
                      <th scope="row">
                        {{ row.number }}
                      </th>
                      <td
                        v-for="(column, index) in sheet.columns"
                        :key="column"
                        :data-cell="cellKey(row.number, index)"
                        :tabindex="flaggedCells.has(cellKey(row.number, index)) ? -1 : undefined"
                        :class="{
                          'flagged-cell': flaggedCells.has(cellKey(row.number, index)),
                          'active-cell': activeCell === cellKey(row.number, index),
                          'edited-cell': inlineEdits.has(editKey({ sheetIndex, rowNumber: row.number, columnIndex: index })),
                        }"
                      >
                        {{ displayCell(row, index) }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <p
              v-else
              class="px-4 py-5 text-sm text-muted"
            >
              No worksheet could be shown. Download the workbook to review it.
            </p>
          </div>
          <div
            v-else
            class="grid min-h-48 flex-1 place-items-center p-5 text-center text-sm text-muted"
            role="status"
          >
            {{ inspectionLoading ? 'Reading draft workbook…' : inspectionError }}
          </div>
        </div>
      </div>

      <details class="rounded-lg border border-default bg-default px-4 py-3">
        <summary class="cursor-pointer text-sm font-semibold text-highlighted">
          Replace workbook
        </summary>
        <div class="mt-3 flex flex-wrap items-end gap-x-4 gap-y-2">
          <div class="min-w-0 space-y-1">
            <label
              for="corrected-workbook"
              class="block text-sm font-semibold text-highlighted"
            >Corrected workbook (.xlsx)</label>
            <input
              id="corrected-workbook"
              ref="workbookInput"
              type="file"
              accept=".xlsx"
              class="block w-full max-w-80 rounded-md border border-default bg-default text-sm text-muted file:mr-3 file:border-0 file:bg-elevated file:px-3 file:py-2"
              :disabled="busy || !!stagedEdits.length"
              @change="chooseReplacement"
            >
          </div>
          <UButton
            v-if="replacement"
            label="Save corrected workbook"
            icon="lucide:upload"
            variant="subtle"
            :disabled="busy"
            @click="saveReplacement"
          />
        </div>
      </details>

      <footer class="space-y-3 rounded-lg border border-default bg-default px-4 py-3 shadow-sm lg:sticky lg:bottom-0 lg:z-10">
        <UAlert
          v-if="reviewError"
          color="error"
          :title="reviewError"
        />
        <UAlert
          v-if="message"
          color="info"
          :title="message"
        />
        <div
          v-if="stagedEdits.length"
          class="flex w-full flex-wrap items-center justify-between gap-2 border-b border-default pb-3"
        >
          <span
            aria-live="polite"
            class="text-sm font-semibold text-highlighted"
          >
            {{ stagedEdits.length }} unsaved {{ stagedEdits.length === 1 ? 'correction' : 'corrections' }}
          </span>
          <div class="flex gap-2">
            <UButton
              label="Discard changes"
              color="neutral"
              variant="ghost"
              :disabled="busy"
              @click="inlineEdits.clear()"
            />
            <UButton
              label="Save corrections"
              icon="lucide:save"
              :loading="busy"
              @click="saveInlineCorrections"
            />
          </div>
        </div>
        <p
          v-if="pdfBlocksApproval"
          class="w-full text-sm font-medium text-warning"
        >
          Resolve the PDF differences or workbook layout issues shown above before approving.
        </p>
        <div class="flex w-full flex-wrap items-center justify-between gap-4">
          <UCheckbox
            v-model="confirmed"
            label="I verified the critical values and required rows and sizes against the source PDF."
            :disabled="!canConfirm"
          />
          <div class="flex shrink-0 gap-2">
            <UButton
              label="Approve and release"
              icon="lucide:check"
              :disabled="!canConfirm || !confirmed"
              @click="approve"
            />
          </div>
        </div>
      </footer>
    </div>
  </section>
</template>

<style scoped>
.review-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  border-bottom: 1px solid var(--ui-border);
  background: var(--ui-bg);
  padding: 0.625rem 1rem;
}

.review-grid {
  width: max-content;
  min-width: 100%;
  border-spacing: 0;
  font-size: 0.875rem;
  white-space: nowrap;
}

.review-grid :is(th, td) {
  padding: 0.375rem 0.625rem;
  border-right: 1px solid var(--ui-border);
  border-bottom: 1px solid var(--ui-border);
  text-align: start;
}

.review-grid th {
  position: sticky;
  background: var(--ui-bg-elevated);
  color: var(--ui-text-muted);
  font-weight: 500;
}

.review-grid thead th {
  top: 0;
  z-index: 2;
}

.review-grid th:first-child {
  left: 0;
  z-index: 1;
  text-align: end;
}

.review-grid thead th:first-child {
  z-index: 3;
}

.review-grid td {
  min-width: 3.5rem;
  max-width: 24rem;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.review-grid .grid-header td {
  background: var(--ui-bg-elevated);
  color: var(--ui-text-highlighted);
  font-weight: 600;
}

.review-grid .flagged-cell {
  background: color-mix(in srgb, var(--ui-warning) 18%, var(--ui-bg));
  font-weight: 600;
  scroll-margin-block-start: 2rem;
  scroll-margin-inline-start: 3rem;
}

.review-grid .active-cell {
  outline: 2px solid var(--ui-primary);
  outline-offset: -2px;
}

.review-grid .edited-cell {
  background: color-mix(in srgb, var(--ui-primary) 18%, var(--ui-bg));
}
</style>
