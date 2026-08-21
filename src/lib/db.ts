import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Outfit, WardrobeItem } from '../types/wardrobe'

interface WardrobeDB extends DBSchema {
  items: {
    key: string
    value: WardrobeItem
    indexes: { 'by-category': string }
  }
  outfits: {
    key: string
    value: Outfit
  }
}

let dbPromise: Promise<IDBPDatabase<WardrobeDB>> | null = null

function getDb(): Promise<IDBPDatabase<WardrobeDB>> {
  if (!dbPromise) {
    dbPromise = openDB<WardrobeDB>('armario-digital', 1, {
      upgrade(db) {
        const items = db.createObjectStore('items', { keyPath: 'id' })
        items.createIndex('by-category', 'category')
        db.createObjectStore('outfits', { keyPath: 'id' })
      },
    })
  }
  return dbPromise
}

export async function saveItem(item: WardrobeItem): Promise<void> {
  const db = await getDb()
  await db.put('items', item)
}

export async function getAllItems(): Promise<WardrobeItem[]> {
  const db = await getDb()
  const items = await db.getAll('items')
  return items.sort((a, b) => b.createdAt - a.createdAt)
}

export async function deleteItem(id: string): Promise<void> {
  const db = await getDb()
  await db.delete('items', id)
}

export async function saveOutfit(outfit: Outfit): Promise<void> {
  const db = await getDb()
  await db.put('outfits', outfit)
}

export async function getAllOutfits(): Promise<Outfit[]> {
  const db = await getDb()
  const outfits = await db.getAll('outfits')
  return outfits.sort((a, b) => b.createdAt - a.createdAt)
}

export async function deleteOutfit(id: string): Promise<void> {
  const db = await getDb()
  await db.delete('outfits', id)
}
