import { useEffect, useRef, useState } from 'react'
import type { GarmentCategory, WardrobeItem } from '../types/wardrobe'
import { GARMENT_CATALOG, getGarmentInfo, sizeOptionsFor } from '../lib/sizing'
import { classifyGarmentImage, type ClassificationResult } from '../lib/classifyGarment'
import { cutoutToPng } from '../lib/removeBackground'
import { saveItem } from '../lib/db'

interface Props {
  onClose: () => void
  onSaved: () => void
}

type Stage = 'elegir' | 'identificando' | 'revisar' | 'guardando'

export default function UploadModal({ onClose, onSaved }: Props) {
  const [stage, setStage] = useState<Stage>('elegir')
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [classification, setClassification] = useState<ClassificationResult | null>(null)
  const [category, setCategory] = useState<GarmentCategory>('otro')
  const [talla, setTalla] = useState('')
  const [name, setName] = useState('')
  const [colorHex, setColorHex] = useState('#888888')
  const [error, setError] = useState<string | null>(null)
  const [cutoutProgress, setCutoutProgress] = useState(0)
  const imgRef = useRef<HTMLImageElement | null>(null)

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  async function handleFile(f: File) {
    setError(null)
    setFile(f)
    const url = URL.createObjectURL(f)
    setPreviewUrl(url)
    setStage('identificando')

    const img = new Image()
    img.onload = async () => {
      imgRef.current = img
      try {
        const result = await classifyGarmentImage(img)
        setClassification(result)
        setCategory(result.category)
        const info = getGarmentInfo(result.category)
        setName(info.label)
      } catch {
        setError('No se pudo identificar la prenda automáticamente. Elegí la categoría a mano.')
      } finally {
        setStage('revisar')
      }
    }
    img.onerror = () => {
      setError('No se pudo leer la imagen.')
      setStage('elegir')
    }
    img.src = url
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]
    if (f) void handleFile(f)
  }

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) void handleFile(f)
  }

  async function handleSave() {
    if (!file) return
    setStage('guardando')
    setError(null)
    setCutoutProgress(0)
    try {
      const cutout = await cutoutToPng(file, setCutoutProgress)
      const item: WardrobeItem = {
        id: crypto.randomUUID(),
        name: name.trim() || getGarmentInfo(category).label,
        category,
        talla: talla.trim(),
        colorHex,
        createdAt: Date.now(),
        imageBlob: cutout.blob,
        thumbBlob: cutout.thumbBlob,
        width: cutout.width,
        height: cutout.height,
      }
      if (!item.talla) {
        setError('Ingresá una talla antes de guardar.')
        setStage('revisar')
        return
      }
      await saveItem(item)
      onSaved()
      onClose()
    } catch {
      setError('No se pudo guardar la prenda. Probá de nuevo.')
      setStage('revisar')
    }
  }

  const info = getGarmentInfo(category)
  const sizeOptions = sizeOptionsFor(info.sizeSystem)

  useEffect(() => {
    if (classification && imgRef.current && stage === 'revisar') {
      // color por defecto: se recalcula bien recién al recortar, esto es
      // solo una vista previa rápida con el color promedio del centro.
      const img = imgRef.current
      const canvas = document.createElement('canvas')
      canvas.width = 1
      canvas.height = 1
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(img, Math.floor(img.naturalWidth / 2), Math.floor(img.naturalHeight / 2), 1, 1, 0, 0, 1, 1)
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
        setColorHex(`#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-neutral-900 p-6 shadow-xl border border-neutral-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Agregar prenda</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white text-xl leading-none">×</button>
        </div>

        {stage === 'elegir' && (
          <div
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-neutral-600 rounded-xl p-10 text-center cursor-pointer hover:border-violet-400 transition-colors"
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <p className="text-neutral-300">Arrastrá una foto acá o hacé clic para elegirla</p>
            <p className="text-neutral-500 text-sm mt-1">Pantalón, zapatillas, collar, gafas, buzo, campera...</p>
            <input id="file-input" type="file" accept="image/*" className="hidden" onChange={onPickFile} />
          </div>
        )}

        {(stage === 'identificando' || stage === 'revisar' || stage === 'guardando') && previewUrl && (
          <div className="space-y-4">
            <div className="flex gap-4">
              <img src={previewUrl} alt="Vista previa" className="w-32 h-32 object-cover rounded-lg border border-neutral-700" />
              <div className="flex-1 text-sm">
                {stage === 'identificando' && (
                  <p className="text-violet-300 animate-pulse">Identificando la prenda...</p>
                )}
                {stage !== 'identificando' && classification && (
                  <p className="text-neutral-400">
                    Detecté: <span className="text-white">{classification.label}</span>{' '}
                    ({Math.round(classification.confidence * 100)}% de confianza) → sugerido:{' '}
                    <span className="text-violet-300">{getGarmentInfo(category).label}</span>
                  </p>
                )}
                {error && <p className="text-red-400 mt-1">{error}</p>}
              </div>
            </div>

            {stage !== 'identificando' && (
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-sm text-neutral-300">
                  Nombre
                  <input
                    className="rounded-md bg-neutral-800 border border-neutral-700 px-2 py-1.5 text-white"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-neutral-300">
                  Categoría
                  <select
                    className="rounded-md bg-neutral-800 border border-neutral-700 px-2 py-1.5 text-white"
                    value={category}
                    onChange={(e) => {
                      const cat = e.target.value as GarmentCategory
                      setCategory(cat)
                      setTalla('')
                    }}
                  >
                    {GARMENT_CATALOG.map((g) => (
                      <option key={g.category} value={g.category}>{g.label}</option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm text-neutral-300">
                  Talla {info.sizeSystem === 'calzado' ? '(EU)' : info.sizeSystem === 'medida' ? '(cm, opcional)' : ''}
                  {sizeOptions.length > 0 ? (
                    <select
                      className="rounded-md bg-neutral-800 border border-neutral-700 px-2 py-1.5 text-white"
                      value={talla}
                      onChange={(e) => setTalla(e.target.value)}
                    >
                      <option value="">Elegir...</option>
                      {sizeOptions.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className="rounded-md bg-neutral-800 border border-neutral-700 px-2 py-1.5 text-white"
                      placeholder={info.sizeSystem === 'medida' ? 'ej: 45 (cm)' : 'ej: Única'}
                      value={talla}
                      onChange={(e) => setTalla(e.target.value)}
                    />
                  )}
                </label>
                <label className="flex flex-col gap-1 text-sm text-neutral-300">
                  Color
                  <input
                    type="color"
                    className="rounded-md bg-neutral-800 border border-neutral-700 h-9 px-1"
                    value={colorHex}
                    onChange={(e) => setColorHex(e.target.value)}
                  />
                </label>
              </div>
            )}

            {stage === 'guardando' && (
              <p className="text-xs text-neutral-500">
                La primera vez puede tardar un poco (descarga el modelo de IA de recorte).
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={onClose} className="px-4 py-2 rounded-md text-neutral-300 hover:text-white">Cancelar</button>
              <button
                onClick={handleSave}
                disabled={stage === 'identificando' || stage === 'guardando'}
                className="px-4 py-2 rounded-md bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-medium"
              >
                {stage === 'guardando'
                  ? `Recortando con IA... ${Math.round(cutoutProgress * 100)}%`
                  : 'Guardar en el armario'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
