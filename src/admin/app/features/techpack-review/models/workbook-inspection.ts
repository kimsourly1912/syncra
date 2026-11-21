import * as v from 'valibot'
import { defineModel, vFinding, vPreviewRow, vResult, vSheet, vSourceCheck, vTechPackWorkbookInspection } from '@/api'

// The spec has a single `Finding` schema with `aiValue` only: springdoc collapsed the PDF and AI
// finding classes, which share a name. PDF findings carry `pdfValue` instead, which this screen has
// relied on since it shipped. See the open question on the TechPack inspection contract.
const vPdfFinding = v.object({ ...vFinding.entries, pdfValue: v.nullish(v.string()) })

const findingOptional = ['measurement', 'sourcePage', 'workbookValue'] as const

export const pdfFindingModel = defineModel(vPdfFinding, {
  required: ['rowNumber', 'columnIndex', 'column', 'pdfValue'],
  optional: findingOptional,
})

export const aiFindingModel = defineModel(vFinding, {
  required: ['sheetIndex', 'rowNumber', 'columnIndex', 'column', 'aiValue'],
  optional: findingOptional,
})

const workbookRowModel = defineModel(vPreviewRow, { required: ['number', 'cells'] })

export const workbookSheetModel = v.object({
  // `name` keys and labels the sheet tabs.
  ...defineModel(vSheet, { required: ['name', 'columns'], optional: ['gridHeaderRow'] }).entries,
  rows: v.array(workbookRowModel),
})

export const workbookInspectionModel = v.object({
  ...defineModel(vTechPackWorkbookInspection, { required: [], optional: ['partial'] }).entries,
  sheets: v.array(workbookSheetModel),
  findings: v.nullish(v.array(pdfFindingModel)),
  sourceCheck: v.nullish(defineModel(vSourceCheck, { required: [], optional: ['verified', 'blocksApproval', 'comparedCells', 'notes'] })),
  aiReview: v.nullish(v.object({
    ...defineModel(vResult, { required: [], optional: ['comparedCells', 'notes'] }).entries,
    findings: v.nullish(v.array(aiFindingModel)),
  })),
})

export type PdfFinding = v.InferOutput<typeof pdfFindingModel>
export type AiFinding = v.InferOutput<typeof aiFindingModel>
export type WorkbookRow = v.InferOutput<typeof workbookRowModel>
export type WorkbookSheet = v.InferOutput<typeof workbookSheetModel>
export type WorkbookInspection = v.InferOutput<typeof workbookInspectionModel>
