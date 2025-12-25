import { DIFFICULTY, type DifficultyId } from '../config/difficulty'

export type BestScores = Record<DifficultyId, number>

const STORAGE_KEY = 'bubble-type-best-scores'

const DEFAULT_BEST_SCORES: BestScores = Object.fromEntries(
  (Object.keys(DIFFICULTY) as DifficultyId[]).map((id) => [id, 0])
) as BestScores

export function loadBestScores(): BestScores {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_BEST_SCORES }

    const parsed = JSON.parse(raw) as Partial<Record<DifficultyId, unknown>>
    const next: BestScores = { ...DEFAULT_BEST_SCORES }

    ;(Object.keys(DIFFICULTY) as DifficultyId[]).forEach((id) => {
      const value = parsed[id]
      if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return
      next[id] = Math.floor(value)
    })

    return next
  } catch {
    return { ...DEFAULT_BEST_SCORES }
  }
}

export function getBestScore(difficultyId: DifficultyId): number {
  return loadBestScores()[difficultyId] ?? 0
}

export function recordBestScore(difficultyId: DifficultyId, score: number): number {
  const normalized = Number.isFinite(score) ? Math.max(0, Math.floor(score)) : 0

  try {
    const scores = loadBestScores()
    const previous = scores[difficultyId] ?? 0
    const best = Math.max(previous, normalized)
    if (best !== previous) {
      scores[difficultyId] = best
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(scores))
    }
    return best
  } catch {
    return normalized
  }
}

