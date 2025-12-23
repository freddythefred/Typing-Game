import type { WordBank } from './wordBank'

type BucketRule = {
  name: keyof WordBank
  min: number
  max: number
}

const BUCKETS: BucketRule[] = [
  { name: 'words_3_4', min: 3, max: 4 },
  { name: 'words_4_6', min: 4, max: 6 },
  { name: 'words_6_10', min: 6, max: 10 }
]

export function validateWordBank(bank: WordBank, label: string) {
  BUCKETS.forEach(({ name, min, max }) => {
    const bad = bank[name].filter((word) => {
      const len = word.replace(/\s+/g, '').length
      return len < min || len > max
    })
    if (bad.length > 0) {
      console.warn(`[WordBank] ${label} ${name} has out-of-range entries:`, bad)
    }
  })
}
