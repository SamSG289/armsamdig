import type { Outfit, WardrobeItem } from '../types/wardrobe'
import ItemThumb from './ItemThumb'
import Mannequin from './Mannequin'

interface Props {
  outfits: Outfit[]
  items: WardrobeItem[]
  onDelete: (id: string) => void
}

export default function OutfitGallery({ outfits, items, onDelete }: Props) {
  const itemById = new Map(items.map((i) => [i.id, i]))

  if (outfits.length === 0) {
    return <div className="text-center py-16 text-neutral-500">Todavía no guardaste ningún outfit.</div>
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {outfits.map((outfit) => (
        <div key={outfit.id} className="group relative rounded-xl border border-neutral-800 bg-neutral-900 p-3">
          <button
            onClick={() => onDelete(outfit.id)}
            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-neutral-300 hover:text-white hover:bg-red-600/80 opacity-0 group-hover:opacity-100 transition-opacity text-sm z-10"
            title="Eliminar"
          >
            ×
          </button>
          <div className="relative aspect-[3/4] rounded-lg bg-neutral-950 overflow-hidden">
            <Mannequin className="absolute inset-0 w-full h-full text-neutral-800" />
            {outfit.placements.map((p) => {
              const item = itemById.get(p.itemId)
              if (!item) return null
              return (
                <div
                  key={p.itemId}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${p.x}%`, top: `${p.y}%`, width: `${p.width}%` }}
                >
                  <ItemThumb blob={item.thumbBlob} alt={item.name} className="w-full h-auto object-contain" />
                </div>
              )
            })}
          </div>
          <p className="text-sm text-white mt-2 truncate">{outfit.name}</p>
        </div>
      ))}
    </div>
  )
}
