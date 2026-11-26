import { defineModel, vTechPackSourcePreview } from '@/api'

export const sourcePreviewModel = defineModel(vTechPackSourcePreview, {
  required: ['pageCount', 'pngBase64'],
})
