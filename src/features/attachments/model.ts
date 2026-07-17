export type AttachmentVisibility = 'internal' | 'customer' | 'both'
export type AttachmentDocumentType = 'photo' | 'video' | 'diagnostic' | 'quote' | 'invoice' | 'report' | 'other'

export interface ServiceRequestAttachment {
  id: string
  garage_id: string
  center_id: string | null
  service_request_id: string
  recommendation_id: string | null
  uploaded_by: string | null
  file_name: string
  mime_type: string
  file_size: number
  storage_path: string
  visibility: AttachmentVisibility
  document_type: AttachmentDocumentType
  created_at: string
}

export const ATTACHMENT_MAX_BYTES = 25 * 1024 * 1024
export const ATTACHMENT_MAX_PER_REQUEST = 20
export const ATTACHMENT_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/webp',
  'video/mp4', 'video/quicktime',
  'application/pdf', 'text/plain', 'text/csv',
] as const
const EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'mp4', 'mov', 'pdf', 'txt', 'csv']

export function validateAttachment(file: Pick<File, 'name' | 'size' | 'type'>, currentCount = 0): string | null {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (!EXTENSIONS.includes(extension) || !ATTACHMENT_MIME_TYPES.includes(file.type as (typeof ATTACHMENT_MIME_TYPES)[number])) {
    return 'unsupported_type'
  }
  if (file.size <= 0 || file.size > ATTACHMENT_MAX_BYTES) return 'invalid_size'
  if (currentCount >= ATTACHMENT_MAX_PER_REQUEST) return 'limit_reached'
  return null
}

export function safeAttachmentName(name: string) {
  const normalized = name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
  return normalized.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^[.-]+|[.-]+$/g, '').slice(0, 120) || 'file'
}
