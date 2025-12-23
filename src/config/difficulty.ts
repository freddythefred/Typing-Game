export type DifficultyId = 'level1' | 'level2' | 'level3' | 'extra'

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
    gravityY: 0.35,
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
    gravityY: 0.41,
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
    gravityY: 0.475,
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
    label: 'Extra',
    spawnIntervalMs: 2025,
    gravityY: 0.4,
    wind: 0.0005,
    maxBubbles: 8,
    bubbleRadius: [52, 70],
    points: 220,
    comboBonus: 22,
    collisions: true,
    phraseMode: true
  }
}
