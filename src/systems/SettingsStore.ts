import type { DifficultyId } from '../config/difficulty'
import type { LanguageId } from '../data/wordBank'

export type Settings = {
  language: LanguageId
  accentInsensitive: boolean
  volume: number
  difficulty: DifficultyId
}

const STORAGE_KEY = 'bubble-type-settings'

const DEFAULT_SETTINGS: Settings = {
  language: 'en',
  accentInsensitive: false,
  volume: 0.6,
  difficulty: 'level1'
}

export function loadSettings(): Settings {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }
    const parsed = JSON.parse(raw) as Partial<Settings>
    return { ...DEFAULT_SETTINGS, ...parsed }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings: Settings) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}
