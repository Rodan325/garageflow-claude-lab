import type { Lang } from '@/i18n'

export type NotificationChannel = 'in_app' | 'email' | 'sms' | 'push'
export type NotificationStatus = 'pending' | 'processing' | 'simulated' | 'sent' | 'failed' | 'cancelled'
export type NotificationEvent =
  | 'appointment_confirmed'
  | 'vehicle_received'
  | 'approval_required'
  | 'quote_available'
  | 'recommendation_available'
  | 'message_received'
  | 'delivery_time_changed'
  | 'vehicle_ready'
  | 'vehicle_delivered'
  | 'maintenance_reminder'

export interface NotificationOutboxItem {
  id: string
  garage_id: string
  center_id: string | null
  service_request_id: string | null
  recipient_user_id: string | null
  recipient_address: string | null
  channel: NotificationChannel
  template_key: NotificationEvent
  language: Lang
  payload: Record<string, unknown>
  status: NotificationStatus
  provider: string | null
  provider_message_id: string | null
  attempts: number
  scheduled_at: string
  sent_at: string | null
  failed_at: string | null
  error_code: string | null
  created_at: string
}

export interface NotificationMessage {
  recipient: string
  templateKey: NotificationEvent
  language: Lang
  payload: Record<string, unknown>
}

export interface NotificationProvider {
  readonly name: string
  readonly channel: NotificationChannel
  send(message: NotificationMessage): Promise<{ providerMessageId: string }>
}

export class DemoNotificationProvider implements NotificationProvider {
  readonly name = 'demo-simulator'
  constructor(readonly channel: NotificationChannel) {}

  async send(message: NotificationMessage) {
    return { providerMessageId: `simulated-${message.templateKey}-${this.channel}` }
  }
}

export class UnconfiguredNotificationProvider implements NotificationProvider {
  readonly name = 'unconfigured'
  constructor(readonly channel: NotificationChannel) {}

  async send(_message: NotificationMessage): Promise<never> {
    throw new Error(`No ${this.channel} notification provider is configured`)
  }
}
