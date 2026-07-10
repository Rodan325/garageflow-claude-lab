import type { GarageCenter } from '@/types/domain'

/**
 * Return the selected center ONLY if it exists, is active AND belongs to the
 * current garage; otherwise null. This is the single guard that prevents ever
 * using / sending a stale center or one from another garage.
 */
export function pickValidCenter(
  centers: GarageCenter[] | undefined,
  selectedId: string | null | undefined,
  garageId: string | null | undefined,
): GarageCenter | null {
  if (!centers || !selectedId || !garageId) return null
  const c = centers.find((x) => x.id === selectedId)
  if (!c || !c.is_active || c.garage_id !== garageId) return null
  return c
}
