export const GARAGE_LOGO_MAX_BYTES = 2 * 1024 * 1024

const EXTENSION_BY_MIME = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
} as const

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export type GarageLogoMime = keyof typeof EXTENSION_BY_MIME

export function isGarageLogoMime(value: string): value is GarageLogoMime {
  return value in EXTENSION_BY_MIME
}

export function garageLogoStoragePath(garageId: string, file: Pick<File, 'type' | 'size'>) {
  if (!UUID_PATTERN.test(garageId)) throw new Error('Invalid garage identifier')
  if (!isGarageLogoMime(file.type)) throw new Error('Unsupported garage logo format')
  if (file.size <= 0 || file.size > GARAGE_LOGO_MAX_BYTES) throw new Error('Invalid garage logo size')

  return `${garageId}/logo.${EXTENSION_BY_MIME[file.type]}`
}
