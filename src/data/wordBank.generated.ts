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

type BankKey = keyof WordBank

const RAW_BANKS: Record<LanguageId, WordBank> = {
  en: wordsEn as WordBank,
  fr: wordsFr as WordBank
}

const TARGET_SIZES: Record<BankKey, number> = {
  words_3_4: 500,
  words_4_6: 500,
  words_6_10: 500,
  phrases: 300
}

function xorshift32(seed: number) {
  let x = seed | 0
  return () => {
    x ^= x << 13
    x ^= x >>> 17
    x ^= x << 5
    return (x >>> 0) / 0xffffffff
  }
}

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)]!
}

function sanitizeWord(input: string) {
  return input
    .trim()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '')
}

function sanitizePhrase(input: string) {
  return input
    .trim()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function inRange(word: string, min: number, max: number) {
  const len = word.length
  return len >= min && len <= max
}

const BANNED_SUBSTRINGS = [
  'sex',
  'cum',
  'ass',
  'fuk',
  'fuck',
  'shit',
  'cunt',
  'dick',
  'piss',
  'rape',
  'nazi'
]

function isAcceptable(word: string) {
  if (!word) return false
  if (word.length < 3) return false
  if (BANNED_SUBSTRINGS.some((bad) => word.includes(bad))) return false
  return true
}

function generateWord(
  rng: () => number,
  language: LanguageId,
  min: number,
  max: number,
  roots: string[]
) {
  const vowels = language === 'fr' ? ['a', 'e', 'i', 'o', 'u', 'y'] : ['a', 'e', 'i', 'o', 'u', 'y']
  const consonants =
    language === 'fr'
      ? ['b', 'c', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm', 'n', 'p', 'q', 'r', 's', 't', 'v', 'w', 'x', 'z']
      : ['b', 'c', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm', 'n', 'p', 'q', 'r', 's', 't', 'v', 'w', 'x', 'z']

  const onsets =
    language === 'fr'
      ? ['br', 'cr', 'dr', 'fr', 'gr', 'pr', 'tr', 'vr', 'pl', 'cl', 'fl', 'gl', 'bl', 'ch', 'ph', 'qu']
      : ['br', 'cr', 'dr', 'fr', 'gr', 'pr', 'tr', 'pl', 'cl', 'fl', 'gl', 'bl', 'ch', 'sh', 'th', 'ph', 'wh', 'st', 'sp', 'sk']

  const codas =
    language === 'fr'
      ? ['', 'n', 'r', 's', 't', 'l', 'm', 'x']
      : ['', 'n', 'r', 's', 't', 'l', 'm', 'x', 'k', 'p']

  const targetLen = min + Math.floor(rng() * (max - min + 1))

  // Prefer plausible compounds for longer buckets.
  if (targetLen >= 6 && roots.length > 6 && rng() < 0.55) {
    const a = pick(rng, roots)
    const b = pick(rng, roots)
    const combined = sanitizeWord(a + b)
    if (inRange(combined, min, max) && isAcceptable(combined)) return combined
  }

  let w = ''
  const startWithVowel = rng() < 0.22

  while (w.length < targetLen) {
    const wantVowel = w.length === 0 ? startWithVowel : rng() < 0.48
    if (wantVowel) {
      w += pick(rng, vowels)
    } else {
      const cluster = rng() < 0.35 ? pick(rng, onsets) : pick(rng, consonants)
      w += cluster
    }
  }

  w = w.slice(0, targetLen)
  w += pick(rng, codas)
  w = w.slice(0, max)

  w = sanitizeWord(w)
  if (!inRange(w, min, max)) return null
  if (!isAcceptable(w)) return null
  return w
}

function expandBucket(
  language: LanguageId,
  seed: number,
  base: string[],
  min: number,
  max: number,
  target: number
) {
  const rng = xorshift32(seed)
  const cleaned = base.map(sanitizeWord).filter((w) => isAcceptable(w) && inRange(w, min, max))
  const unique = new Set(cleaned)
  const roots = cleaned.filter((w) => w.length >= 3 && w.length <= 6)

  let attempts = 0
  const maxAttempts = target * 200

  while (unique.size < target && attempts < maxAttempts) {
    attempts += 1
    const candidate = generateWord(rng, language, min, max, roots)
    if (!candidate) continue
    unique.add(candidate)
  }

  return Array.from(unique)
}

function expandPhrases(language: LanguageId, seed: number, base: string[], words: string[], target: number) {
  const rng = xorshift32(seed)
  const cleaned = base.map(sanitizePhrase).filter(Boolean)
  const unique = new Set(cleaned)

  const pickWordLocal = () => pick(rng, words)

  const templatesEn = [
    () => `${pickWordLocal()} over ${pickWordLocal()} water`,
    () => `${pickWordLocal()} light on ${pickWordLocal()} waves`,
    () => `breathe with the ${pickWordLocal()}`,
    () => `follow the ${pickWordLocal()} glow`,
    () => `keep your ${pickWordLocal()}`,
    () => `${pickWordLocal()} beneath the surface`
  ]

  const templatesFr = [
    () => `${pickWordLocal()} sur la mer`,
    () => `${pickWordLocal()} au bord de l eau`,
    () => `respire avec la ${pickWordLocal()}`,
    () => `suivre la ${pickWordLocal()} douce`,
    () => `garde le ${pickWordLocal()}`,
    () => `${pickWordLocal()} sous la surface`
  ]

  const templates = language === 'fr' ? templatesFr : templatesEn

  let attempts = 0
  const maxAttempts = target * 200

  while (unique.size < target && attempts < maxAttempts) {
    attempts += 1
    const phrase = sanitizePhrase(pick(rng, templates)())
    if (!phrase) continue
    if (phrase.length < 8) continue
    unique.add(phrase)
  }

  return Array.from(unique)
}

function expandBank(language: LanguageId, raw: WordBank): WordBank {
  const seedBase = language === 'fr' ? 0x2f3a91c7 : 0x6a09e667
  const w34 = expandBucket(language, seedBase ^ 0x1111, raw.words_3_4, 3, 4, TARGET_SIZES.words_3_4)
  const w46 = expandBucket(language, seedBase ^ 0x2222, raw.words_4_6, 4, 6, TARGET_SIZES.words_4_6)
  const w610 = expandBucket(language, seedBase ^ 0x3333, raw.words_6_10, 6, 10, TARGET_SIZES.words_6_10)

  // Use an enriched pool for phrases so they feel less repetitive.
  const phraseWords = [...w34, ...w46, ...w610].filter((w) => w.length >= 3 && w.length <= 10)
  const phrases = expandPhrases(language, seedBase ^ 0x4444, raw.phrases, phraseWords, TARGET_SIZES.phrases)

  return { words_3_4: w34, words_4_6: w46, words_6_10: w610, phrases }
}

export function getBank(language: LanguageId): WordBank {
  const cached = EXPANDED_BANKS[language]
  if (cached) return cached
  const expanded = expandBank(language, RAW_BANKS[language])
  EXPANDED_BANKS[language] = expanded
  return expanded
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

const EXPANDED_BANKS: Partial<Record<LanguageId, WordBank>> = {}
