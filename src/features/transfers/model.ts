import type { GarageCenter, ServiceRequest } from '@/types/domain'

export type CenterTransferStatus = 'proposed' | 'customer_confirmed' | 'completed' | 'cancelled'
export type CenterTransferAction = 'confirm' | 'decline' | 'complete'

export interface ServiceRequestTransfer {
  id: string
  garage_id: string
  service_request_id: string
  from_center_id: string
  to_center_id: string
  status: CenterTransferStatus
  requested_by: string
  reason: string | null
  created_at: string
  customer_confirmed_at: string | null
  completed_at: string | null
}

export interface ServiceRequestTransferEvent {
  id: string
  transfer_id: string
  garage_id: string
  previous_status: CenterTransferStatus | null
  new_status: CenterTransferStatus
  changed_by: string
  occurred_at: string
  note: string | null
}

export function assertTransferScope(
  request: Pick<ServiceRequest, 'garage_id' | 'center_id'>,
  source: Pick<GarageCenter, 'id' | 'garage_id' | 'is_active'>,
  destination: Pick<GarageCenter, 'id' | 'garage_id' | 'is_active'>,
) {
  if (!request.center_id || request.center_id !== source.id) {
    throw new Error('TRANSFER_SOURCE_MISMATCH')
  }
  if (source.garage_id !== request.garage_id || destination.garage_id !== request.garage_id) {
    throw new Error('TRANSFER_CROSS_ORGANIZATION')
  }
  if (!source.is_active || !destination.is_active) {
    throw new Error('TRANSFER_CENTER_INACTIVE')
  }
  if (source.id === destination.id) {
    throw new Error('TRANSFER_SAME_CENTER')
  }
}

export function transitionTransferStatus(
  current: CenterTransferStatus,
  action: CenterTransferAction,
): CenterTransferStatus {
  if (current === 'proposed' && action === 'confirm') return 'customer_confirmed'
  if (current === 'proposed' && action === 'decline') return 'cancelled'
  if (current === 'customer_confirmed' && action === 'complete') return 'completed'
  throw new Error(`INVALID_TRANSFER_TRANSITION:${current}:${action}`)
}
