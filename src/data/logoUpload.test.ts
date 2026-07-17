import { describe, expect, it } from 'vitest'
import { GARAGE_LOGO_MAX_BYTES, garageLogoStoragePath } from './logoUpload'

const garageId = '11111111-1111-4111-8111-111111111111'

describe('garage logo upload validation', () => {
  it.each([
    ['image/png', 'png'],
    ['image/jpeg', 'jpg'],
    ['image/webp', 'webp'],
  ])('uses a canonical organization path for %s', (type, extension) => {
    expect(garageLogoStoragePath(garageId, { type, size: 1024 })).toBe(
      `${garageId}/logo.${extension}`,
    )
  })

  it('rejects active or unrelated content types', () => {
    expect(() => garageLogoStoragePath(garageId, { type: 'image/svg+xml', size: 1024 })).toThrow(
      'Unsupported garage logo format',
    )
  })

  it('rejects empty and oversized files', () => {
    expect(() => garageLogoStoragePath(garageId, { type: 'image/png', size: 0 })).toThrow(
      'Invalid garage logo size',
    )
    expect(() => garageLogoStoragePath(garageId, {
      type: 'image/png',
      size: GARAGE_LOGO_MAX_BYTES + 1,
    })).toThrow('Invalid garage logo size')
  })

  it('rejects a malformed organization identifier', () => {
    expect(() => garageLogoStoragePath('../other', { type: 'image/png', size: 1024 })).toThrow(
      'Invalid garage identifier',
    )
  })
})
