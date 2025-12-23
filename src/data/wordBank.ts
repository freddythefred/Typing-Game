import wordsEn from './words.en.json'
import wordsFr from './words.fr.json'
import type { DifficultyId } from '../config/difficulty'

export type LanguageId = 'en' | 'fr'

export type WordBank = {
  words_3_4: string[]
  words_4_6: string[]
  words_6_10: string[]
  phrases: string[]
}

const banks: Record<LanguageId, WordBank> = {
  en: wordsEn,
  fr: wordsFr
}

export function getBank(language: LanguageId): WordBank {
  return banks[language]
}

export function pickWord(language: LanguageId, difficulty: DifficultyId): string {
  const bank = getBank(language)
  if (difficulty === 'extra') {
    return bank.phrases[Math.floor(Math.random() * bank.phrases.length)]
  }

  const pool =
    difficulty === 'level1'
      ? bank.words_3_4
      : difficulty === 'level2'
        ? bank.words_4_6
        : bank.words_6_10

  return pool[Math.floor(Math.random() * pool.length)]
}
