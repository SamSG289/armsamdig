import type { OutfitSlot } from '../types/wardrobe'
import type { BodyScale } from './sizing'

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

// % vertical del punto de los hombros en el maniquí (ver Mannequin.tsx,
// SHOULDER_Y=90 sobre un viewBox de 400 de alto → 90/400*100). Es el punto
// de anclaje del escalado por altura/contextura: la cabeza no se mueve,
// todo lo que está debajo sí.
const SHOULDER_TOP_PCT = 22.5

// Slots que están "debajo de los hombros" en el cuerpo y por lo tanto
// acompañan el escalado por altura/contextura del perfil (torso hacia
// abajo). Cabeza, ojos y cuello quedan con tamaño fijo, igual que en el
// maniquí.
const BODY_SCALED_SLOTS: ReadonlySet<UiSlot> = new Set(['torso', 'torsoInferior', 'calzado', 'accesorio'])

// Ajusta un top/width ya calculado (por ejemplo el de un slot base, o el
// de una prenda puntual con su propio escalado por talla) según el perfil
// corporal actual (heightScale/widthScale, ver computeBodyScale en
// sizing.ts), para que la ropa acompañe visualmente el tamaño del
// maniquí. Se aplica en el momento de renderizar (no se guarda en el
// outfit), así que si cambiás tu perfil más adelante los outfits ya
// guardados se ven actualizados igual.
export function applyBodyScale(top: number, width: number, slot: UiSlot, bodyScale: BodyScale): { top: number; width: number } {
  if (!BODY_SCALED_SLOTS.has(slot)) return { top, width }
  return {
    top: SHOULDER_TOP_PCT + (top - SHOULDER_TOP_PCT) * bodyScale.heightScale,
    width: width * bodyScale.widthScale,
  }
}
