import type { OutfitSlot } from '../types/wardrobe'

// Slots que la UI del armador expone. 'torso' agrupa torsoSuperior y
// torsoCompleto (remera/buzo/campera/camisa vs. vestido) porque son
// mutuamente excluyentes en un mismo outfit.
export type UiSlot = 'cabeza' | 'ojos' | 'cuello' | 'torso' | 'torsoInferior' | 'calzado' | 'accesorio'

export const UI_SLOTS: UiSlot[] = ['cabeza', 'ojos', 'cuello', 'torso', 'torsoInferior', 'calzado', 'accesorio']

export const UI_SLOT_LABEL: Record<UiSlot, string> = {
  cabeza: 'Cabeza',
  ojos: 'Ojos',
  cuello: 'Cuello',
  torso: 'Torso',
  torsoInferior: 'Parte inferior',
  calzado: 'Calzado',
  accesorio: 'Accesorios',
}

export function garmentSlotToUiSlot(slot: OutfitSlot): UiSlot {
  if (slot === 'torsoSuperior' || slot === 'torsoCompleto') return 'torso'
  return slot as UiSlot
}

// Posición y ancho base (en % del contenedor) de cada slot, calculados
// para coincidir con las proporciones del maniquí 2D (ver Mannequin.tsx,
// mismo viewBox 300x400 = misma proporción 3:4 que este contenedor). El
// ancho final se multiplica por el factor de escala derivado de la talla
// de cada prenda.
export const SLOT_LAYOUT: Record<UiSlot, { top: number; left: number; baseWidth: number; z: number }> = {
  cabeza: { top: 6, left: 50, baseWidth: 24, z: 6 },
  ojos: { top: 11, left: 50, baseWidth: 16, z: 7 },
  cuello: { top: 19, left: 50, baseWidth: 11, z: 5 },
  torso: { top: 42, left: 50, baseWidth: 46, z: 2 },
  torsoInferior: { top: 78, left: 50, baseWidth: 36, z: 1 },
  calzado: { top: 94, left: 50, baseWidth: 34, z: 1 },
  accesorio: { top: 58, left: 80, baseWidth: 16, z: 4 },
}
