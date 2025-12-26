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

const PHRASE_COUNT = 300

const BANNED_EN = new Set([
  'sex',
  'cum',
  'fuck',
  'shit',
  'cunt',
  'dick',
  'piss',
  'rape',
  'porn',
  'porno',
  'nude',
  'naked',
  'nazi'
])
const BANNED_FR = new Set([
  'sexe',
  'viol',
  'pute',
  'putain',
  'con',
  'connard',
  'cul',
  'merde',
  'bordel',
  'foutre',
  'bite',
  'chatte',
  'salope',
  'encule',
  'enfoire',
  'porno',
  'porn',
  'nazi'
])

function createRng(seed = 1) {
  let x = seed | 0
  return () => {
    x ^= x << 13
    x ^= x >>> 17
    x ^= x << 5
    return (x >>> 0) / 0xffffffff
  }
}

function isGoodWord(word, language) {
  if (!word) return false
  if (language === 'fr') {
    if (!/^\p{L}+$/u.test(word)) return false
    if (word.includes('œ')) return false
    if (BANNED_FR.has(word)) return false
  } else {
    if (!/^[a-z]+$/.test(word)) return false
    if (BANNED_EN.has(word)) return false
  }
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
    const w = raw.toLowerCase().normalize('NFC')
    words.push(w)
  }
  return words
}

