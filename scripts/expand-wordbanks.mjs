import fs from 'node:fs/promises'
import path from 'node:path'

const OUT_DIR = path.resolve('src/data')

const LANGUAGES = /** @type {const} */ (['en', 'fr', 'es', 'it', 'de', 'ru', 'ar'])

const DEFAULT_FREQUENCY_URLS = {
  en: 'https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/en/en_50k.txt',
  fr: 'https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/fr/fr_50k.txt',
  es: 'https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/es/es_50k.txt',
  it: 'https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/it/it_50k.txt',
  de: 'https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/de/de_50k.txt',
  ru: 'https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/ru/ru_50k.txt',
  ar: 'https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/ar/ar_50k.txt'
}

const WORD_RULES = {
  words_3_4: { min: 3, max: 4 },
  words_4_6: { min: 4, max: 6 },
  words_6_10: { min: 6, max: 10 }
}

const BANNED_EN = new Set([
  'sex',
  'cum',
  'fuck',
  'shit',
  'cunt',
  'dick',
  'piss',
  'rape',
  'cancer',
  'cancers',
  'porn',
  'porno',
  'nude',
  'naked',
  'nazi',
  'asshole',
  'bitch',
  'fuckin',
  'fucking',
  'bastard'
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
  'cancer',
  'cancers',
  'porno',
  'porn',
  'nazi'
])

const BANNED_BY_LANGUAGE = {
  en: new Set(['cancer', 'cancers']),
  fr: new Set(['cancer', 'cancers']),
  es: new Set(['cáncer', 'cancer', 'cánceres', 'canceres']),
  it: new Set(['cancro', 'cancri']),
  de: new Set(['krebs']),
  ru: new Set(['рак']),
  ar: new Set(['سرطان'])
}

