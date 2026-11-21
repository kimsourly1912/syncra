import { describe, expect, it } from 'vitest'
import {
  canRevertGlossaryUpload,
  glossaryErrorCode,
  glossaryScopeQuery,
  hasGlossaryChanges,
  previewFromUploadError,
  readStashedGlossaryPreview,
  requiresTypedGlossaryRemovalConfirmation,
  stashGlossaryPreview,
} from '../../app/features/glossary/utils/glossary'

describe('glossary workflow helpers', () => {
  it('omits brand for company-wide scope and trims a brand scope', () => {
    expect(glossaryScopeQuery('company', 'VB')).toEqual({})
    expect(glossaryScopeQuery('brand', '  VB  ')).toEqual({ brand: 'VB' })
    expect(glossaryScopeQuery('brand', '   ')).toEqual({})
  })

  it('recognizes writes and revertible history states', () => {
    expect(hasGlossaryChanges({ added: 0, changed: 0, removed: 0, unchanged: 12 })).toBe(false)
    expect(hasGlossaryChanges({ added: 0, changed: 1, removed: 0, unchanged: 12 })).toBe(true)
    expect(canRevertGlossaryUpload('APPLIED')).toBe(true)
    expect(canRevertGlossaryUpload('SUPERSEDED')).toBe(true)
    expect(canRevertGlossaryUpload('PREVIEW')).toBe(false)
    expect(canRevertGlossaryUpload('DISCARDED')).toBe(false)
  })

  it('extracts a rejected preview and a structured conflict code', () => {
    const preview = {
      uploadId: 12,
      status: 'DISCARDED',
      counts: { added: 0, changed: 0, removed: 0, unchanged: 0 },
      blockingErrors: [{ severity: 'BLOCKING', rowNumbers: [4], message: 'Blank Chinese' }],
    }
    expect(previewFromUploadError({ data: { data: preview } })).toEqual(preview)
    expect(previewFromUploadError({ data: preview })).toEqual(preview)
    expect(previewFromUploadError({ response: { _data: { data: preview } } })).toEqual(preview)
    expect(previewFromUploadError({ data: { data: { status: 'DISCARDED' } } })).toBeNull()
    expect(glossaryErrorCode({ data: { msg: 'GLOSSARY_PREVIEW_STALE' } })).toBe('GLOSSARY_PREVIEW_STALE')
  })

  it('keeps a rejected 422 preview so the review page can render issues without re-GET', () => {
    const preview = {
      uploadId: 60,
      status: 'DISCARDED' as const,
      counts: { added: 0, changed: 0, removed: 0, unchanged: 0 },
      blockingErrors: [{ severity: 'BLOCKING', rowNumbers: [19, 20], message: 'Keep one.' }],
      warnings: [{ severity: 'WARNING', rowNumbers: [528], message: 'No Chinese' }],
    }
    stashGlossaryPreview(preview)
    expect(readStashedGlossaryPreview(60)).toEqual(preview)
    expect(readStashedGlossaryPreview(61)).toBeNull()
  })

  it('requires typed confirmation at the ten-removal safety threshold', () => {
    expect(requiresTypedGlossaryRemovalConfirmation(9)).toBe(false)
    expect(requiresTypedGlossaryRemovalConfirmation(10)).toBe(true)
    expect(requiresTypedGlossaryRemovalConfirmation(40)).toBe(true)
  })
})
