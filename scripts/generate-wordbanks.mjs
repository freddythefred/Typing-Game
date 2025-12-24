import fs from 'node:fs/promises'
import path from 'node:path'

const EN_URL =
  'https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/en/en_50k.txt'
const FR_URL =
  'https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/fr/fr_50k.txt'

const TARGETS = {
  words_3_4: { min: 3, max: 4, count: 500 },
  words_4_6: { min: 4, max: 6, count: 500 },
  words_6_10: { min: 6, max: 10, count: 500 }
}

const BANNED = new Set(['sex', 'cum', 'fuck', 'shit', 'cunt', 'dick', 'piss', 'rape', 'nazi'])

function isGoodWord(word) {
  if (!word) return false
  if (!/^[a-z]+$/.test(word)) return false
  if (BANNED.has(word)) return false
  return true
}

async function readSource(arg, fallbackUrl) {
  const source = arg ?? fallbackUrl
  if (/^https?:\/\//.test(source)) {
    const res = await fetch(source)
    if (!res.ok) throw new Error(`Failed to fetch ${source}: ${res.status} ${res.statusText}`)
    return await res.text()
  }
  return await fs.readFile(source, 'utf8')
}

function parseFrequencyList(text) {
  const words = []
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed) continue
    const [raw] = trimmed.split(/\s+/)
    if (!raw) continue
    const w = raw.toLowerCase()
    words.push(w)
  }
  return words
}

function bucketWords(words) {
  const out = {
    words_3_4: [],
    words_4_6: [],
    words_6_10: []
  }
  const seen = {
    words_3_4: new Set(),
    words_4_6: new Set(),
    words_6_10: new Set()
  }

  for (const w of words) {
    if (!isGoodWord(w)) continue
    for (const [key, rule] of Object.entries(TARGETS)) {
      if (out[key].length >= rule.count) continue
      if (w.length < rule.min || w.length > rule.max) continue
      if (seen[key].has(w)) continue
      seen[key].add(w)
      out[key].push(w)
    }

    if (
      out.words_3_4.length >= TARGETS.words_3_4.count &&
      out.words_4_6.length >= TARGETS.words_4_6.count &&
      out.words_6_10.length >= TARGETS.words_6_10.count
    ) {
      break
    }
  }

  return out
}

function generatePhrases(words, language) {
  // Keep phrases short and readable, made of common words.
  const pool = words.filter((w) => w.length >= 3 && w.length <= 10)
  const pick = () => pool[Math.floor(Math.random() * pool.length)] ?? 'water'
  const templatesEn = [
    () => `keep your ${pick()}`,
    () => `find the ${pick()}`,
    () => `follow the ${pick()}`,
    () => `${pick()} over ${pick()} water`,
    () => `${pick()} in the ${pick()}`,
    () => `hold the ${pick()}`
  ]
  const templatesFr = [
    () => `garde le ${pick()}`,
    () => `trouve le ${pick()}`,
    () => `suis le ${pick()}`,
    () => `${pick()} sur la mer`,
    () => `${pick()} dans le ${pick()}`,
    () => `tiens le ${pick()}`
  ]
  const templates = language === 'fr' ? templatesFr : templatesEn

  const phrases = new Set()
  while (phrases.size < 30) {
    const phrase = templates[Math.floor(Math.random() * templates.length)]()
      .toLowerCase()
      .replace(/[^a-z ]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    if (phrase.length < 8) continue
    phrases.add(phrase)
  }
  return Array.from(phrases)
}

async function main() {
  const args = process.argv.slice(2)
  const outDir = path.resolve('src/data')
  const enArg = args.find((a) => a.startsWith('--en='))?.slice('--en='.length)
  const frArg = args.find((a) => a.startsWith('--fr='))?.slice('--fr='.length)

  const enText = await readSource(enArg, EN_URL)
  const frText = await readSource(frArg, FR_URL)

  const enWords = parseFrequencyList(enText)
  const frWords = parseFrequencyList(frText)

  const en = bucketWords(enWords)
  const fr = bucketWords(frWords)

  const enAll = [...en.words_3_4, ...en.words_4_6, ...en.words_6_10]
  const frAll = [...fr.words_3_4, ...fr.words_4_6, ...fr.words_6_10]

  const enBank = { ...en, phrases: generatePhrases(enAll, 'en') }
  const frBank = { ...fr, phrases: generatePhrases(frAll, 'fr') }

  await fs.writeFile(path.join(outDir, 'words.en.json'), JSON.stringify(enBank, null, 2) + '\n', 'utf8')
  await fs.writeFile(path.join(outDir, 'words.fr.json'), JSON.stringify(frBank, null, 2) + '\n', 'utf8')

  console.log(
    JSON.stringify(
      {
        en: {
          words_3_4: enBank.words_3_4.length,
          words_4_6: enBank.words_4_6.length,
          words_6_10: enBank.words_6_10.length,
          phrases: enBank.phrases.length
        },
        fr: {
          words_3_4: frBank.words_3_4.length,
          words_4_6: frBank.words_4_6.length,
          words_6_10: frBank.words_6_10.length,
          phrases: frBank.phrases.length
        }
      },
      null,
      2
    )
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

