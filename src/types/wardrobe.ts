// Categorías de prendas que la app reconoce y organiza en el armario.
export type GarmentCategory =
  | 'remera'
  | 'buzo'
  | 'campera'
  | 'camisa'
  | 'pantalon'
  | 'falda'
  | 'vestido'
  | 'zapatillas'
  | 'gorra'
  | 'gafas'
  | 'collar'
  | 'cinturon'
  | 'bufanda'
  | 'bolso'
  | 'otro'

// A qué "franja" del cuerpo/slot de outfit pertenece cada categoría.
export type OutfitSlot =
  | 'cabeza'
  | 'ojos'
  | 'cuello'
  | 'torsoSuperior'
  | 'torsoCompleto'
  | 'torsoInferior'
  | 'calzado'
  | 'accesorio'

// Sistema de talla usado por cada slot, define qué escala de tallas aplica.
export type SizeSystem = 'ropa' | 'calzado' | 'medida' | 'libre'

export interface GarmentTypeInfo {
  category: GarmentCategory
  label: string
  slot: OutfitSlot
  sizeSystem: SizeSystem
}

export interface WardrobeItem {
  id: string
  name: string
  category: GarmentCategory
  talla: string
  colorHex: string
  createdAt: number
  // PNG ya recortado (fondo removido cuando fue posible), guardado como blob.
  imageBlob: Blob
  thumbBlob: Blob
  width: number
  height: number
}

export interface OutfitItemPlacement {
  itemId: string
  x: number
  y: number
  // Ancho de renderizado en % del ancho del contenedor (ya incluye el
  // factor de escala por talla), para que se vea igual en el armador y en
  // la galería de outfits guardados.
  width: number
}

export interface Outfit {
  id: string
  name: string
  createdAt: number
  placements: OutfitItemPlacement[]
}

export type BodyGender = 'masculino' | 'femenino' | 'neutro'

export interface SizeProfile {
  tallaSuperior: string
  tallaInferior: string
  tallaCalzado: string
  // Datos corporales usados para ajustar la forma y el tamaño del maniquí
  // y de las prendas al armar el outfit.
  altura: number // cm
  peso: number // kg
  genero: BodyGender
}
