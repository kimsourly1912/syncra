import type * as v from 'valibot'
import { defineModel, vTechPackSourcePreview } from '@/api'

export const sourcePreviewModel = defineModel(vTechPackSourcePreview, {
  required: ['pageCount', 'pngBase64'],
})

export type SourcePreview = v.InferOutput<typeof sourcePreviewModel>
