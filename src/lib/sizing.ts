import type {
  GarmentCategory,
  GarmentTypeInfo,
  OutfitSlot,
  SizeProfile,
  SizeSystem,
} from '../types/wardrobe'

// Catálogo de tipos de prenda: a qué slot del outfit pertenecen y qué
// sistema de tallas usan para poder compararlas/escalarlas entre sí.
export const GARMENT_CATALOG: GarmentTypeInfo[] = [
  { category: 'remera', label: 'Remera', slot: 'torsoSuperior', sizeSystem: 'ropa' },
  { category: 'buzo', label: 'Buzo', slot: 'torsoSuperior', sizeSystem: 'ropa' },
  { category: 'campera', label: 'Campera', slot: 'torsoSuperior', sizeSystem: 'ropa' },
  { category: 'camisa', label: 'Camisa', slot: 'torsoSuperior', sizeSystem: 'ropa' },
  { category: 'pantalon', label: 'Pantalón', slot: 'torsoInferior', sizeSystem: 'ropa' },
  { category: 'falda', label: 'Falda', slot: 'torsoInferior', sizeSystem: 'ropa' },
  { category: 'vestido', label: 'Vestido', slot: 'torsoCompleto', sizeSystem: 'ropa' },
  { category: 'zapatillas', label: 'Zapatillas / Calzado', slot: 'calzado', sizeSystem: 'calzado' },
  { category: 'gorra', label: 'Gorra', slot: 'cabeza', sizeSystem: 'libre' },
  { category: 'gafas', label: 'Gafas', slot: 'ojos', sizeSystem: 'libre' },
  { category: 'collar', label: 'Collar', slot: 'cuello', sizeSystem: 'medida' },
  { category: 'cinturon', label: 'Cinturón', slot: 'accesorio', sizeSystem: 'medida' },
  { category: 'bufanda', label: 'Bufanda', slot: 'accesorio', sizeSystem: 'libre' },
  { category: 'bolso', label: 'Bolso', slot: 'accesorio', sizeSystem: 'libre' },
  { category: 'otro', label: 'Otro', slot: 'accesorio', sizeSystem: 'libre' },
]

export function getGarmentInfo(category: GarmentCategory): GarmentTypeInfo {
  return GARMENT_CATALOG.find((g) => g.category === category) ?? GARMENT_CATALOG[GARMENT_CATALOG.length - 1]
}

// Escala estándar de talla de ropa, de menor a mayor.
export const ROPA_SIZES = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']

// Tallas de calzado EU habituales.
export const CALZADO_SIZES = Array.from({ length: 15 }, (_, i) => String(34 + i))

export function sizeOptionsFor(system: SizeSystem): string[] {
  if (system === 'ropa') return ROPA_SIZES
  if (system === 'calzado') return CALZADO_SIZES
  return []
}

// Convierte una talla a un número comparable dentro de su propio sistema.
// Devuelve null si no se puede comparar (tallas libres/medidas sin número).
function sizeToNumber(talla: string, system: SizeSystem): number | null {
  const clean = talla.trim().toUpperCase()
  if (!clean) return null
  if (system === 'ropa') {
    const idx = ROPA_SIZES.indexOf(clean)
    if (idx >= 0) return idx
    // por si escriben un número de talla de ropa (38, 40, 42...)
    const n = Number(clean)
    return Number.isFinite(n) ? n : null
  }
  if (system === 'calzado' || system === 'medida') {
    const n = Number(clean.replace(',', '.'))
    return Number.isFinite(n) ? n : null
  }
  return null
}

export type SizeMatch = 'igual' | 'cercana' | 'distinta' | 'sinDatos'

// Compara la talla de una prenda contra la talla de referencia del perfil
// (mismo sistema) y devuelve qué tan compatible es.
export function compareSizes(
  itemTalla: string,
  refTalla: string,
  system: SizeSystem,
): SizeMatch {
  const a = sizeToNumber(itemTalla, system)
  const b = sizeToNumber(refTalla, system)
  if (a === null || b === null) return 'sinDatos'
  const diff = Math.abs(a - b)
  if (diff === 0) return 'igual'
  if (system === 'ropa' && diff <= 1) return 'cercana'
  if (system !== 'ropa' && diff <= 1) return 'cercana'
  return 'distinta'
}

// Factor de escala visual (0.85 - 1.15) para renderizar la prenda en el
// canvas de outfit según qué tan grande es su talla respecto al centro de
// la escala de su sistema. Así una L se ve un poco más grande que una S.
export function visualScaleFor(talla: string, system: SizeSystem): number {
  if (system === 'ropa') {
    const idx = sizeToNumber(talla, 'ropa')
    if (idx === null) return 1
    const mid = (ROPA_SIZES.length - 1) / 2
    const step = 0.06
    return clamp(1 + (idx - mid) * step, 0.8, 1.25)
  }
  if (system === 'calzado') {
    const n = sizeToNumber(talla, 'calzado')
    if (n === null) return 1
    const mid = 40
    const step = 0.02
    return clamp(1 + (n - mid) * step, 0.85, 1.2)
  }
  return 1
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

export function referenceTallaFor(slot: OutfitSlot, profile: SizeProfile): string {
  if (slot === 'torsoSuperior' || slot === 'torsoCompleto') return profile.tallaSuperior
  if (slot === 'torsoInferior') return profile.tallaInferior
  if (slot === 'calzado') return profile.tallaCalzado
  return ''
}

export const DEFAULT_SIZE_PROFILE: SizeProfile = {
  tallaSuperior: 'M',
  tallaInferior: 'M',
  tallaCalzado: '40',
  altura: 170,
  peso: 65,
  genero: 'neutro',
}

const REFERENCE_HEIGHT_CM = 170
const REFERENCE_BMI = 21

export interface BodyScale {
  heightScale: number
  widthScale: number
}

// Deriva del perfil corporal (altura/peso) un factor de escala vertical
// (altura) y uno horizontal (contextura, a partir del IMC respecto a un
// valor de referencia) para estirar/angostar el maniquí y las prendas.
export function computeBodyScale(profile: SizeProfile): BodyScale {
  const altura = profile.altura > 0 ? profile.altura : REFERENCE_HEIGHT_CM
  const peso = profile.peso > 0 ? profile.peso : 65

  const heightScale = clamp(altura / REFERENCE_HEIGHT_CM, 0.82, 1.2)

  const bmi = peso / (altura / 100) ** 2
  const widthScale = clamp(1 + (bmi - REFERENCE_BMI) * 0.025, 0.8, 1.35)

  return { heightScale, widthScale }
}
