// Recorte de fondo de la prenda para generar el "modelo" PNG.
//
// Método principal: un modelo de IA (segmentación isnet) que corre 100% en
// el navegador vía @imgly/background-removal (WASM/ONNX, sin servidor, sin
// costo, sin API key). Se importa de forma diferida para no inflar el
// bundle inicial, y la primera vez que se usa descarga sus pesos.
//
// Respaldo: si la IA falla (sin internet para bajar el modelo, navegador
// no compatible, etc.) se usa un recorte por color más simple, para que la
// app nunca deje de funcionar.

const MAX_DIM = 1024

export interface CutoutResult {
  blob: Blob
  thumbBlob: Blob
  width: number
  height: number
  dominantHex: string
  method: 'ia' | 'color'
}

export async function cutoutToPng(
  source: Blob,
  onProgress?: (fraction: number) => void,
): Promise<CutoutResult> {
  let cutoutBlob: Blob
  let method: 'ia' | 'color'

  try {
    cutoutBlob = await aiCutout(source, onProgress)
    method = 'ia'
  } catch (err) {
    console.warn('Recorte con IA no disponible, uso recorte por color de respaldo.', err)
    const image = await blobToImage(source)
    cutoutBlob = await naiveColorCutout(image)
    method = 'color'
  }

  const cutoutImage = await blobToImage(cutoutBlob)
  const { canvas, dominantHex } = drawWithDominantColor(cutoutImage)
  const blob = await canvasToPngBlob(canvas)
  const thumbBlob = await canvasToPngBlob(resizeCanvas(canvas, 300))

  return { blob, thumbBlob, width: canvas.width, height: canvas.height, dominantHex, method }
}

async function aiCutout(source: Blob, onProgress?: (fraction: number) => void): Promise<Blob> {
  const { removeBackground } = await import('@imgly/background-removal')
  const progressTotals = new Map<string, number>()
  return removeBackground(source, {
    model: 'isnet_fp16',
    output: { format: 'image/png' },
    progress: (key, current, total) => {
      if (!onProgress) return
      progressTotals.set(key, total > 0 ? current / total : 0)
      const values = [...progressTotals.values()]
      const avg = values.reduce((a, b) => a + b, 0) / values.length
      onProgress(avg)
    },
  })
}

function blobToImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('No se pudo leer la imagen'))
    }
    img.src = url
  })
}

// Redimensiona a un canvas y calcula el color dominante entre los píxeles
// que quedaron opacos (la prenda), útil tanto para el resultado de la IA
// como para el de respaldo.
function drawWithDominantColor(image: HTMLImageElement): { canvas: HTMLCanvasElement; dominantHex: string } {
  const scale = Math.min(1, MAX_DIM / Math.max(image.naturalWidth, image.naturalHeight))
  const width = Math.round(image.naturalWidth * scale)
  const height = Math.round(image.naturalHeight * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('No se pudo crear el contexto de canvas')
  ctx.drawImage(image, 0, 0, width, height)

  const { data } = ctx.getImageData(0, 0, width, height)
  let r = 0
  let g = 0
  let b = 0
  let count = 0
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] > 200) {
      r += data[i]
      g += data[i + 1]
      b += data[i + 2]
      count++
    }
  }
  const dominantHex = count > 0 ? rgbToHex(r / count, g / count, b / count) : '#888888'
  return { canvas, dominantHex }
}

// Recorte "best effort" por color de borde, sin IA: asume que la foto tiene
// un fondo relativamente uniforme (mesa, percha, pared lisa) alrededor de
// la prenda y vuelve transparentes los píxeles parecidos al color del
// borde, con un degradé suave en el límite.
async function naiveColorCutout(image: HTMLImageElement): Promise<Blob> {
  const scale = Math.min(1, MAX_DIM / Math.max(image.naturalWidth, image.naturalHeight))
  const width = Math.round(image.naturalWidth * scale)
  const height = Math.round(image.naturalHeight * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('No se pudo crear el contexto de canvas')
  ctx.drawImage(image, 0, 0, width, height)

  const imageData = ctx.getImageData(0, 0, width, height)
  const { data } = imageData
  const bg = estimateBackgroundColor(data, width, height)

  const threshold = 42
  const feather = 28

  for (let i = 0; i < data.length; i += 4) {
    const dist = colorDistance(data[i], data[i + 1], data[i + 2], bg)
    if (dist < threshold) {
      data[i + 3] = 0
    } else if (dist < threshold + feather) {
      data[i + 3] = Math.round((data[i + 3] * (dist - threshold)) / feather)
    }
  }

  ctx.putImageData(imageData, 0, 0)
  return canvasToPngBlob(canvas)
}

interface RgbColor {
  r: number
  g: number
  b: number
}

function colorDistance(r: number, g: number, b: number, ref: RgbColor): number {
  const dr = r - ref.r
  const dg = g - ref.g
  const db = b - ref.b
  return Math.sqrt(dr * dr + dg * dg + db * db)
}

function estimateBackgroundColor(data: Uint8ClampedArray, width: number, height: number): RgbColor {
  let r = 0
  let g = 0
  let b = 0
  let count = 0
  const sample = (x: number, y: number) => {
    const i = (y * width + x) * 4
    r += data[i]
    g += data[i + 1]
    b += data[i + 2]
    count++
  }
  const step = Math.max(1, Math.floor(Math.min(width, height) / 100))
  for (let x = 0; x < width; x += step) {
    sample(x, 0)
    sample(x, height - 1)
  }
  for (let y = 0; y < height; y += step) {
    sample(0, y)
    sample(width - 1, y)
  }
  return { r: r / count, g: g / count, b: b / count }
}

function resizeCanvas(source: HTMLCanvasElement, maxDim: number): HTMLCanvasElement {
  const scale = Math.min(1, maxDim / Math.max(source.width, source.height))
  const out = document.createElement('canvas')
  out.width = Math.round(source.width * scale)
  out.height = Math.round(source.height * scale)
  const ctx = out.getContext('2d')
  if (!ctx) throw new Error('No se pudo crear el contexto de canvas')
  ctx.drawImage(source, 0, 0, out.width, out.height)
  return out
}

function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('No se pudo generar el PNG'))
    }, 'image/png')
  })
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.round(clamp(n, 0, 255)).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}
