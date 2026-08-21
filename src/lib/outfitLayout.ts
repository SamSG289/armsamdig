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

// Posición y ancho base (en % del contenedor) de cada slot dentro del
// "maniquí" visual. El ancho final se multiplica por el factor de escala
// derivado de la talla de cada prenda.
export const SLOT_LAYOUT: Record<UiSlot, { top: number; left: number; baseWidth: number; z: number }> = {
  cabeza: { top: 4, left: 50, baseWidth: 26, z: 5 },
  ojos: { top: 15, left: 50, baseWidth: 22, z: 6 },
  cuello: { top: 25, left: 50, baseWidth: 16, z: 4 },
  torso: { top: 32, left: 50, baseWidth: 52, z: 2 },
  torsoInferior: { top: 63, left: 50, baseWidth: 42, z: 1 },
  calzado: { top: 88, left: 50, baseWidth: 38, z: 1 },
  accesorio: { top: 40, left: 84, baseWidth: 18, z: 3 },
}
