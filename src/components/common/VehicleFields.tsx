import { useId } from 'react'
import { Field, Input, Select } from '@/components/ui/input'
import {
  VEHICLE_BRANDS, modelsForBrand, isKnownBrand, yearError, normalizeBrand, titleCaseVehicle,
  FUELS, CURRENT_YEAR,
} from '@/data/vehicleCatalog'
import { useLang } from '@/i18n'

export interface VehicleFieldsValue {
  brand: string
  model: string
  year: string
  fuel: string
}

/**
 * Reusable brand/model/year/fuel inputs with local suggestions (no external API,
 * no key in the browser). Free text is allowed; we only nudge toward clean data:
 * brand/model type-ahead (datalist), controlled fuel list, year bounds, and a
 * soft "marque non reconnue" hint. Used by client "Mes véhicules", the booking
 * flow, and the garage quick-add — always on the correct table for that space.
 */
export function VehicleFields({
  value, onChange, showYear = true, showFuel = true, required = true,
}: {
  value: VehicleFieldsValue
  onChange: (patch: Partial<VehicleFieldsValue>) => void
  showYear?: boolean
  showFuel?: boolean
  required?: boolean
}) {
  const { tr } = useLang()
  const uid = useId().replace(/:/g, '')
  const brandsId = `brands-${uid}`
  const modelsId = `models-${uid}`
  const models = modelsForBrand(value.brand)
  const q = value.brand.trim().toLowerCase()
  const brandUnknown = q.length >= 2 && !isKnownBrand(value.brand) && !VEHICLE_BRANDS.some((b) => b.toLowerCase().startsWith(q))
  const yearMsg = yearError(value.year)

  return (
    <>
      <datalist id={brandsId}>{VEHICLE_BRANDS.map((b) => <option key={b} value={b} />)}</datalist>
      <datalist id={modelsId}>{models.map((m) => <option key={m} value={m} />)}</datalist>

      <Field
        label={tr('Marque')}
        htmlFor={`${uid}-b`}
        required={required}
        hint={brandUnknown ? tr('Marque non reconnue — vérifiez l’orthographe ou choisissez dans la liste.') : tr('Tapez pour voir des suggestions.')}
      >
        <Input
          id={`${uid}-b`} list={brandsId} value={value.brand} autoComplete="off" placeholder={tr('Peugeot, Renault…')}
          onChange={(e) => onChange({ brand: e.target.value })}
          onBlur={(e) => { const v = e.target.value.trim(); if (v) onChange({ brand: normalizeBrand(v) }) }}
        />
      </Field>

      <Field label={tr('Modèle')} htmlFor={`${uid}-m`} required={required}>
        <Input
          id={`${uid}-m`} list={modelsId} value={value.model} autoComplete="off" placeholder={models[0] ?? tr('208, Clio…')}
          onChange={(e) => onChange({ model: e.target.value })}
          onBlur={(e) => { const v = e.target.value.trim(); if (v) onChange({ model: titleCaseVehicle(v) }) }}
        />
      </Field>

      {showYear && (
        <Field label={tr('Année')} htmlFor={`${uid}-y`} error={yearMsg ? tr(yearMsg) : undefined}>
          <Input
            id={`${uid}-y`} type="number" inputMode="numeric" value={value.year} placeholder={String(CURRENT_YEAR)}
            onChange={(e) => onChange({ year: e.target.value })}
          />
        </Field>
      )}

      {showFuel && (
        <Field label={tr('Carburant')} htmlFor={`${uid}-f`}>
          <Select id={`${uid}-f`} value={value.fuel} onChange={(e) => onChange({ fuel: e.target.value })}>
            <option value="">—</option>
            {FUELS.map((f) => <option key={f} value={f}>{tr(f)}</option>)}
          </Select>
        </Field>
      )}
    </>
  )
}
