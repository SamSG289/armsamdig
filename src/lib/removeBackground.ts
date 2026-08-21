// Recorte de fondo "best effort", 100% en el navegador con Canvas 2D.
// Asume que la foto tiene un fondo relativamente uniforme (mesa, percha,
// pared lisa) alrededor de la prenda -eso es lo típico al fotografiar ropa-
// y vuelve transparentes los píxeles parecidos al color del borde, con un
// degradé suave en el límite para que no quede un recorte con bordes duros.

const MAX_DIM = 1024

interface RgbColor {
  r: number
  g: number
  b: number
}

function colorDistance(a: RgbColor, b: RgbColor): number {
  const dr = a.r - b.r
  const dg = a.g - b.g
  const db = a.b - b.b
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

export interface CutoutResult {
  blob: Blob
  thumbBlob: Blob
  width: number
  height: number
  dominantHex: string
}

export async function cutoutToPng(image: HTMLImageElement): Promise<CutoutResult> {
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

  // Umbral de "qué tan parecido al fondo" cuenta como fondo, con una zona
  // de transición para suavizar el borde del recorte.
  const threshold = 42
  const feather = 28

  let fgR = 0
  let fgG = 0
  let fgB = 0
  let fgCount = 0

  for (let i = 0; i < data.length; i += 4) {
    const px: RgbColor = { r: data[i], g: data[i + 1], b: data[i + 2] }
    const dist = colorDistance(px, bg)
    if (dist < threshold) {
      data[i + 3] = 0
    } else if (dist < threshold + feather) {
      const alphaFactor = (dist - threshold) / feather
      data[i + 3] = Math.round(data[i + 3] * alphaFactor)
    }
    if (data[i + 3] > 200) {
      fgR += px.r
      fgG += px.g
      fgB += px.b
      fgCount++
    }
  }

  ctx.putImageData(imageData, 0, 0)

  const dominantHex = fgCount > 0
    ? rgbToHex(fgR / fgCount, fgG / fgCount, fgB / fgCount)
    : rgbToHex(bg.r, bg.g, bg.b)

  const blob = await canvasToPngBlob(canvas)
  const thumbBlob = await canvasToPngBlob(resizeCanvas(canvas, 300))

  return { blob, thumbBlob, width, height, dominantHex }
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
