import { describe, expect, it } from 'vitest'
import { ATTACHMENT_MAX_BYTES, safeAttachmentName, validateAttachment } from './model'

describe('attachment validation', () => {
  it('accepts supported files within the limits', () => {
    expect(validateAttachment({ name: 'diagnostic.pdf', type: 'application/pdf', size: 1200 })).toBeNull()
    expect(validateAttachment({ name: 'photo.jpg', type: 'image/jpeg', size: 1200 })).toBeNull()
  })

  it('rejects disguised, oversized and excessive files', () => {
    expect(validateAttachment({ name: 'photo.exe', type: 'image/jpeg', size: 1200 })).toBe('unsupported_type')
    expect(validateAttachment({ name: 'photo.jpg', type: 'application/x-msdownload', size: 1200 })).toBe('unsupported_type')
    expect(validateAttachment({ name: 'video.mp4', type: 'video/mp4', size: ATTACHMENT_MAX_BYTES + 1 })).toBe('invalid_size')
    expect(validateAttachment({ name: 'photo.jpg', type: 'image/jpeg', size: 1200 }, 20)).toBe('limit_reached')
  })

  it('normalises file names without path separators', () => {
    expect(safeAttachmentName('../Contrôle freins 01.jpg')).toBe('Controle-freins-01.jpg')
    expect(safeAttachmentName('')).toBe('file')
  })
})
