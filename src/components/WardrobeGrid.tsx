import { useMemo, useState } from 'react'
import type { SizeProfile, WardrobeItem } from '../types/wardrobe'
import { GARMENT_CATALOG, compareSizes, getGarmentInfo, referenceTallaFor } from '../lib/sizing'
import ItemThumb from './ItemThumb'

interface Props {
  items: WardrobeItem[]
  sizeProfile: SizeProfile
  onDelete: (id: string) => void
}

const MATCH_STYLE: Record<string, string> = {
  igual: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  cercana: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  distinta: 'bg-red-500/20 text-red-300 border-red-500/40',
  sinDatos: 'bg-neutral-700/40 text-neutral-400 border-neutral-600',
}

export default function WardrobeGrid({ items, sizeProfile, onDelete }: Props) {
  const [filter, setFilter] = useState<string>('todas')

  const filtered = useMemo(() => {
    if (filter === 'todas') return items
    return items.filter((i) => i.category === filter)
  }, [items, filter])

  if (items.length === 0) {
    return (
      <div className="text-center py-16 text-neutral-500">
        Tu armario está vacío. Subí una foto de una prenda para empezar.
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        <FilterChip label="Todas" active={filter === 'todas'} onClick={() => setFilter('todas')} />
        {GARMENT_CATALOG.map((g) => (
          <FilterChip key={g.category} label={g.label} active={filter === g.category} onClick={() => setFilter(g.category)} />
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filtered.map((item) => (
          <ItemCard key={item.id} item={item} sizeProfile={sizeProfile} onDelete={onDelete} />
        ))}
      </div>
    </div>
  )
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-sm border transition-colors ${
        active ? 'bg-violet-600 border-violet-600 text-white' : 'border-neutral-700 text-neutral-300 hover:border-neutral-500'
      }`}
    >
      {label}
    </button>
  )
}

function ItemCard({ item, sizeProfile, onDelete }: { item: WardrobeItem; sizeProfile: SizeProfile; onDelete: (id: string) => void }) {
  const info = getGarmentInfo(item.category)
  const ref = referenceTallaFor(info.slot, sizeProfile)
  const match = ref ? compareSizes(item.talla, ref, info.sizeSystem) : 'sinDatos'

  return (
    <div className="group relative rounded-xl border border-neutral-800 bg-neutral-900 p-3 flex flex-col gap-2">
      <button
        onClick={() => onDelete(item.id)}
        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-neutral-300 hover:text-white hover:bg-red-600/80 opacity-0 group-hover:opacity-100 transition-opacity text-sm"
        title="Eliminar"
      >
        ×
      </button>
      <div className="aspect-square rounded-lg bg-neutral-950 flex items-center justify-center overflow-hidden">
        <ItemThumb blob={item.thumbBlob} alt={item.name} className="max-w-full max-h-full object-contain" />
      </div>
      <div>
        <p className="text-sm text-white truncate">{item.name}</p>
        <p className="text-xs text-neutral-500">{info.label}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs px-2 py-0.5 rounded-full border border-neutral-700 text-neutral-300">Talla {item.talla}</span>
        {ref && (
          <span className={`text-xs px-2 py-0.5 rounded-full border ${MATCH_STYLE[match]}`}>
            {match === 'igual' && 'Coincide'}
            {match === 'cercana' && 'Cercana'}
            {match === 'distinta' && 'No coincide'}
            {match === 'sinDatos' && 'Sin datos'}
          </span>
        )}
      </div>
    </div>
  )
}
