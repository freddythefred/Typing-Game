import { DIFFICULTY, type DifficultyId } from '../config/difficulty'
import type { LanguageId } from '../data/wordBank'

export type BestScores = Record<DifficultyId, number>

const STORAGE_KEY_LEGACY = 'bubble-type-best-scores'
const legacyStorageKeyForLanguage = (language: LanguageId) => `bubble-type-best-scores:${language}`
const migrationKey = 'bubble-type-best-scores:migrated-to-profiles:v1'
const storageKeyForProfileLanguage = (profileId: string, language: LanguageId) =>
  `bubble-type-best-scores:${profileId}:${language}`

const DEFAULT_BEST_SCORES: BestScores = Object.fromEntries(
  (Object.keys(DIFFICULTY) as DifficultyId[]).map((id) => [id, 0])
) as BestScores

function parseScores(raw: string | null): BestScores | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<Record<DifficultyId, unknown>>
    const next: BestScores = { ...DEFAULT_BEST_SCORES }

    ;(Object.keys(DIFFICULTY) as DifficultyId[]).forEach((id) => {
      const value = parsed[id]
      if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return
      next[id] = Math.floor(value)
    })

    return next
  } catch {
    return null
  }
}

export function migrateLegacyScoresToProfile(profileId: string) {
  try {
    if (window.localStorage.getItem(migrationKey)) return

    const legacyGlobal = parseScores(window.localStorage.getItem(STORAGE_KEY_LEGACY))
    const legacyEn = parseScores(window.localStorage.getItem(legacyStorageKeyForLanguage('en')))
    const legacyFr = parseScores(window.localStorage.getItem(legacyStorageKeyForLanguage('fr')))

    const en = legacyEn ?? legacyGlobal
    const fr = legacyFr

    if (en) {
      const targetKey = storageKeyForProfileLanguage(profileId, 'en')
      if (!window.localStorage.getItem(targetKey)) {
        window.localStorage.setItem(targetKey, JSON.stringify(en))
      }
    }

    if (fr) {
      const targetKey = storageKeyForProfileLanguage(profileId, 'fr')
      if (!window.localStorage.getItem(targetKey)) {
        window.localStorage.setItem(targetKey, JSON.stringify(fr))
      }
    }

    window.localStorage.removeItem(STORAGE_KEY_LEGACY)
    window.localStorage.removeItem(legacyStorageKeyForLanguage('en'))
    window.localStorage.removeItem(legacyStorageKeyForLanguage('fr'))
    window.localStorage.setItem(migrationKey, '1')
  } catch {
    // Ignore migration errors.
  }
}

export function deleteProfileScores(profileId: string) {
  try {
    window.localStorage.removeItem(storageKeyForProfileLanguage(profileId, 'en'))
    window.localStorage.removeItem(storageKeyForProfileLanguage(profileId, 'fr'))
  } catch {
    // Ignore storage errors.
  }
}

export function loadBestScores(profileId: string, language: LanguageId): BestScores {
  const raw = window.localStorage.getItem(storageKeyForProfileLanguage(profileId, language))
  const parsed = parseScores(raw)
  return parsed ?? { ...DEFAULT_BEST_SCORES }
}

export function getBestScore(profileId: string, language: LanguageId, difficultyId: DifficultyId): number {
  return loadBestScores(profileId, language)[difficultyId] ?? 0
}

export function recordBestScore(profileId: string, language: LanguageId, difficultyId: DifficultyId, score: number): number {
  const normalized = Number.isFinite(score) ? Math.max(0, Math.floor(score)) : 0

  try {
    const scores = loadBestScores(profileId, language)
    const previous = scores[difficultyId] ?? 0
    const best = Math.max(previous, normalized)
    if (best !== previous) {
      scores[difficultyId] = best
      window.localStorage.setItem(storageKeyForProfileLanguage(profileId, language), JSON.stringify(scores))
    }
    return best
  } catch {
    return normalized
  }
}
