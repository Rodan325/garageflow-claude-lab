import type { ServiceRequest } from '@/types/domain'

const WRITABLE_REQUEST_STATUSES = new Set<ServiceRequest['status']>([
  'pending',
  'accepted',
  'reschedule_proposed',
  'confirmed',
  'completed',
])

export function isRequestConversationWritable(
  request: Pick<ServiceRequest, 'status' | 'workshop_stage'>,
): boolean {
  return WRITABLE_REQUEST_STATUSES.has(request.status)
    && request.workshop_stage !== 'closed'
}
