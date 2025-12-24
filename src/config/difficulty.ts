export type DifficultyId = 'level1' | 'level2' | 'level3' | 'extra' | 'phrases2' | 'phrases3'

export type DifficultyConfig = {
  id: DifficultyId
  label: string
  spawnIntervalMs: number
  gravityY: number
  wind: number
  maxBubbles: number
  bubbleRadius: [number, number]
  points: number
  comboBonus: number
  collisions: boolean
  phraseMode: boolean
}

export const DIFFICULTY: Record<DifficultyId, DifficultyConfig> = {
  level1: {
    id: 'level1',
    label: 'Level 1',
    spawnIntervalMs: 2250,
    gravityY: 0.23,
    wind: 0.0004,
    maxBubbles: 7,
    bubbleRadius: [40, 56],
    points: 80,
    comboBonus: 10,
    collisions: false,
    phraseMode: false
  },
  level2: {
    id: 'level2',
    label: 'Level 2',
    spawnIntervalMs: 1875,
    gravityY: 0.27,
    wind: 0.00055,
    maxBubbles: 9,
    bubbleRadius: [42, 60],
    points: 130,
    comboBonus: 14,
    collisions: true,
    phraseMode: false
  },
  level3: {
    id: 'level3',
    label: 'Level 3',
    spawnIntervalMs: 1500,
    gravityY: 0.23,
    wind: 0.0007,
    maxBubbles: 11,
    bubbleRadius: [44, 64],
    points: 180,
    comboBonus: 18,
    collisions: true,
    phraseMode: false
  },
  extra: {
    id: 'extra',
    label: 'Level 1',
    spawnIntervalMs: 3000,
    gravityY: 0.05,
    wind: 0.0005,
    maxBubbles: 8,
    bubbleRadius: [52, 70],
    points: 220,
    comboBonus: 22,
    collisions: true,
    phraseMode: true
  },
  phrases2: {
    id: 'phrases2',
    label: 'Level 2',
    spawnIntervalMs: 2600,
    gravityY: 0.05,
    wind: 0.00055,
    maxBubbles: 9,
    bubbleRadius: [52, 70],
    points: 260,
    comboBonus: 26,
    collisions: true,
    phraseMode: true
  },
  phrases3: {
    id: 'phrases3',
    label: 'Level 3',
    spawnIntervalMs: 2200,
    gravityY: 0.05,
    wind: 0.0006,
    maxBubbles: 10,
    bubbleRadius: [52, 70],
    points: 300,
    comboBonus: 30,
    collisions: true,
    phraseMode: true
  }
}

export function isDifficultyId(value: unknown): value is DifficultyId {
  return typeof value === 'string' && value in DIFFICULTY
}
