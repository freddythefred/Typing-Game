import { isDifficultyId, type DifficultyId } from '../config/difficulty'
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
  accentInsensitive: true,
  volume: 0.6,
  difficulty: 'level1'
}

export function loadSettings(): Settings {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }
    const parsed = JSON.parse(raw) as Partial<Settings>
    const next: Settings = { ...DEFAULT_SETTINGS, ...parsed } as Settings
    if (!isDifficultyId(next.difficulty)) next.difficulty = DEFAULT_SETTINGS.difficulty
    next.accentInsensitive = true
    return next
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings: Settings) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}
