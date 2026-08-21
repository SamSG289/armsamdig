import { useMemo, useState } from 'react'
import type { Outfit, OutfitItemPlacement, SizeProfile, WardrobeItem } from '../types/wardrobe'
import { compareSizes, getGarmentInfo, referenceTallaFor, visualScaleFor } from '../lib/sizing'
import { garmentSlotToUiSlot, SLOT_LAYOUT, UI_SLOT_LABEL, UI_SLOTS, type UiSlot } from '../lib/outfitLayout'
import { saveOutfit } from '../lib/db'
import ItemThumb from './ItemThumb'
import Mannequin from './Mannequin'

interface Props {
  items: WardrobeItem[]
  sizeProfile: SizeProfile
  onSaved: () => void
}

const MATCH_DOT: Record<string, string> = {
  igual: 'bg-emerald-400',
  cercana: 'bg-amber-400',
  distinta: 'bg-red-400',
  sinDatos: 'bg-neutral-500',
}

export default function OutfitBuilder({ items, sizeProfile, onSaved }: Props) {
  const [selection, setSelection] = useState<Partial<Record<UiSlot, string[]>>>({})
  const [openSlot, setOpenSlot] = useState<UiSlot | null>(null)
  const [outfitName, setOutfitName] = useState('')
  const [saving, setSaving] = useState(false)

  const itemsBySlot = useMemo(() => {
    const map: Record<UiSlot, WardrobeItem[]> = { cabeza: [], ojos: [], cuello: [], torso: [], torsoInferior: [], calzado: [], accesorio: [] }
    for (const item of items) {
      const uiSlot = garmentSlotToUiSlot(getGarmentInfo(item.category).slot)
      map[uiSlot].push(item)
    }
    return map
  }, [items])

  const itemById = useMemo(() => new Map(items.map((i) => [i.id, i])), [items])

  function toggleItem(slot: UiSlot, itemId: string, multi: boolean) {
    setSelection((prev) => {
      const current = prev[slot] ?? []
      if (multi) {
        const exists = current.includes(itemId)
        return { ...prev, [slot]: exists ? current.filter((id) => id !== itemId) : [...current, itemId] }
      }
      return { ...prev, [slot]: current[0] === itemId ? [] : [itemId] }
    })
  }

  const isDress = (selection.torso ?? []).some((id) => itemById.get(id)?.category === 'vestido')

  async function handleSave() {
    setSaving(true)
    try {
      const placements: OutfitItemPlacement[] = []
      for (const slot of UI_SLOTS) {
        if (slot === 'torsoInferior' && isDress) continue
        const ids = selection[slot] ?? []
        const layout = SLOT_LAYOUT[slot]
        ids.forEach((itemId, idx) => {
          const item = itemById.get(itemId)
          if (!item) return
          const info = getGarmentInfo(item.category)
          const scale = visualScaleFor(item.talla, info.sizeSystem)
          const offset = slot === 'accesorio' ? idx * 16 : 0
          placements.push({ itemId, x: layout.left, y: layout.top + offset, width: layout.baseWidth * scale })
        })
      }
      const outfit: Outfit = {
        id: crypto.randomUUID(),
        name: outfitName.trim() || 'Mi outfit',
        createdAt: Date.now(),
        placements,
      }
      await saveOutfit(outfit)
      onSaved()
      setSelection({})
      setOutfitName('')
    } finally {
      setSaving(false)
    }
  }

  const hasAnySelection = Object.values(selection).some((ids) => (ids ?? []).length > 0)

  return (
    <div className="grid md:grid-cols-[1fr_320px] gap-6">
      <div className="relative aspect-[3/4] max-w-md mx-auto w-full rounded-2xl bg-neutral-900 border border-neutral-800 overflow-hidden">
        <Mannequin className="absolute inset-0 w-full h-full text-neutral-800" />
        {UI_SLOTS.map((slot) => {
          if (slot === 'torsoInferior' && isDress) return null
          const ids = selection[slot] ?? []
          const layout = SLOT_LAYOUT[slot]
          return ids.map((itemId, idx) => {
            const item = itemById.get(itemId)
            if (!item) return null
            const info = getGarmentInfo(item.category)
            const scale = visualScaleFor(item.talla, info.sizeSystem)
            const width = layout.baseWidth * scale
            const topOffset = slot === 'accesorio' ? idx * 18 : 0
            return (
              <div
                key={itemId}
                className="absolute -translate-x-1/2 -translate-y-1/2 transition-all"
                style={{ left: `${layout.left}%`, top: `${layout.top + topOffset}%`, width: `${width}%`, zIndex: layout.z }}
              >
                <ItemThumb blob={item.thumbBlob} alt={item.name} className="w-full h-auto object-contain drop-shadow-lg" />
              </div>
            )
          })
        })}
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm text-neutral-500 mb-1">
          Elegí una prenda para cada parte. El tamaño se ajusta solo según la talla de cada una.
        </p>
        {UI_SLOTS.map((slot) => {
          if (slot === 'torsoInferior' && isDress) return null
          const candidates = itemsBySlot[slot]
          const selected = selection[slot] ?? []
          return (
            <div key={slot} className="border border-neutral-800 rounded-lg">
              <button
                onClick={() => setOpenSlot(openSlot === slot ? null : slot)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm text-neutral-200"
              >
                <span>{UI_SLOT_LABEL[slot]}</span>
                <span className="text-neutral-500">
                  {selected.length > 0 ? `${selected.length} elegida(s)` : candidates.length === 0 ? 'sin prendas' : 'elegir'}
                </span>
              </button>
              {openSlot === slot && (
                <div className="border-t border-neutral-800 p-2 max-h-56 overflow-y-auto flex flex-col gap-1">
                  {candidates.length === 0 && (
                    <p className="text-xs text-neutral-600 px-2 py-1">No tenés prendas de este tipo todavía.</p>
                  )}
                  {candidates.map((item) => {
                    const info = getGarmentInfo(item.category)
                    const ref = referenceTallaFor(info.slot, sizeProfile)
                    const match = ref ? compareSizes(item.talla, ref, info.sizeSystem) : 'sinDatos'
                    const active = selected.includes(item.id)
                    return (
                      <button
                        key={item.id}
                        onClick={() => toggleItem(slot, item.id, slot === 'accesorio')}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-sm ${
                          active ? 'bg-violet-600/30 text-white' : 'text-neutral-300 hover:bg-neutral-800'
                        }`}
                      >
                        <ItemThumb blob={item.thumbBlob} alt={item.name} className="w-8 h-8 object-contain rounded bg-neutral-950" />
                        <span className="flex-1 truncate">{item.name}</span>
                        <span className="text-xs text-neutral-500">T.{item.talla}</span>
                        <span className={`w-2 h-2 rounded-full ${MATCH_DOT[match]}`} title={match} />
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}

        <div className="mt-3 flex flex-col gap-2">
          <input
            className="rounded-md bg-neutral-800 border border-neutral-700 px-2 py-1.5 text-white text-sm"
            placeholder="Nombre del outfit (opcional)"
            value={outfitName}
            onChange={(e) => setOutfitName(e.target.value)}
          />
          <button
            onClick={handleSave}
            disabled={!hasAnySelection || saving}
            className="px-4 py-2 rounded-md bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white font-medium text-sm"
          >
            {saving ? 'Guardando...' : 'Guardar outfit'}
          </button>
        </div>
      </div>
    </div>
  )
}
