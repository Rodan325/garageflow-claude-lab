import type { Lang } from './index'
import { translate } from './catalog'
import {
  CLIENT_STAGE_META, QUOTE_STATUS_META, REPAIR_STATUS_META, REQUEST_STATUS_META, ROLE_LABEL, WEEKDAY_LABEL,
  type CenterRole, type ClientStage, type GarageRole, type OrganizationRole, type QuoteStatus, type RepairStatus, type RequestStatus,
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

const ORGANIZATION_ROLE_LABEL: Record<OrganizationRole, string> = {
  organization_owner: 'Propriétaire de l’organisation',
  network_admin: 'Administrateur réseau',
  regional_manager: 'Responsable régional',
  viewer: 'Observateur',
}

const CENTER_ROLE_LABEL: Record<CenterRole, string> = {
  center_manager: 'Responsable d’établissement',
  service_advisor: 'Conseiller service',
  front_desk: 'Accueil',
  technician: 'Technicien',
  viewer: 'Observateur',
}

export function organizationRoleLabel(role: OrganizationRole, lang: Lang) {
  return translate(lang, ORGANIZATION_ROLE_LABEL[role])
}

export function centerRoleLabel(role: CenterRole, lang: Lang) {
  return translate(lang, CENTER_ROLE_LABEL[role])
}

export function weekdayLabel(day: number, lang: Lang) {
  return translate(lang, WEEKDAY_LABEL[day] ?? '')
}