const EN_CONTRACTION_FIXES = new Map([
  ['ain', "ain't"],
  ['aren', "aren't"],
  ['couldn', "couldn't"],
  ['didn', "didn't"],
  ['doesn', "doesn't"],
  ['hadn', "hadn't"],
  ['hasn', "hasn't"],
  ['haven', "haven't"],
  ['isn', "isn't"],
  ['shouldn', "shouldn't"],
  ['wasn', "wasn't"],
  ['weren', "weren't"],
  ['wouldn', "wouldn't"]
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

function shuffleInPlace(arr, rng) {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
}

function normalizeEnglishWordToken(word) {
  if (!word) return word
  const normalized = word.toLowerCase().normalize('NFC').replace(/[\u2018\u2019\u02bc\u0060\u00b4]/g, "'")
  return EN_CONTRACTION_FIXES.get(normalized) ?? normalized
}

function normalizeWordToken(rawWord, language) {
  const cleaned = String(rawWord ?? '')
    .trim()
    .normalize('NFC')
    .toLowerCase()
    .replace(/[\u2018\u2019\u02bc\u0060\u00b4]/g, "'")
  return language === 'en' ? normalizeEnglishWordToken(cleaned) : cleaned
}

function isGoodWord(word, language) {
  if (!word) return false
  if (language === 'en') {
    if (!/^[a-z]+$/.test(word) && !/^[a-z]+n't$/.test(word)) return false
    const bare = word.replace(/'/g, '')
    if (BANNED_BY_LANGUAGE.en.has(word) || BANNED_BY_LANGUAGE.en.has(bare)) return false
    if (BANNED_EN.has(word) || BANNED_EN.has(bare)) return false
    return true
  }

  if (!/^\p{L}+$/u.test(word)) return false
  if (BANNED_BY_LANGUAGE[language]?.has(word)) return false
  if (language === 'fr' && BANNED_FR.has(word)) return false
  return true
}

function inRange(text, min, max) {
  const len = text.length
  return len >= min && len <= max
}

async function readSource(source, fallbackUrl) {
  const resolved = source ?? fallbackUrl
  if (/^https?:\/\//.test(resolved)) {
    const res = await fetch(resolved)
    if (!res.ok) throw new Error(`Failed to fetch ${resolved}: ${res.status} ${res.statusText}`)
    return await res.text()
  }
  return await fs.readFile(resolved, 'utf8')
}

function parseFrequencyList(text) {
  const words = []
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed) continue
    const [raw] = trimmed.split(/\s+/)
    if (!raw) continue
    words.push(raw.toLowerCase().normalize('NFC'))
  }
  return words
}

function fillBucket(existing, frequencyWords, language, rule, targetCount) {
  const out = []
  const seen = new Set()

  for (const raw of existing ?? []) {
    const w = normalizeWordToken(raw, language)
    if (!isGoodWord(w, language)) continue
    if (!inRange(w, rule.min, rule.max)) continue
    if (seen.has(w)) continue
    seen.add(w)
    out.push(w)
  }

  for (const raw of frequencyWords) {
    if (out.length >= targetCount) break
    const w = normalizeWordToken(raw, language)
    if (!isGoodWord(w, language)) continue
    if (!inRange(w, rule.min, rule.max)) continue
    if (seen.has(w)) continue
    seen.add(w)
    out.push(w)
  }

  if (out.length < targetCount) {
    throw new Error(`Could not fill ${language} bucket ${rule.min}-${rule.max}: ${out.length}/${targetCount}`)
  }
  return out.slice(0, targetCount)
}

function sanitizePhrase(input, language) {
  const normalized = String(input ?? '')
    .toLowerCase()
    .normalize('NFC')
    .replace(/[\u2018\u2019\u02bc\u0060\u00b4]/g, "'")

  const cleaned =
    language === 'en'
      ? normalized.replace(/[^a-z' ]+/g, ' ')
      : normalized.replace(/[^\p{L}' ]+/gu, ' ')

  return cleaned
    .replace(/\s+/g, ' ')
    .trim()
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

function canUsePhrase(phrase, language) {
  if (!phrase) return false
  if (wordCount(phrase) > 4) return false

  const validationParts = phrase.replace(/'/g, ' ').split(' ').filter(Boolean)
  if (validationParts.length === 0) return false
  if (validationParts.some((w) => !isGoodWord(w, language))) return false

  if (language === 'en' && validationParts.some((w) => BANNED_EN.has(w) || BANNED_EN.has(w.replace(/'/g, '')))) return false
  if (language === 'fr' && validationParts.some((w) => BANNED_FR.has(w))) return false
  return true
}

function addPhrase(set, raw, language) {
  const phrase = sanitizePhrase(raw, language)
  if (!canUsePhrase(phrase, language)) return
  set.add(phrase)
}

function seedForLanguage(language) {
  switch (language) {
    case 'en':
      return 2025
    case 'fr':
      return 1337
    case 'es':
      return 1618
    case 'it':
      return 3141
    case 'de':
      return 2718
    case 'ru':
      return 1123
    case 'ar':
      return 4242
    default:
      return 1
  }
}

function pickRng(rng, arr) {
  return arr[Math.floor(rng() * arr.length)]
}

function generatePhrasesFr(rng, targetCount, seedPhrases = []) {
  const phrases = new Set()
  const add = (raw) => addPhrase(phrases, raw, 'fr')

  ;[
    'bonjour',
    'bonsoir',
    'bonne nuit',
    'merci',
    'merci beaucoup',
    "s'il te plaît",
    'avec plaisir',
    "d'accord",
    'pas à pas',
    'tout va bien',
    'ça va bien',
    'ça va mieux',
    'à bientôt',
    'à demain',
    'à tout à l’heure',
    'à tout de suite',
    'prends ton temps',
    'garde le rythme',
    'reste concentré',
    'respire calmement',
    "au bord de l'eau",
    'près de la mer',
    'dans le calme',
    'dans le silence',
    'sous la pluie',
    'sur la mer',
    'un pas de plus',
    "rien n'est perdu",
    'tout est possible',
    'tout est clair',
    "c'est simple",
    "c'est correct",
    'tout est prêt',
    'on se voit demain',
    'on se voit bientôt',
    'à plus tard',
    'à la prochaine'
  ].forEach(add)

  // Keep these for generic "subject + verb + tail" only: no manner adverbs to avoid illogical combos (e.g. "attendre vite").
  const tailsSolo = ['ici', 'là', 'maintenant', 'encore', "aujourd'hui"]
  const tailsGroup = [...tailsSolo, 'ensemble']

  const mannerSoft = ['doucement', 'calmement', 'bien', 'clairement']
  const mannerTyping = ['vite', 'lentement', 'calmement', 'bien', 'clairement']

  const verbsJe = [
    'viens',
    'pars',
    'rentre',
    'reviens',
    'reste',
    'continue',
    'respire',
    'lis',
    'regarde',
    'joue',
    'travaille',
    'progresse',
    'commence',
    'termine',
    'comprends',
    'pense',
    'choisis',
    'révise',
    'réessaie'
  ]

  const verbsJeElide = ['avance', 'apprends', 'essaie', 'attends', 'écoute', 'écris']

  const verbsTu = [
    'viens',
    'pars',
    'rentres',
    'reviens',
    'restes',
    'avances',
    'continues',
    'apprends',
    'essaies',
    'attends',
    'respires',
    'lis',
    'écris',
    'écoutes',
    'regardes',
    'joues',
    'travailles',
    'progresses',
    'commences',
    'termines',
    'comprends',
    'penses',
    'choisis',
    'révises',
    'réessaies'
  ]

  const verbsOn = [
    'vient',
    'part',
    'rentre',
    'revient',
    'reste',
    'avance',
    'continue',
    'apprend',
    'essaie',
    'attend',
    'respire',
    'lit',
    'écrit',
    'écoute',
    'regarde',
    'joue',
    'travaille',
    'progresse',
    'commence',
    'termine',
    'réussit',
    "s'adapte"
  ]

  const verbsNous = [
    'venons',
    'partons',
    'rentrons',
    'revenons',
    'restons',
    'avançons',
    'continuons',
    'apprenons',
    'essayons',
    'attendons',
    'respirons',
    'lisons',
    'écrivons',
    'écoutons',
    'regardons',
    'jouons',
    'travaillons',
    'progressons',
    'commençons',
    'terminons',
    'réussissons'
  ]

  const verbsVous = [
    'venez',
    'partez',
    'rentrez',
    'revenez',
    'restez',
    'avancez',
    'continuez',
    'apprenez',
    'essayez',
    'attendez',
    'respirez',
    'lisez',
    'écrivez',
    'écoutez',
    'regardez',
    'jouez',
    'travaillez',
    'progressez',
    'commencez',
    'terminez',
    'réussissez'
  ]

  const verbsIls = [
    'viennent',
    'partent',
    'rentrent',
    'reviennent',
    'restent',
    'avancent',
    'continuent',
    'apprennent',
    'essaient',
    'attendent',
    'respirent',
    'lisent',
    'écrivent',
    'écoutent',
    'regardent',
    'jouent',
    'travaillent',
    'progressent',
    'commencent',
    'terminent',
    'réussissent'
  ]

  const adjMasc = [
    'prêt',
    'calme',
    'patient',
    'curieux',
    'serein',
    'sûr',
    'content',
    'motivé',
    'concentré',
    'détendu',
    'régulier',
    'attentif',
    'prudent',
    'rapide',
    'lent',
    'disponible'
  ]
  const adjFem = [
    'prête',
    'calme',
    'patiente',
    'curieuse',
    'sereine',
    'sûre',
    'contente',
    'motivée',
    'concentrée',
    'détendue',
    'régulière',
    'attentive',
    'prudente',
    'rapide',
    'lente',
    'disponible'
  ]

  const adjNeutral = [
    'clair',
    'simple',
    'possible',
    'utile',
    'correct',
    'prêt',
    'calme',
    'ok'
  ]

  const objRead = [
    'le texte',
    'ce texte',
    'la ligne',
    'cette ligne',
    'la phrase',
    'cette phrase',
    'la page',
    'cette page',
    'la lettre',
    'cette lettre',
    'ces lettres',
    'ce mot',
    'ces mots'
  ]
  const objWrite = [
    'le texte',
    'ce texte',
    'la ligne',
    'cette ligne',
    'la phrase',
    'cette phrase',
    'la lettre',
    'cette lettre',
    'ces lettres',
    'ce mot',
    'ces mots',
    'une note',
    'la liste'
  ]
  const objListen = [
    'la musique',
    'le silence',
    'le vent',
    'la mer',
    'les vagues',
    'la pluie',
    'les bulles',
    'le rythme',
    'le souffle',
    'la voix'
  ]
  const objLook = [
    'la mer',
    'le ciel',
    'la lumière',
    'les bulles',
    'les vagues',
    'le soleil',
    'la brume',
    'la pluie',
    'les nuages',
    'les étoiles',
    'la surface',
    'le reflet',
    'le rivage',
    'le courant'
  ]
  const objPress = ['entrée', 'espace', 'retour']
  const objOpen = ['la porte', 'la fenêtre']
  const objTake = ['une pause', 'un souffle', 'un moment']

  const fixedShort = [
    'où es tu',
    'où vas tu',
    'qui est là',
    'tu es prêt',
    'tu es là',
    'vous êtes prêts',
    'vous êtes là',
    'tout est prêt',
    'comment ça va',
    'tu vas bien',
    'vous allez bien',
    "c'est parti",
    "c'est fini",
    'on y va',
    'on continue',
    'je suis là',
    'je suis prêt',
    'nous sommes prêts',
    'vous êtes prêts',
    'tout va bien',
    'bonne journée'
  ]

  const nounMasc = [
    'vent',
    'ciel',
    'soleil',
    'monde',
    'temps',
    'rythme',
    'souffle',
    'silence',
    'calme',
    'chemin',
    'jeu',
    'niveau',
    'score',
    'clavier',
    'mot',
    'texte',
    'progrès',
    'travail'
  ]
  const nounFem = [
    'mer',
    'vague',
    'pluie',
    'lumière',
    'brume',
    'route',
    'pause',
    'page',
    'ligne',
    'lettre',
    'phrase',
    'touche',
    'fenêtre',
    'porte',
    'musique'
  ]
  const nounPl = ['vagues', 'nuages', 'étoiles', 'bulles', 'mots', 'phrases', 'lettres', 'touches']

  const v3s = ['brille', 'danse', 'glisse', 'avance', 'change', 'tourne', 'passe']
  const v3p = ['dansent', 'glissent', 'avancent', 'changent', 'tournent', 'passent']

  const nounMascEst = ['vent', 'ciel', 'soleil', 'temps', 'rythme', 'silence', 'calme', 'chemin', 'texte', 'mot', 'clavier', 'score', 'niveau', 'jeu']
  const nounFemEst = ['mer', 'vague', 'pluie', 'lumière', 'brume', 'pause', 'page', 'ligne', 'lettre', 'phrase', 'touche', 'musique']

  const adjEstMasc = ['calme', 'clair', 'simple', 'stable', 'solide']
  const adjEstFem = ['calme', 'claire', 'simple', 'stable', 'solide']

  const imper2 = ['respire', 'avance', 'continue', 'écoute', 'regarde', 'lis', 'écris', 'recommence', 'essaie', 'patiente', 'relâche']
  // No "vite" here to avoid "écoute vite / attends vite" style phrases.
  const adv = ['doucement', 'calmement', 'lentement', 'sereinement', 'tranquillement', 'encore', 'bien', 'ici', 'maintenant']

  const prepShort = [
    'dans le calme',
    'dans le silence',
    'dans la brume',
    'sous la pluie',
    'sur la route',
    'avec soin',
    'avec patience',
    'avec attention',
    'avec douceur',
    'avec courage',
    'avec confiance',
    'sans erreur',
    'sans faute',
    'sans hésiter',
    'sans stress',
    'tout de suite'
  ]
  const imperMove = ['avance', 'continue', 'marche', 'reviens', 'viens', 'reste', 'pars', 'rentre', 'retourne']

  const prepPhrases = [
    "au bord de l'eau",
    'près de la mer',
    'dans le calme',
    'dans le silence',
    'sous la pluie',
    'sur la mer',
    'avec le sourire',
    'sans perdre patience',
    'avec attention',
    'sans hésiter'
  ]

  const inf1 = [
    'avancer',
    'continuer',
    'respirer',
    'attendre',
    'apprendre',
    'pratiquer',
    'observer',
    'écouter',
    'lire',
    'écrire',
    'réessayer',
    'progresser',
    'se reposer',
    'se calmer'
  ]
  const inf2 = ['se détendre', 'se concentrer', 'y aller', 'faire une pause']

  const fixedScenes = [
    'le vent souffle',
    'le ciel change',
    'le soleil brille',
    'la mer brille',
    'la pluie tombe',
    'la brume flotte',
    'la nuit tombe',
    'le jour commence',
    'il fait chaud',
    'il fait froid',
    'il fait beau',
    'les vagues dansent',
    'les nuages passent',
    'les étoiles brillent',
    'les bulles montent',
    'les bulles descendent',
    'la lumière danse',
    'la lumière glisse',
    'la porte s ouvre',
    'la porte se ferme',
    'la fenêtre s ouvre',
    'la fenêtre se ferme',
    'la page tourne',
    'la ligne avance',
    'le score monte',
    'le niveau change',
    'la touche répond',
    'le clavier répond',
    "la phrase s'affiche",
    "le texte s'affiche",
    'la musique joue',
    'le silence revient',
    'le rythme change',
    'un souffle suffit',
    'une pause suffit'
  ]

  const templates = [
    () => `je ${pickRng(rng, verbsJe)}`,
    () => `je ${pickRng(rng, verbsJe)} ${pickRng(rng, tailsSolo)}`,
    () => `j'${pickRng(rng, verbsJeElide)}`,
    () => `j'${pickRng(rng, verbsJeElide)} ${pickRng(rng, tailsSolo)}`,
    () => `tu ${pickRng(rng, verbsTu)}`,
    () => `tu ${pickRng(rng, verbsTu)} ${pickRng(rng, tailsSolo)}`,
    () => `on ${pickRng(rng, verbsOn)}`,
    () => `on ${pickRng(rng, verbsOn)} ${pickRng(rng, tailsGroup)}`,
    () => `nous ${pickRng(rng, verbsNous)}`,
    () => `nous ${pickRng(rng, verbsNous)} ${pickRng(rng, tailsGroup)}`,
    () => `vous ${pickRng(rng, verbsVous)}`,
    () => `vous ${pickRng(rng, verbsVous)} ${pickRng(rng, tailsGroup)}`,
    () => `ils ${pickRng(rng, verbsIls)}`,
    () => `elles ${pickRng(rng, verbsIls)}`,

    // Meaningful short actions with objects (less repetitive than adverbial tails).
    () => `je lis ${pickRng(rng, objRead)}`,
    () => `tu lis ${pickRng(rng, objRead)}`,
    () => `on lit ${pickRng(rng, objRead)}`,
    () => `nous lisons ${pickRng(rng, objRead)}`,
    () => `vous lisez ${pickRng(rng, objRead)}`,
    () => `j'écris ${pickRng(rng, objWrite)}`,
    () => `tu écris ${pickRng(rng, objWrite)}`,
    () => `on écrit ${pickRng(rng, objWrite)}`,
    () => `nous écrivons ${pickRng(rng, objWrite)}`,
    () => `vous écrivez ${pickRng(rng, objWrite)}`,
    () => `j'écoute ${pickRng(rng, objListen)}`,
    () => `tu écoutes ${pickRng(rng, objListen)}`,
    () => `on écoute ${pickRng(rng, objListen)}`,
    () => `nous écoutons ${pickRng(rng, objListen)}`,
    () => `vous écoutez ${pickRng(rng, objListen)}`,
    () => `je regarde ${pickRng(rng, objLook)}`,
    () => `tu regardes ${pickRng(rng, objLook)}`,
    () => `on regarde ${pickRng(rng, objLook)}`,
    () => `nous regardons ${pickRng(rng, objLook)}`,
    () => `vous regardez ${pickRng(rng, objLook)}`,
    () => `ouvre ${pickRng(rng, objOpen)}`,
    () => `ferme ${pickRng(rng, objOpen)}`,
    () => `prends ${pickRng(rng, objTake)}`,

    // Typing-specific instructions (here "vite" makes sense).
    () => `tape ${pickRng(rng, mannerTyping)}`,
    () => `tape ${pickRng(rng, objWrite)}`,
    () => `tape ${pickRng(rng, objRead)}`,
    () => `appuie sur ${pickRng(rng, objPress)}`,

    // Verb + short complement (kept semantically safe and within 4 words).
    () => `${pickRng(rng, imperMove)} ${pickRng(rng, prepShort)}`,

    // Controlled manner phrases (only for verbs where it makes sense).
    () => `continue ${pickRng(rng, mannerSoft)}`,
    () => `avance ${pickRng(rng, mannerSoft)}`,
    () => `écris ${pickRng(rng, mannerSoft)}`,
    () => `lis ${pickRng(rng, mannerSoft)}`,
    () => `écoute ${pickRng(rng, mannerSoft)}`,
    () => `regarde ${pickRng(rng, mannerSoft)}`,
    () => `il faut ${pickRng(rng, inf1)}`,
    () => `il faut ${pickRng(rng, inf2)}`,
    () => `il suffit ${pickRng(rng, ['d essayer', 'de lire', "d écrire", 'de respirer', 'de continuer'])}`,
    () => `c'est ${pickRng(rng, adjNeutral)}`,
    () => `tout est ${pickRng(rng, adjNeutral)}`,
    () => `elle est ${pickRng(rng, adjFem)}`,
    () => `il est ${pickRng(rng, adjMasc)}`,
    () => `le ${pickRng(rng, nounMascEst)} est ${pickRng(rng, adjEstMasc)}`,
    () => `la ${pickRng(rng, nounFemEst)} est ${pickRng(rng, adjEstFem)}`,
    () => `${pickRng(rng, imper2)} ${pickRng(rng, adv)}`,
    () => pickRng(rng, prepPhrases),
    () => pickRng(rng, fixedScenes),
    () => `garde le rythme`,
    () => `vise la précision`,
    () => `tape sans faute`,
    () => `tape sans erreur`,
    () => `reste calme`,
    () => `reste ici`,
    () => `pas à pas`,
    () => `un pas de plus`,
    () => pickRng(rng, fixedShort)
  ]

  let attempts = 0
  const maxAttempts = Math.max(2000, targetCount * 2000)
  while (phrases.size < targetCount && attempts < maxAttempts) {
    attempts += 1
    add(pickRng(rng, templates)())
  }

  if (phrases.size < targetCount) {
    throw new Error(`Could not generate enough phrases for fr: ${phrases.size}/${targetCount}`)
  }

  const out = Array.from(phrases)
  shuffleInPlace(out, rng)
  return out.slice(0, targetCount)
}

function generatePhrases(language, targetCount, seedPhrases = []) {
  const rng = createRng(seedForLanguage(language))
  if (language === 'fr') return generatePhrasesFr(rng, targetCount, seedPhrases)
  const phrases = new Set()

  for (const p of seedPhrases) addPhrase(phrases, p, language)

  const addAll = (arr) => arr.forEach((p) => addPhrase(phrases, p, language))

  const addCombos3 = (a, b, c) => {
    for (const x of a) for (const y of b) for (const z of c) addPhrase(phrases, `${x} ${y} ${z}`, language)
  }
  const addCombos2 = (a, b) => {
    for (const x of a) for (const y of b) addPhrase(phrases, `${x} ${y}`, language)
  }
  const addCombos4 = (a, b, c, d) => {
    for (const x of a) for (const y of b) for (const z of c) for (const t of d)
      addPhrase(phrases, `${x} ${y} ${z} ${t}`, language)
  }

  if (language === 'en') {
    addAll([
      'thank you',
      'thanks a lot',
      'you are welcome',
      'excuse me',
      'please',
      'please wait',
      'one moment',
      'just a second',
      'of course',
      'good morning',
      'good afternoon',
      'good evening',
      'good night',
      'see you soon',
      'see you tomorrow',
      'take care',
      'good luck',
      'well done',
      'good job',
      'nice work',
      'keep it up',
      'keep going',
      'you can do it',
      'we can do it',
      'i am ready',
      'i am here',
      'we are here',
      'stay calm',
      'stay focused',
      'take your time',
      'step by step',
      'one at a time',
      'slow and steady'
    ])

    const verbs = [
      'read',
      'write',
      'learn',
      'practice',
      'focus',
      'breathe',
      'listen',
      'look',
      'wait',
      'move',
      'continue',
      'start',
      'begin',
      'finish',
      'try',
      'play',
      'work',
      'rest',
      'smile',
      'type',
      'press',
      'improve',
      'relax',
      'reset',
      'repeat',
      'remember',
      'review',
      'listen',
      'breathe'
    ]
    const tails = ['now', 'today', 'slowly', 'again', 'here', 'soon', 'always', 'calmly', 'carefully', 'clearly']
    const adj = ['ready', 'calm', 'focused', 'steady', 'patient', 'curious', 'quiet', 'brave', 'gentle', 'confident']
    const nouns = ['pace', 'focus', 'rhythm', 'balance', 'breath', 'energy', 'time', 'flow', 'mind', 'hands']

    addCombos3(['i will'], verbs, tails)
    addCombos3(['we will'], verbs, tails)
    addCombos4(['i'], ['can'], verbs, tails)
    addCombos4(['we'], ['can'], verbs, tails)
    addCombos4(['you'], ['can'], verbs, tails)
    addCombos3(['please'], verbs, ['now', 'slowly', 'carefully'])
    addCombos2(['keep your'], nouns)
    addCombos3(['keep your'], nouns, tails)
    addCombos2(['stay'], adj)
    addCombos3(['i am'], adj, tails)
    addCombos3(['we are'], adj, tails)
    addCombos2(['this is'], ['fine', 'simple', 'clear', 'enough', 'possible', 'important'])
    addCombos2(['it is'], ['fine', 'simple', 'clear', 'enough', 'possible', 'important'])
    addCombos2(['it is very'], adj)
    addCombos2(['this is very'], adj)
    addCombos2(['type the'], ['word', 'line', 'keys'])
    addCombos3(['type the'], ['word', 'line'], tails)
    addCombos3(['breathe'], ['in', 'out'], ['slowly', 'calmly'])
  }

  if (language === 'fr') {
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
      'd accord',
      'excuse moi',
      'je suis prêt',
      'je suis ici',
      'je vais bien',
      'ça va',
      'comment ça va',
      'on y va',
      'pas à pas',
      'doucement',
      'prends ton temps'
    ])

    const inf = [
      'avancer',
      'continuer',
      'commencer',
      'démarrer',
      'finir',
      'terminer',
      'essayer',
      'apprendre',
      'écouter',
      'regarder',
      'lire',
      'écrire',
      'parler',
      'marcher',
      'respirer',
      'jouer',
      'travailler',
      'patienter',
      'revenir',
      'partir',
      'rentrer',
      'attendre',
      'progresser',
      'réussir',
      'réviser',
      'étudier',
      'répéter',
      'pratiquer',
      'persévérer',
      'sourire',
      'rire',
      'chanter',
      'danser',
      'nager',
      'courir',
      'bouger',
      'changer',
      'grandir',
      'rêver',
      'méditer',
      'réfléchir',
      'observer',
      'découvrir',
      'explorer',
      'imaginer',
      'voyager',
      'choisir',
      'trouver',
      'gagner',
      'aider',
      'partager',
      'créer',
      'dessiner',
      'tester',
      'viser',
      'réagir',
      'ajuster',
      'améliorer',
      'protéger',
      'organiser',
      'préparer'
    ]
    const tails = ['ici', 'là', 'maintenant', 'demain', 'bientôt', 'ensemble', 'encore', "aujourd'hui"]
    const adj = [
      'prêt',
      'calme',
      'concentré',
      'patient',
      'curieux',
      'serein',
      'sûr',
      'content',
      'motivé',
      'heureux',
      'stable',
      'attentif',
      'détendu',
      'régulier',
      'prudent',
      'rapide',
      'lent',
      'doux',
      'clair',
      'simple',
      'utile'
    ]
    const imper = ['respire', 'avance', 'continue', 'commence', 'écoute', 'regarde', 'lis', 'écris', 'joue', 'attends', 'recommence']
    const imperTails = ['doucement', 'calmement', 'bien', 'ici', 'maintenant', 'encore']

    addCombos2(['je vais'], inf)
    addCombos2(['on va'], inf)
    addCombos2(['je peux'], inf)
    addCombos2(['on peut'], inf)
    addCombos3(['je vais'], inf, tails)
    addCombos3(['on va'], inf, tails)
    addCombos3(['je peux'], inf, tails)
    addCombos3(['on peut'], inf, tails)
    addCombos2(['je suis'], adj)
    addCombos2(['tu es'], adj)
    addCombos2(["c'est"], adj)
    addCombos2(['je suis très'], adj)
    addCombos2(['tu es très'], adj)
    addCombos2(['tout est'], ['clair', 'simple', 'possible', 'utile', 'ok', 'prêt'])
    addCombos3(['tout est'], ['clair', 'simple', 'possible', 'utile', 'ok', 'prêt'], ['ici', 'maintenant', 'demain', 'bientôt'])
    addCombos2(imper, imperTails)
  }

  if (language === 'es') {
    addAll([
      'buenos días',
      'buenas tardes',
      'buenas noches',
      'muchas gracias',
      'por favor',
      'de nada',
      'un momento',
      'sin prisa',
      'con calma',
      'paso a paso',
      'poco a poco',
      'todo bien',
      'todo está bien',
      'estoy bien',
      'estoy aquí',
      'estoy listo',
      'vamos despacio',
      'sigue adelante',
      'bien hecho',
      'buen trabajo',
      'respira despacio'
    ])

    const adj = ['listo', 'calmo', 'tranquilo', 'atento', 'seguro', 'feliz', 'sereno', 'paciente', 'firme', 'suave']
    const tails = ['ahora', 'aquí', 'hoy', 'bien', 'despacio', 'juntos', 'pronto']
    const inf = [
      'aprender',
      'practicar',
      'leer',
      'escribir',
      'respirar',
      'escuchar',
      'mirar',
      'seguir',
      'avanzar',
      'jugar',
      'trabajar',
      'esperar',
      'empezar',
      'continuar',
      'probar',
      'mejorar',
      'descansar',
      'sonreír'
    ]
    const todoAdj = ['bien', 'claro', 'listo', 'posible', 'simple', 'fácil']
    addCombos2(['estoy'], adj)
    addCombos3(['estoy'], adj, tails)
    addCombos2(['estoy muy'], ['bien', 'listo', 'calmo', 'tranquilo'])
    addCombos2(['vamos'], ['bien', 'despacio', 'con calma', 'poco a poco'])
    addCombos2(['vamos a'], inf)
    addCombos3(['vamos a'], inf, tails)
    addCombos2(['respira'], ['despacio', 'hondo', 'tranquilo'])
    addCombos2(['sigue'], ['adelante', 'así'])
    addCombos2(['puedo'], inf)
    addCombos2(['podemos'], inf)
    addCombos3(['yo puedo'], inf, tails)
    addCombos3(['nosotros podemos'], inf, tails)
    addCombos2(['todo está'], todoAdj)
    addCombos3(['todo está'], todoAdj, tails)
    addCombos2(['todo va'], ['bien', 'claro', 'lento', 'suave'])
  }

  if (language === 'it') {
    addAll([
      'buongiorno',
      'buonasera',
      'buonanotte',
      'grazie',
      'grazie mille',
      'per favore',
      'prego',
      'un momento',
      'con calma',
      'senza fretta',
      'passo dopo passo',
      'piano piano',
      'tutto bene',
      'va bene',
      'molto bene',
      'ben fatto',
      'buon lavoro',
      'vai avanti',
      'continua così',
      'respira piano',
      'sono pronto',
      'sono qui'
    ])

    const adj = ['pronto', 'calmo', 'sereno', 'attento', 'sicuro', 'felice', 'tranquillo', 'paziente', 'deciso']
    const tails = ['adesso', 'qui', 'oggi', 'bene', 'lentamente', 'insieme', 'presto']
    const inf = [
      'imparare',
      'praticare',
      'leggere',
      'scrivere',
      'respirare',
      'ascoltare',
      'guardare',
      'continuare',
      'andare',
      'provare',
      'migliorare',
      'riposare',
      'sorridere'
    ]
    addCombos2(['sono'], adj)
    addCombos3(['sono'], adj, tails)
    addCombos2(['sono molto'], ['bene', 'calmo', 'pronto', 'sereno'])
    addCombos2(['posso'], inf)
    addCombos2(['possiamo'], inf)
    addCombos2(['andiamo a'], inf)
    addCombos3(['andiamo a'], inf, tails)
    addCombos2(['tutto è'], ['bene', 'chiaro', 'pronto', 'possibile', 'semplice'])
    addCombos3(['tutto è'], ['bene', 'chiaro', 'pronto', 'possibile', 'semplice'], tails)
    addCombos2(['respira'], ['piano', 'bene', 'con calma'])
    addCombos3(['respira'], ['piano', 'bene'], ['adesso', 'qui', 'oggi'])
    addCombos2(['vai'], ['avanti', 'piano'])
    addCombos2(['continua'], ['così', 'piano'])
  }

  if (language === 'de') {
    addAll([
      'guten morgen',
      'guten tag',
      'guten nachmittag',
      'guten abend',
      'gute nacht',
      'vielen dank',
      'danke schön',
      'bitte',
      'bitte sehr',
      'kein problem',
      'alles gut',
      'alles klar',
      'sehr gut',
      'gut gemacht',
      'mach weiter',
      'weiter so',
      'ganz ruhig',
      'ohne eile',
      'keine eile',
      'bis bald',
      'bis morgen',
      'schritt für schritt',
      'atme ruhig',
      'atme langsam',
      'ich bin bereit',
      'ich bin hier',
      'wir sind bereit',
      'wir sind hier'
    ])

    const adj = ['bereit', 'ruhig', 'wach', 'fit', 'hier', 'entspannt', 'konzentriert', 'geduldig', 'mutig', 'freundlich']
    const tails = ['jetzt', 'heute', 'hier', 'zusammen', 'langsam', 'gleich', 'bald', 'morgen']
    addCombos2(['ich bin'], adj)
    addCombos2(['wir sind'], adj)
    addCombos3(['ich bin'], adj, tails)
    addCombos3(['wir sind'], adj, tails)
    addCombos2(['atme'], ['ruhig', 'langsam'])
    addCombos2(['hör'], ['zu'])
    addCombos2(['sieh'], ['hin'])
  }

  if (language === 'ru') {
    addAll([
      'доброе утро',
      'добрый день',
      'добрый вечер',
      'спокойной ночи',
      'спасибо',
      'большое спасибо',
      'пожалуйста',
      'всё хорошо',
      'всё ясно',
      'всё верно',
      'так держать',
      'молодец',
      'отличная работа',
      'не спеши',
      'шаг за шагом',
      'по чуть чуть',
      'дыши спокойно',
      'дыши медленно',
      'я готов',
      'я здесь',
      'мы готовы',
      'мы здесь',
      'идём дальше',
      'вперёд'
    ])

    const adj = ['готов', 'спокоен', 'внимателен', 'уверен', 'собран', 'сосредоточен', 'терпелив']
    const adjPl = ['готовы', 'спокойны', 'внимательны', 'уверены', 'собраны', 'сосредоточены', 'терпеливы']
    const tails = ['сейчас', 'вместе', 'здесь', 'тихо', 'сегодня', 'рядом', 'спокойно']
    const inf = [
      'учиться',
      'тренироваться',
      'читать',
      'писать',
      'дышать',
      'слушать',
      'смотреть',
      'пробовать',
      'продолжать',
      'начинать',
      'повторять',
      'улучшать',
      'отдыхать'
    ]
    addCombos2(['я'], adj)
    addCombos2(['мы'], adjPl)
    addCombos3(['я'], adj, tails)
    addCombos3(['мы'], adjPl, tails)
    addCombos2(['я могу'], inf)
    addCombos2(['мы можем'], inf)
    addCombos3(['я могу'], inf, tails)
    addCombos3(['мы можем'], inf, tails)
    addCombos2(['дыши'], ['спокойно', 'медленно', 'ровно'])
    addCombos2(['шаг'], ['за шагом'])
  }

  if (language === 'ar') {
    addAll([
      'صباح الخير',
      'مساء الخير',
      'ليلة سعيدة',
      'شكرا',
      'شكرا لك',
      'شكرا جزيلا',
      'من فضلك',
      'عفوا',
      'لا مشكلة',
      'لحظة واحدة',
      'على مهل',
      'بهدوء تام',
      'كل شيء بخير',
      'كل شيء جيد',
      'كل شيء واضح',
      'كل شيء ممكن',
      'حظا سعيدا',
      'عمل رائع',
      'أحسنت',
      'أنا جاهز',
      'أنا هنا',
      'نحن هنا',
      'استمر',
      'تابع للأمام',
      'تنفس ببطء',
      'تنفس بهدوء',
      'خطوة خطوة',
      'شيئا فشيئا'
    ])

    const adj = ['جاهز', 'هادئ', 'مستعد', 'متحمس', 'مركز', 'قوي', 'واثق', 'صبور', 'سريع', 'مستيقظ']
    const adjPl = ['جاهزون', 'هادئون', 'مستعدون', 'متحمسون', 'مركزون', 'أقوياء', 'واثقون', 'صبورون']
    const tails = ['الآن', 'هنا', 'جيدا', 'ببطء', 'بهدوء']
    const imper = ['تنفس', 'استمر', 'تابع', 'ركز', 'اهدأ', 'انتظر', 'ابتسم', 'استمع', 'انظر', 'اكتب', 'اقرأ']
    const directions = ['للأمام', 'للخلف', 'لليمين', 'لليسار']
    addCombos2(['أنا'], adj)
    addCombos2(['نحن'], adjPl)
    addCombos2(['أنت'], ['جاهز', 'مستعد', 'هنا', 'بخير'])
    addCombos3(['أنا'], adj, tails)
    addCombos3(['نحن'], adjPl, tails)
    addCombos2(['كل شيء'], ['بخير', 'جيد', 'واضح', 'ممكن'])
    addCombos2(['تنفس'], ['ببطء', 'بهدوء'])
    addCombos2(['تابع'], ['للأمام', 'الآن'])
    addCombos2(['تابع'], directions)
    addCombos2(imper, ['الآن', 'جيدا', 'ببطء', 'بهدوء'])
  }

  if (phrases.size < targetCount) {
    throw new Error(`Could not generate enough phrases for ${language}: ${phrases.size}/${targetCount}`)
  }

  const out = Array.from(phrases)
  shuffleInPlace(out, rng)
  return out.slice(0, targetCount)
}

async function readExistingBank(language) {
  const filePath = path.join(OUT_DIR, `words.${language}.json`)
  const text = await fs.readFile(filePath, 'utf8')
  return JSON.parse(text)
}

async function writeBank(language, bank) {
  const filePath = path.join(OUT_DIR, `words.${language}.json`)
  await fs.writeFile(filePath, JSON.stringify(bank, null, 2) + '\n', 'utf8')
}

function parseArgs(argv) {
  const args = new Map()
  for (const a of argv) {
    if (!a.startsWith('--')) continue
    const [k, v] = a.replace(/^--/, '').split('=')
    args.set(k, v ?? true)
  }
  return args
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const mult = args.has('mult') ? Number(args.get('mult')) : 1
  if (!Number.isFinite(mult) || mult <= 0) throw new Error(`Invalid --mult=${args.get('mult')}`)

  const langs = args.has('langs')
    ? String(args.get('langs'))
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
    : [...LANGUAGES]

  const phrasesOnly = Boolean(args.get('phrases-only'))

  /** @type {Record<string, any>} */
  const summary = { mult, langs, phrasesOnly, results: {} }

  for (const language of langs) {
    if (!LANGUAGES.includes(language)) throw new Error(`Unsupported language: ${language}`)

    const existing = await readExistingBank(language)
    const targets = {
      words_3_4: Math.max(1, Math.floor((existing.words_3_4?.length ?? 0) * mult)),
      words_4_6: Math.max(1, Math.floor((existing.words_4_6?.length ?? 0) * mult)),
      words_6_10: Math.max(1, Math.floor((existing.words_6_10?.length ?? 0) * mult)),
      phrases: Math.max(1, Math.floor((existing.phrases?.length ?? 0) * mult))
    }

    if (phrasesOnly) {
      const phrases = generatePhrases(language, targets.phrases, existing.phrases ?? [])
      await writeBank(language, { ...existing, phrases })
      summary.results[language] = { phrases: phrases.length }
      continue
    }

    const sourceOverride = args.get(language) === true ? undefined : args.get(language)
    const sourceText = await readSource(sourceOverride, DEFAULT_FREQUENCY_URLS[language])
    const frequencyWords = parseFrequencyList(sourceText)

    const buckets = {
      words_3_4: fillBucket(existing.words_3_4, frequencyWords, language, WORD_RULES.words_3_4, targets.words_3_4),
      words_4_6: fillBucket(existing.words_4_6, frequencyWords, language, WORD_RULES.words_4_6, targets.words_4_6),
      words_6_10: fillBucket(existing.words_6_10, frequencyWords, language, WORD_RULES.words_6_10, targets.words_6_10)
    }
    const phrases = generatePhrases(language, targets.phrases, existing.phrases ?? [])

    const nextBank = { ...buckets, phrases }
    await writeBank(language, nextBank)

    summary.results[language] = {
      words_3_4: nextBank.words_3_4.length,
      words_4_6: nextBank.words_4_6.length,
      words_6_10: nextBank.words_6_10.length,
      phrases: nextBank.phrases.length
    }
  }

  console.log(JSON.stringify(summary, null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
