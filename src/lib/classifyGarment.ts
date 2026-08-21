import type { MobileNet } from '@tensorflow-models/mobilenet'
import type { GarmentCategory } from '../types/wardrobe'

let modelPromise: Promise<MobileNet> | null = null

// Carga el modelo una sola vez (queda cacheado en memoria para el resto de
// la sesión). Corre 100% en el navegador, no manda la foto a ningún server.
// Se importa de forma diferida para no inflar el bundle inicial de la app.
function getModel(): Promise<MobileNet> {
  if (!modelPromise) {
    modelPromise = Promise.all([
      import('@tensorflow/tfjs'),
      import('@tensorflow-models/mobilenet'),
    ]).then(([, mobilenet]) => mobilenet.load({ version: 2, alpha: 1.0 }))
  }
  return modelPromise
}

// Palabras clave (en inglés, tal como las devuelve MobileNet/ImageNet) que
// mapean cada clase reconocida a una categoría de nuestro armario.
const KEYWORD_MAP: Array<{ keywords: string[]; category: GarmentCategory }> = [
  { category: 'zapatillas', keywords: ['running shoe', 'sneaker', 'loafer', 'sandal', 'clog', 'cowboy boot', 'shoe', 'moccasin'] },
  { category: 'gafas', keywords: ['sunglass', 'sunglasses', 'goggles'] },
  { category: 'collar', keywords: ['necklace', 'bolo tie', 'pendant'] },
  { category: 'gorra', keywords: ['cowboy hat', 'sombrero', 'bathing cap', 'shower cap', 'mortarboard', 'bonnet', 'cap'] },
  { category: 'bufanda', keywords: ['stole', 'shawl', 'muffler'] },
  { category: 'bolso', keywords: ['backpack', 'knapsack', 'rucksack', 'purse', 'mailbag', 'shoulder bag', 'handbag'] },
  { category: 'cinturon', keywords: ['buckle', 'belt'] },
  { category: 'pantalon', keywords: ['jean', 'denim', 'trouser', 'legging'] },
  { category: 'falda', keywords: ['miniskirt', 'skirt', 'hoopskirt', 'crinoline', 'overskirt'] },
  { category: 'vestido', keywords: ['gown', 'kimono', 'abaya', 'sarong', 'dress'] },
  { category: 'buzo', keywords: ['sweatshirt', 'cardigan', 'wool', 'jersey'] },
  { category: 'campera', keywords: ['trench coat', 'poncho', 'fur coat', 'lab coat', 'overcoat', 'cloak'] },
  { category: 'camisa', keywords: ['suit', 'jersey, t-shirt', 'shirt'] },
  { category: 'remera', keywords: ['t-shirt', 'tee shirt', 'jersey'] },
]

export interface ClassificationResult {
  category: GarmentCategory
  label: string
  confidence: number
  raw: Array<{ className: string; probability: number }>
}

export async function classifyGarmentImage(image: HTMLImageElement): Promise<ClassificationResult> {
  const model = await getModel()
  const predictions = await model.classify(image, 5)
  const raw = predictions.map((p) => ({ className: p.className, probability: p.probability }))

  for (const pred of predictions) {
    const name = pred.className.toLowerCase()
    for (const entry of KEYWORD_MAP) {
      if (entry.keywords.some((kw) => name.includes(kw))) {
        return {
          category: entry.category,
          label: pred.className.split(',')[0],
          confidence: pred.probability,
          raw,
        }
      }
    }
  }

  return {
    category: 'otro',
    label: predictions[0]?.className.split(',')[0] ?? 'Desconocido',
    confidence: predictions[0]?.probability ?? 0,
    raw,
  }
}

export function preloadClassifier(): void {
  void getModel()
}
