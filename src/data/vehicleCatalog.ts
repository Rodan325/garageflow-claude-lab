/**
 * Local, extensible vehicle reference used to SUGGEST (never force) a clean
 * brand/model/fuel/year at entry. No external/paid API, no API key in the
 * frontend. Covers the main brands sold in Europe + common models; extend the
 * map freely. Free text is always allowed — we only nudge toward clean data.
 */

export const FUELS = [
  'Essence', 'Diesel', 'Hybride', 'Hybride rechargeable', 'Électrique', 'GPL', 'E85', 'Autre',
] as const
export type Fuel = (typeof FUELS)[number]

export const CURRENT_YEAR = new Date().getFullYear()
export const MIN_YEAR = 1950
export const MAX_YEAR = CURRENT_YEAR + 1

/** brand → common models (V1: extend as needed). */
export const VEHICLE_CATALOG: Record<string, string[]> = {
  'Alfa Romeo': ['Giulia', 'Giulietta', 'Stelvio', 'Tonale'],
  Audi: ['A1', 'A3', 'A4', 'A5', 'A6', 'Q2', 'Q3', 'Q5', 'Q7', 'e-tron'],
  BMW: ['Série 1', 'Série 2', 'Série 3', 'Série 4', 'Série 5', 'X1', 'X2', 'X3', 'X5', 'i4'],
  Citroën: ['C1', 'C3', 'C3 Aircross', 'C4', 'C4 X', 'C5 Aircross', 'Berlingo', 'ë-C4'],
  Dacia: ['Sandero', 'Duster', 'Jogger', 'Spring', 'Logan'],
  DS: ['DS 3', 'DS 4', 'DS 7', 'DS 9'],
  Fiat: ['500', '500X', 'Panda', 'Tipo', 'Doblo'],
  Ford: ['Fiesta', 'Focus', 'Puma', 'Kuga', 'Mondeo', 'Transit', 'Transit Custom'],
  Honda: ['Jazz', 'Civic', 'HR-V', 'CR-V'],
  Hyundai: ['i10', 'i20', 'i30', 'Kona', 'Tucson', 'Santa Fe', 'Ioniq 5'],
  Jaguar: ['XE', 'XF', 'E-Pace', 'F-Pace', 'I-Pace'],
  Jeep: ['Renegade', 'Compass', 'Avenger'],
  Kia: ['Picanto', 'Rio', 'Ceed', 'Stonic', 'Sportage', 'Niro', 'EV6'],
  'Land Rover': ['Defender', 'Discovery', 'Range Rover', 'Range Rover Evoque'],
  Mazda: ['Mazda2', 'Mazda3', 'CX-3', 'CX-5', 'MX-30'],
  'Mercedes-Benz': ['Classe A', 'Classe B', 'Classe C', 'Classe E', 'CLA', 'GLA', 'GLC', 'Vito'],
  MINI: ['Cooper', 'Clubman', 'Countryman'],
  Nissan: ['Micra', 'Juke', 'Qashqai', 'X-Trail', 'Leaf', 'Ariya'],
  Opel: ['Corsa', 'Astra', 'Mokka', 'Crossland', 'Grandland', 'Combo'],
  Peugeot: ['108', '208', '2008', '308', '3008', '408', '5008', '508', 'Partner', 'Rifter'],
  Porsche: ['911', 'Cayenne', 'Macan', 'Panamera', 'Taycan'],
  Renault: ['Twingo', 'Clio', 'Captur', 'Mégane', 'Scénic', 'Kadjar', 'Austral', 'Arkana', 'Kangoo', 'Trafic'],
  Seat: ['Ibiza', 'Leon', 'Arona', 'Ateca'],
  Škoda: ['Fabia', 'Octavia', 'Scala', 'Kamiq', 'Karoq', 'Kodiaq', 'Enyaq'],
  Smart: ['Fortwo', 'Forfour', '#1'],
  Suzuki: ['Swift', 'Ignis', 'Vitara', 'S-Cross'],
  Tesla: ['Model 3', 'Model Y', 'Model S', 'Model X'],
  Toyota: ['Aygo', 'Yaris', 'Yaris Cross', 'Corolla', 'C-HR', 'RAV4'],
  Volkswagen: ['Polo', 'Golf', 'T-Roc', 'T-Cross', 'Tiguan', 'Passat', 'Touran', 'Caddy', 'ID.3', 'ID.4'],
  Volvo: ['XC40', 'XC60', 'XC90', 'V40', 'V60', 'EX30'],
}

export const VEHICLE_BRANDS = Object.keys(VEHICLE_CATALOG).sort((a, b) => a.localeCompare(b, 'fr'))

const canon = (s: string) => (s ?? '').trim().toLowerCase().replace(/\s+/g, ' ')

/** Canonical brand if recognized (exact then prefix, accent/case-insensitive), else null. */
export function matchBrand(input: string): string | null {
  const q = canon(input)
  if (!q) return null
  return (
    VEHICLE_BRANDS.find((b) => canon(b) === q) ??
    VEHICLE_BRANDS.find((b) => canon(b).startsWith(q)) ??
    null
  )
}

export const isKnownBrand = (input: string): boolean =>
  canon(input) !== '' && VEHICLE_BRANDS.some((b) => canon(b) === canon(input))

/** Models for a (possibly fuzzy) brand. */
export function modelsForBrand(brand: string): string[] {
  const b = matchBrand(brand)
  return b ? VEHICLE_CATALOG[b] : []
}

/** Title-case free text ("PEUGEOT 208" → "Peugeot 208"). */
export function titleCaseVehicle(s: string): string {
  return (s ?? '').trim().replace(/\s+/g, ' ').replace(/\p{L}+/gu, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
}

/** Canonical brand if known, otherwise a clean title-cased version of the input. */
export function normalizeBrand(input: string): string {
  return matchBrand(input) ?? titleCaseVehicle(input)
}

/** Validation message for a year, or null if empty/valid. */
export function yearError(year: string | number | null | undefined): string | null {
  if (year === '' || year == null) return null // optional
  const n = Number(year)
  if (!Number.isInteger(n) || n < MIN_YEAR || n > MAX_YEAR) return `Année entre ${MIN_YEAR} et ${MAX_YEAR}.`
  return null
}

/** Submit-blocking validation for a vehicle form: brand/model required (if
 *  `required`) + no absurd year. Returns a message or null. */
export function vehicleFieldsError(
  v: { brand: string; model: string; year: string; fuel?: string },
  required = true,
): string | null {
  if (required && (!v.brand.trim() || !v.model.trim())) return 'Renseignez la marque et le modèle.'
  return yearError(v.year)
}
