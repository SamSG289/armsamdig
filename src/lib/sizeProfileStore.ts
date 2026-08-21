import type { SizeProfile } from '../types/wardrobe'
import { DEFAULT_SIZE_PROFILE } from './sizing'

const KEY = 'armario-digital:size-profile'

export function loadSizeProfile(): SizeProfile {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULT_SIZE_PROFILE
    return { ...DEFAULT_SIZE_PROFILE, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_SIZE_PROFILE
  }
}

export function saveSizeProfile(profile: SizeProfile): void {
  localStorage.setItem(KEY, JSON.stringify(profile))
}