function bucketWords(words, language) {
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
    if (!isGoodWord(w, language)) continue
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

function sanitizePhrase(input, language) {
  const normalized = input
    .toLowerCase()
    .normalize('NFC')
    // Normalize typographic apostrophes to ASCII for consistent typing.
    .replace(/[’‘`´]/g, "'")
  const cleaned =
    language === 'fr'
      ? normalized
          // Keep apostrophes inside words ("c'est", "j'aurai").
          .replace(/[^\p{L}' ]+/gu, ' ')
          .replace(/\s+/g, ' ')
          .trim()
      : normalized
          .replace(/[^a-z' ]+/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()

  // Remove spaces around apostrophes (common after punctuation stripping).
  return cleaned
    .replace(/\s*'\s*/g, "'")
    .replace(/'+/g, "'")
    .replace(/^'+|'+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function wordCount(phrase) {
  if (!phrase) return 0
  return phrase.split(' ').filter(Boolean).length
}

function shuffleInPlace(arr, rng) {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
}

function isNegativePhrase(phrase, language) {
  const n = phrase.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')

  if (language === 'en') {
    const patterns = [
      /\bdo not\b/,
      /\bnot now\b/,
      /\bnot today\b/,
      /\bwrong\b/,
      /\bbad\b/,
      /\bsorry\b/,
      /\bsick\b/,
      /\bpanic\b/,
      /\bworry\b/,
      /\bstressed\b/,
      /\bnervous\b/,
      /\bconfused\b/,
      /\blost\b/,
      /\btired\b/,
      /\bthirsty\b/,
      /\bhungry\b/,
      /\bcold\b/,
      /\bhot\b/,
      /\blate\b/,
      /\bi need\b/,
      /\bno idea\b/,
      /\bno time\b/,
      /\bproblem\b/
    ]
    return patterns.some((re) => re.test(n))
  }

  const patterns = [
    /\bne\b/,
    /\bpas\b/,
    /\bdifficile\b/,
    /\btard\b/,
    /\bretard\b/,
    /\bmal\b/,
    /\btriste\b/,
    /\bstress(e)?\b/,
    /\bfatigue(e)?\b/,
    /\bmalade\b/,
    /\bperdu(e)?\b/,
    /\binquiet\b/,
    /\bcolere\b/,
    /\bdesole\b/,
    /\bpardon\b/
  ]
  return patterns.some((re) => re.test(n))
}

function generatePhrases(language) {
  const rng = createRng(language === 'fr' ? 1337 : 2025)
  const phrases = new Set()

  const tryAdd = (raw) => {
    const phrase = sanitizePhrase(raw, language)
    if (!phrase) return
    if (wordCount(phrase) > 4) return
    if (isNegativePhrase(phrase, language)) return
    const parts = phrase.split(' ').filter(Boolean)
    if (parts.length === 0) return

    // Validate by treating apostrophes as word separators (j'aurai -> j + aurai).
    const validationParts = phrase.replace(/'/g, ' ').split(' ').filter(Boolean)
    if (validationParts.some((w) => !isGoodWord(w, language))) return
    if (validationParts.some((w) => (language === 'fr' ? BANNED_FR.has(w) : BANNED_EN.has(w)))) return
    phrases.add(phrase)
  }

  const addAll = (arr) => arr.forEach((p) => tryAdd(p))
  const pick = (arr) => arr[Math.floor(rng() * arr.length)]

  if (language === 'en') {
    addAll([
      'thank you',
      'thanks a lot',
      'you are welcome',
      'of course',
      'good morning',
      'good afternoon',
      'good evening',
      'good night',
      'have a nice day',
      'have a great day',
      'see you soon',
      'see you tomorrow',
      'take care',
      'good luck',
      'well done',
      'great job',
      'nice work',
      'excellent work',
      'keep it up',
      'i will try',
      'we will try',
      'we will eat',
      'we will meet',
      'we will talk',
      'i will call',
      'i will write',
      'i will read',
      'i will come',
      'i will go',
      'i am happy',
      'i am excited',
      'i am calm',
      'i am ready',
      'i am grateful',
      'i am confident',
      'i am proud',
      'i can do it',
      'we can do it',
      'you can do it',
      'you are great',
      'you are amazing',
      'this is excellent',
      'this is amazing',
      'this is great',
      'that is excellent',
      'that is amazing',
      'that is great',
      'it is excellent',
      'it is amazing',
      'it is great',
      'it is perfect',
      'it is wonderful',
      'it is awesome',
      'what a great day'
    ])

    const iAm = [
      'ready',
      'calm',
      'happy',
      'excited',
      'brave',
      'strong',
      'grateful',
      'confident',
      'proud',
      'optimistic',
      'relaxed',
      'focused'
    ]
    iAm.forEach((adj) => tryAdd(`i am ${adj}`))

    const iFeel = [
      'good',
      'great',
      'calm',
      'happy',
      'ready',
      'strong',
      'confident',
      'grateful',
      'relaxed'
    ]
    iFeel.forEach((adj) => tryAdd(`i feel ${adj}`))

    const itIs = [
      'good',
      'great',
      'true',
      'time',
      'enough',
      'important',
      'possible',
      'excellent',
      'amazing',
      'perfect',
      'wonderful'
    ]
    itIs.forEach((w) => tryAdd(`it is ${w}`))

    const thisIs = ['good', 'great', 'excellent', 'amazing', 'perfect', 'wonderful', 'awesome']
    thisIs.forEach((w) => tryAdd(`this is ${w}`))
    thisIs.forEach((w) => tryAdd(`that is ${w}`))

    const iAmNow = ['ready', 'happy', 'excited', 'calm', 'grateful', 'confident']
    iAmNow.forEach((w) => tryAdd(`i am ${w} now`))

    const iAmToday = ['happy', 'excited', 'ready', 'calm', 'confident']
    iAmToday.forEach((w) => tryAdd(`i am ${w} today`))

    const positivePersonAdjectives = [
      'happy',
      'excited',
      'calm',
      'ready',
      'confident',
      'grateful',
      'proud',
      'brave',
      'strong',
      'kind',
      'smart',
      'optimistic',
      'relaxed',
      'focused',
      'joyful',
      'cheerful',
      'thankful',
      'positive',
      'motivated',
      'inspired',
      'lucky',
      'creative',
      'energetic',
      'friendly',
      'helpful'
    ]

    const positiveThingAdjectives = [
      'good',
      'great',
      'excellent',
      'amazing',
      'awesome',
      'wonderful',
      'perfect',
      'fantastic',
      'brilliant',
      'beautiful',
      'helpful',
      'incredible',
      'cool',
      'nice',
      'strong',
      'clear',
      'smart'
    ]

    const positiveVerbs = [
      'win',
      'help',
      'start',
      'learn',
      'try',
      'play',
      'smile',
      'relax',
      'build',
      'create',
      'grow',
      'shine',
      'improve',
      'succeed'
    ]

    const positiveNouns = [
      'day',
      'time',
      'plan',
      'idea',
      'chance',
      'moment',
      'goal',
      'future',
      'story',
      'result',
      'win',
      'breakthrough',
      'victory',
      'surprise',
      'smile'
    ]
    const dayAdjectives = ['good', 'great', 'wonderful', 'amazing', 'beautiful', 'fantastic', 'excellent', 'awesome']
    const timeAdjectives = ['good', 'great', 'wonderful', 'amazing', 'excellent', 'fantastic']

    const neutralVerbs = [
      'eat',
      'meet',
      'talk',
      'walk',
      'work',
      'read',
      'write',
      'play',
      'wait',
      'help',
      'start',
      'learn',
      'try',
      'call',
      'go',
      'come'
    ]

    const neutralTemplates = [
      () => `i will ${pick(neutralVerbs)}`,
      () => `we will ${pick(neutralVerbs)}`,
      () => `we can ${pick(neutralVerbs)}`,
      () => `i can ${pick(neutralVerbs)}`,
      () => `i will be there`,
      () => `we are here`,
      () => `it is okay`,
      () => `it is simple`,
      () => `it is fine`
    ]

    const positiveTemplates = [
      () => `i am ${pick(positivePersonAdjectives)}`,
      () => `i feel ${pick(positivePersonAdjectives)}`,
      () => `i am very ${pick(positivePersonAdjectives)}`,
      () => `i feel very ${pick(positivePersonAdjectives)}`,
      () => `this is ${pick(positiveThingAdjectives)}`,
      () => `that is ${pick(positiveThingAdjectives)}`,
      () => `it is ${pick(positiveThingAdjectives)}`,
      () => `this is really ${pick(positiveThingAdjectives)}`,
      () => `that is really ${pick(positiveThingAdjectives)}`,
      () => `you are ${pick(positivePersonAdjectives)}`,
      () => `you are very ${pick(positivePersonAdjectives)}`,
      () => `we are ${pick(positivePersonAdjectives)}`,
      () => `we are very ${pick(positivePersonAdjectives)}`,
      () => `we can ${pick(positiveVerbs)}`,
      () => `we will ${pick(positiveVerbs)}`,
      () => `you can ${pick(positiveVerbs)}`,
      () => `have a ${pick(positiveNouns)}`,
      () => `have a ${pick(dayAdjectives)} day`,
      () => `have a ${pick(timeAdjectives)} time`,
      () => `have a great weekend`,
      () => `keep going`,
      () => `keep smiling`,
      () => `stay positive`,
      () => `you got this`,
      () => `we got this`,
      () => `we did it`,
      () => `you did great`
    ]

    const templates = [...neutralTemplates, ...neutralTemplates, ...positiveTemplates]

    let attempts = 0
    const maxAttempts = PHRASE_COUNT * 800
    while (phrases.size < PHRASE_COUNT && attempts < maxAttempts) {
      attempts += 1
      tryAdd(pick(templates)())
    }
  } else {
    addAll([
      'merci',
      'merci beaucoup',
      'bonjour',
      'bonsoir',
      'bonne nuit',
      'bonne journée',
      'bonne chance',
      'bon courage',
      'à bientôt',
      'à demain',
      'à tout de suite',
      'tout de suite',
      'bien sûr',
      "d'accord",
      'excuse moi',
      'je suis prêt',
      'je suis occupé',
      'je suis libre',
      'je suis là',
      'je suis ici',
      'je vais bien',
      'je vais mieux',
      'ça va',
      'comment ça va',
      'tu as raison',
      "c'est bon",
      "c'est vrai",
      "c'est fini",
      "c'est ici",
      "c'est parti",
      "c'est parfait",
      "c'est facile",
      "c'est possible",
      "c'est important",
      "c'est excellent",
      "c'est génial",
      "c'est super",
      'on y va',
      'aide moi',
      'écoute moi',
      'regarde ça',
      'je veux aider',
      'je peux aider',
      'je peux le faire',
      'on peut y aller',
      'on va commencer',
      'on va continuer',
      'tout va bien',
      "j'aurai essayé",
      "je t'écoute",
      "je m'en vais",
      'on va manger',
      'on va partir',
      'on va parler',
      'on se retrouve',
      'je vais rentrer',
      'je vais cuisiner',
      'je vais écrire',
      'je vais lire'
    ])

    // Common, grammatically correct short present-tense phrases (2-3 words).
    addAll([
      'je mange',
      'on mange',
      'je pars',
      'on part',
      'je rentre',
      'on rentre',
      'je sors',
      'on sort',
      "j'arrive",
      'on arrive',
      'je lis',
      'on lit',
      "j'écris",
      'on écrit',
      "j'écoute",
      'on écoute',
      'je regarde',
      'on regarde',
      'je parle',
      'on parle',
      'je marche',
      'on marche',
      'je continue',
      'on continue',
      'je commence',
      'on commence',
      'je finis',
      'on finit',
      "j'essaie",
      'on essaie',
      "j'apprends",
      'on apprend',
      'je joue',
      'on joue',
      "j'attends",
      'on attend',
      'je reviens',
      'on revient',
      'je reste',
      'on reste',
      'je retourne',
      'on retourne',
      'je viens',
      'on vient',
      'je travaille',
      'on travaille',
      'je suis prêt',
      'je suis calme',
      'je suis là',
      'je suis ici',
      "c'est ok",
      "c'est simple",
      "c'est normal",
      'tout est clair',
      'tout est ok'
    ])

    const baseJe = [
      'je mange',
      'je pars',
      'je rentre',
      'je sors',
      "j'arrive",
      'je lis',
      "j'écris",
      "j'écoute",
      'je regarde',
      'je parle',
      'je marche',
      'je continue',
      'je commence',
      'je finis',
      "j'essaie",
      "j'apprends",
      'je joue',
      "j'attends",
      'je reviens',
      'je reste',
      'je retourne',
      'je viens',
      'je travaille'
    ]
    const baseOn = [
      'on mange',
      'on part',
      'on rentre',
      'on sort',
      'on arrive',
      'on lit',
      'on écrit',
      'on écoute',
      'on regarde',
      'on parle',
      'on marche',
      'on continue',
      'on commence',
      'on finit',
      'on essaie',
      'on apprend',
      'on joue',
      'on attend',
      'on revient',
      'on reste',
      'on retourne',
      'on vient',
      'on travaille'
    ]
    const tails = ['ici', 'là', 'demain', 'maintenant']
    const tailPairs = ['ce soir']
    baseJe.forEach((p) => {
      tails.forEach((t) => tryAdd(`${p} ${t}`))
      tailPairs.forEach((t) => tryAdd(`${p} ${t}`))
    })
    baseOn.forEach((p) => {
      tails.forEach((t) => tryAdd(`${p} ${t}`))
      tailPairs.forEach((t) => tryAdd(`${p} ${t}`))
    })

    const jeSuis = ['prêt', 'occupé', 'libre', 'calme', 'surpris', 'curieux', 'patient', 'concentré', 'en avance', 'en route', 'de retour']
    jeSuis.forEach((adj) => tryAdd(`je suis ${adj}`))

    const jePeux = ['aider', 'apprendre', 'commencer', 'avancer', 'progresser', 'continuer', 'essayer', 'jouer', 'parler', 'lire', 'écrire', 'écouter']
    jePeux.forEach((v) => tryAdd(`je peux ${v}`))

    const jeMeSens = ['prêt', 'calme', 'concentré', 'ok']
    jeMeSens.forEach((adj) => tryAdd(`je me sens ${adj}`))

    const verbInf = [
      'commencer',
      'essayer',
      'prendre',
      'finir'
    ]
    verbInf.forEach((v) => tryAdd(`on va ${v}`))

    const cEst = ['bon', 'vrai', 'fini', 'simple', 'normal', 'important', 'possible', 'clair', 'utile', 'ok']
    cEst.forEach((w) => tryAdd(`c'est ${w}`))

    const tuEs = ['prêt', 'là', 'ici', 'sûr', 'calme', 'curieux', 'patient']
    tuEs.forEach((w) => tryAdd(`tu es ${w}`))

    const onSeVoit = ['demain', 'bientôt', 'ce soir']
    onSeVoit.forEach((w) => tryAdd(`on se voit ${w}`))

    const merciPour = ['ton aide', 'votre aide', 'tout', 'ça']
    merciPour.forEach((w) => tryAdd(`merci pour ${w}`))

    addAll([
      'à plus tard',
      'à plus',
      'bonne soirée',
      'bon appétit',
      'bonne idée',
      'très bien',
      'tout va bien',
      'ça marche',
      "c'est ok",
      'je comprends',
      'je sais',
      'je suis sûr',
      'tu es sûr',
      'tu es là',
      'tu es ici',
      'je peux aider aussi',
      'on peut y aller',
      'je suis prêt',
      'je suis là',
      'je suis ici',
      'je suis calme',
      'je suis content',
      'on peut y aller',
      'on va commencer',
      'on va essayer',
      'bien joué',
      'bravo',
      'excellent travail'
    ])

    const positivePersonAdjectives = ['calme', 'prêt', 'patient', 'curieux', 'concentré', 'sympa', 'gentil']

    const positiveFeelingWords = ['calme', 'prêt', 'ok', 'concentré']

    const positiveThingAdjectives = ['bon', 'simple', 'clair', 'utile', 'ok', 'cool', 'sympa']

    const positiveStatusWords = ['bien', 'ok', 'clair']

    const positiveVerbs = ['commencer', 'avancer', 'progresser', 'continuer', 'essayer', 'apprendre', 'jouer', 'aider', 'parler', 'lire', 'écrire', 'écouter']

    const neutralVerbs = [
      'manger',
      'rentrer',
      'sortir',
      'partir',
      'arriver',
      'lire',
      'écrire',
      'écouter',
      'regarder',
      'parler',
      'marcher',
      'continuer',
      'commencer',
      'finir',
      'essayer',
      'réfléchir',
      'apprendre',
      'jouer',
      'attendre',
      'revenir',
      'rester',
      'retourner',
      'venir',
      'aller',
      'travailler'
    ]

    const canVerbs = [
      'manger',
      'rentrer',
      'sortir',
      'partir',
      'arriver',
      'lire',
      'écrire',
      'parler',
      'marcher',
      'continuer',
      'commencer',
      'finir',
      'essayer',
      'réfléchir',
      'apprendre',
      'jouer',
      'attendre',
      'revenir',
      'rester',
      'retourner',
      'venir',
      'aller',
      'travailler'
    ]

    const neutralTemplates = [
      () => `on va ${pick(neutralVerbs)}`,
      () => `je vais ${pick(neutralVerbs)}`,
      () => `on peut ${pick(canVerbs)}`,
      () => `je peux ${pick(canVerbs)}`,
      () => `on se retrouve`,
      () => `on est ici`,
      () => `je reviens bientôt`,
      () => `je suis là`,
      () => `je suis ici`,
      () => `c'est simple`,
      () => `c'est normal`,
      () => `c'est ok`,
      () => `tout de suite`,
      () => `on y va`,
      () => `je sais`,
      () => `je comprends`,
      () => `je vais voir`,
      () => `j'aurai essayé`,
      () => `je t'écoute`
    ]

    const templates = [
      () => `je vais bien`,
      () => `je suis ${pick(positivePersonAdjectives)}`,
      () => `je me sens ${pick(positiveFeelingWords)}`,
      () => `c'est ${pick(positiveThingAdjectives)}`,
      () => `tout va ${pick(positiveStatusWords)}`,
      () => `tout est ${pick(positiveThingAdjectives)}`,
      () => `on va ${pick(positiveVerbs)}`,
      () => `on peut ${pick(positiveVerbs)}`,
      () => `tu es ${pick(positivePersonAdjectives)}`,
      () => `bien joué`,
      () => `bravo`,
      () => `excellent travail`
    ]

    const allTemplates = [
      ...neutralTemplates,
      ...neutralTemplates,
      ...neutralTemplates,
      ...neutralTemplates,
      ...templates
    ]

    let attempts = 0
    const maxAttempts = PHRASE_COUNT * 900
    while (phrases.size < PHRASE_COUNT && attempts < maxAttempts) {
      attempts += 1
      tryAdd(pick(allTemplates)())
    }
  }

  if (phrases.size < PHRASE_COUNT) {
    throw new Error(`Could not generate enough phrases for ${language}: got ${phrases.size}/${PHRASE_COUNT}`)
  }

  const out = Array.from(phrases)
  shuffleInPlace(out, rng)
  return out.slice(0, PHRASE_COUNT)
}

async function main() {
  const args = process.argv.slice(2)
  const outDir = path.resolve('src/data')
  const phrasesOnly = args.includes('--phrases-only')
  const enArg = args.find((a) => a.startsWith('--en='))?.slice('--en='.length)
  const frArg = args.find((a) => a.startsWith('--fr='))?.slice('--fr='.length)

  if (phrasesOnly) {
    const enBank = JSON.parse(await fs.readFile(path.join(outDir, 'words.en.json'), 'utf8'))
    const frBank = JSON.parse(await fs.readFile(path.join(outDir, 'words.fr.json'), 'utf8'))

    enBank.phrases = generatePhrases('en')
    frBank.phrases = generatePhrases('fr')

    await fs.writeFile(path.join(outDir, 'words.en.json'), JSON.stringify(enBank, null, 2) + '\n', 'utf8')
    await fs.writeFile(path.join(outDir, 'words.fr.json'), JSON.stringify(frBank, null, 2) + '\n', 'utf8')

    console.log(JSON.stringify({ mode: 'phrases-only', en: { phrases: enBank.phrases.length }, fr: { phrases: frBank.phrases.length } }, null, 2))
    return
  }

  const enText = await readSource(enArg, EN_URL)
  const frText = await readSource(frArg, FR_URL)

  const enWords = parseFrequencyList(enText)
  const frWords = parseFrequencyList(frText)

  const en = bucketWords(enWords, 'en')
  const fr = bucketWords(frWords, 'fr')

  const enBank = { ...en, phrases: generatePhrases('en') }
  const frBank = { ...fr, phrases: generatePhrases('fr') }

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
