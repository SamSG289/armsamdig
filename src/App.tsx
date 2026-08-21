import { useEffect, useState } from 'react'
import type { Outfit, SizeProfile, WardrobeItem } from './types/wardrobe'
import { deleteItem, deleteOutfit, getAllItems, getAllOutfits } from './lib/db'
import { loadSizeProfile, saveSizeProfile } from './lib/sizeProfileStore'
import { preloadClassifier } from './lib/classifyGarment'
import UploadModal from './components/UploadModal'
import WardrobeGrid from './components/WardrobeGrid'
import SizeProfileForm from './components/SizeProfileForm'
import OutfitBuilder from './components/OutfitBuilder'
import OutfitGallery from './components/OutfitGallery'

type Tab = 'armario' | 'crear' | 'outfits' | 'perfil'

const TABS: { id: Tab; label: string }[] = [
  { id: 'armario', label: 'Armario' },
  { id: 'crear', label: 'Crear outfit' },
  { id: 'outfits', label: 'Mis outfits' },
  { id: 'perfil', label: 'Mi perfil' },
]

function App() {
  const [tab, setTab] = useState<Tab>('armario')
  const [items, setItems] = useState<WardrobeItem[]>([])
  const [outfits, setOutfits] = useState<Outfit[]>([])
  const [sizeProfile, setSizeProfile] = useState<SizeProfile>(loadSizeProfile())
  const [showUpload, setShowUpload] = useState(false)

  useEffect(() => {
    preloadClassifier()
    void refreshItems()
    void refreshOutfits()
  }, [])

  async function refreshItems() {
    setItems(await getAllItems())
  }

  async function refreshOutfits() {
    setOutfits(await getAllOutfits())
  }

  function updateSizeProfile(profile: SizeProfile) {
    setSizeProfile(profile)
    saveSizeProfile(profile)
  }

  async function handleDeleteItem(id: string) {
    await deleteItem(id)
    void refreshItems()
  }

  async function handleDeleteOutfit(id: string) {
    await deleteOutfit(id)
    void refreshOutfits()
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="border-b border-neutral-800 sticky top-0 bg-neutral-950/90 backdrop-blur z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">👕 Armario Digital</h1>
          {tab === 'armario' && (
            <button
              onClick={() => setShowUpload(true)}
              className="px-4 py-2 rounded-md bg-violet-600 hover:bg-violet-500 text-sm font-medium"
            >
              + Agregar prenda
            </button>
          )}
        </div>
        <nav className="max-w-5xl mx-auto px-4 flex gap-1 pb-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 rounded-md text-sm ${
                tab === t.id ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {tab === 'armario' && <WardrobeGrid items={items} sizeProfile={sizeProfile} onDelete={handleDeleteItem} />}
        {tab === 'crear' && <OutfitBuilder items={items} sizeProfile={sizeProfile} onSaved={refreshOutfits} />}
        {tab === 'outfits' && (
          <OutfitGallery outfits={outfits} items={items} sizeProfile={sizeProfile} onDelete={handleDeleteOutfit} />
        )}
        {tab === 'perfil' && <SizeProfileForm profile={sizeProfile} onChange={updateSizeProfile} />}
      </main>

      {showUpload && (
        <UploadModal onClose={() => setShowUpload(false)} onSaved={refreshItems} />
      )}
    </div>
  )
}

export default App
