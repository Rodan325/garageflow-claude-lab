import type { Lang } from './index'
import { translate } from './catalog'
import {
  CLIENT_STAGE_META, QUOTE_STATUS_META, REPAIR_STATUS_META, REQUEST_STATUS_META, ROLE_LABEL, WEEKDAY_LABEL,
  type ClientStage, type GarageRole, type QuoteStatus, type RepairStatus, type RequestStatus,
} from '@/types/domain'

export function quoteStatusMeta(status: QuoteStatus, lang: Lang) {
  const meta = QUOTE_STATUS_META[status]
  return { ...meta, label: translate(lang, meta.label) }
}

export function requestStatusMeta(status: RequestStatus, lang: Lang) {
  const meta = REQUEST_STATUS_META[status]
  return { ...meta, label: translate(lang, meta.label) }
}

export function clientStageMeta(stage: ClientStage, lang: Lang) {
  const meta = CLIENT_STAGE_META[stage]
  return { ...meta, label: translate(lang, meta.label) }
}

export function repairStatusMeta(status: RepairStatus, lang: Lang) {
  const meta = REPAIR_STATUS_META[status]
  return { ...meta, label: translate(lang, meta.label) }
}

export function roleLabel(role: GarageRole, lang: Lang) {
  return translate(lang, ROLE_LABEL[role])
}

export function weekdayLabel(day: number, lang: Lang) {
  return translate(lang, WEEKDAY_LABEL[day] ?? '')
}
