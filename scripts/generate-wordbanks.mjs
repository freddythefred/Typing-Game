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
  const normalized = input.toLowerCase().normalize('NFC')
  const cleaned =
    language === 'fr'
      ? normalized
          .replace(/[^\p{L} ]+/gu, ' ')
          .replace(/\s+/g, ' ')
          .trim()
      : normalized
          .replace(/[^a-z ]+/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()

  return cleaned
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

function generatePhrases(language) {
  const rng = createRng(language === 'fr' ? 1337 : 2025)
  const phrases = new Set()

  const tryAdd = (raw) => {
    const phrase = sanitizePhrase(raw, language)
    if (!phrase) return
    if (wordCount(phrase) > 4) return
    const parts = phrase.split(' ').filter(Boolean)
    if (parts.length === 0) return
    if (parts.some((w) => !isGoodWord(w, language))) return
    if (parts.some((w) => (language === 'fr' ? BANNED_FR.has(w) : BANNED_EN.has(w)))) return
    phrases.add(phrase)
  }

  const addAll = (arr) => arr.forEach((p) => tryAdd(p))

  if (language === 'en') {
    addAll([
      'thank you',
      'thanks a lot',
      'no problem',
      'of course',
      'good morning',
      'good afternoon',
      'good evening',
      'good night',
      'see you soon',
      'see you later',
      'see you tomorrow',
      'take care',
      'good luck',
      'excuse me',
      'sorry about that',
      'i am sorry',
      'i am ready',
      'i am tired',
      'i am busy',
      'i am free',
      'i am fine',
      'i am okay',
      'i am here',
      'i am back',
      'i am done',
      'i am lost',
      'i am safe',
      'i am late',
      'i am early',
      'i feel good',
      'i feel great',
      'i feel better',
      'i feel sick',
      'i feel tired',
      'i feel hungry',
      'i feel cold',
      'i feel hot',
      'right now',
      'not now',
      'not today',
      'just a second',
      'just a minute',
      'one moment please',
      'hold on',
      'wait a moment',
      'take your time',
      'come with me',
      'follow me',
      'stay with me',
      'listen to me',
      'look at this',
      'watch this',
      'i need help',
      'i need water',
      'i need coffee',
      'i need food',
      'i need sleep',
      'i need rest',
      'i need time',
      'i need a break',
      'i need a minute',
      'i need a nap',
      'i need an answer',
      'i need more time',
      'i want coffee',
      'i want water',
      'i want food',
      'i want sleep',
      'i want to go',
      'i want to stay',
      'i want to leave',
      'i want to help',
      'i want to talk',
      'i want to rest',
      'i want to eat',
      'i want to drink',
      'i can help',
      'i can wait',
      'i can try',
      'i can do it',
      'i can make it',
      'i will be back',
      'i will be there',
      'i will call you',
      'can you help',
      'can you help me',
      'can you wait',
      'can you come',
      'can you listen',
      'can you look',
      'can you repeat',
      'can you stop',
      'can you start',
      'can you slow down',
      'can you calm down',
      'please help',
      'please help me',
      'please wait',
      'please listen',
      'please look',
      'please come',
      'please stop',
      'please start',
      'please speak slowly',
      'let us begin',
      'let us go',
      'let us talk',
      'let us try',
      'do not worry',
      'do not panic',
      'do not rush',
      'do not move',
      'do not stop',
      'do you agree',
      'do you know',
      'do you understand',
      'are you okay',
      'are you ready',
      'where are you',
      'where are we',
      'what is this',
      'what is that',
      'what is wrong',
      'what is your name',
      'what time is it',
      'how are you',
      'how are you doing',
      'what are you doing',
      'how was your day',
      'it is fine',
      'it is okay',
      'it is true',
      'it is enough',
      'this is enough',
      'that is fine',
      'that is true'
    ])

    const iAm = [
      'ready',
      'tired',
      'busy',
      'free',
      'fine',
      'okay',
      'sorry',
      'sure',
      'calm',
      'happy',
      'sad',
      'hungry',
      'thirsty',
      'cold',
      'hot',
      'safe',
      'lost',
      'late',
      'early',
      'bored',
      'excited',
      'nervous',
      'stressed',
      'confused'
    ]
    iAm.forEach((adj) => tryAdd(`i am ${adj}`))

    const iFeel = [
      'fine',
      'good',
      'great',
      'better',
      'okay',
      'tired',
      'hungry',
      'thirsty',
      'cold',
      'hot',
      'stressed',
      'nervous',
      'calm',
      'safe',
      'lost',
      'ready'
    ]
    iFeel.forEach((adj) => tryAdd(`i feel ${adj}`))

    const need = [
      'help',
      'water',
      'coffee',
      'tea',
      'food',
      'sleep',
      'rest',
      'time',
      'space',
      'money',
      'advice',
      'support'
    ]
    need.forEach((w) => tryAdd(`i need ${w}`))

    const needA = ['break', 'minute', 'nap', 'ride', 'hand', 'hint', 'plan', 'chance', 'favor', 'key']
    needA.forEach((w) => tryAdd(`i need a ${w}`))

    const iHave = ['time', 'questions', 'an idea', 'a plan', 'a problem', 'no idea', 'no time']
    iHave.forEach((w) => tryAdd(`i have ${w}`))

    const want = ['coffee', 'water', 'tea', 'food', 'sleep', 'rest', 'help', 'answers', 'a break', 'more time']
    want.forEach((w) => tryAdd(`i want ${w}`))

    const wantTo = [
      'go',
      'stay',
      'leave',
      'rest',
      'sleep',
      'eat',
      'drink',
      'talk',
      'help',
      'wait',
      'start',
      'stop',
      'try',
      'learn',
      'play',
      'work',
      'relax',
      'walk',
      'run'
    ]
    wantTo.forEach((v) => tryAdd(`i want to ${v}`))

    const canYou = ['help', 'wait', 'come', 'stay', 'listen', 'look', 'repeat', 'stop', 'start', 'check', 'call']
    canYou.forEach((v) => tryAdd(`can you ${v}`))
    canYou.forEach((v) => tryAdd(`can you please ${v}`))

    const please = ['help', 'wait', 'listen', 'look', 'repeat', 'stop', 'start', 'check', 'come', 'stay', 'call']
    please.forEach((v) => tryAdd(`please ${v}`))

    const pleaseMe = ['help', 'call', 'tell', 'show']
    pleaseMe.forEach((v) => tryAdd(`please ${v} me`))

    const iCan = [
      'help',
      'wait',
      'try',
      'learn',
      'listen',
      'look',
      'go',
      'come',
      'stay',
      'leave',
      'start',
      'stop',
      'work',
      'play',
      'run',
      'walk',
      'talk',
      'rest',
      'sleep'
    ]
    iCan.forEach((v) => tryAdd(`i can ${v}`))

    const iWill = ['help', 'wait', 'try', 'call', 'come', 'go', 'stay', 'leave', 'start', 'stop', 'listen', 'look']
    iWill.forEach((v) => tryAdd(`i will ${v}`))

    const iNeedTo = ['go', 'leave', 'stay', 'rest', 'sleep', 'eat', 'drink', 'work', 'start', 'stop', 'wait']
    iNeedTo.forEach((v) => tryAdd(`i need to ${v}`))

    const iHaveTo = ['go', 'leave', 'stay', 'work', 'start', 'stop', 'wait', 'talk']
    iHaveTo.forEach((v) => tryAdd(`i have to ${v}`))

    const canI = ['help', 'come', 'go', 'stay', 'try', 'start', 'stop', 'leave', 'join']
    canI.forEach((v) => tryAdd(`can i ${v}`))

    const itIs = [
      'fine',
      'okay',
      'good',
      'great',
      'bad',
      'true',
      'late',
      'early',
      'time',
      'enough',
      'important',
      'possible'
    ]
    itIs.forEach((w) => tryAdd(`it is ${w}`))

    const thisIs = ['good', 'bad', 'fine', 'okay', 'enough', 'great', 'wrong', 'right']
    thisIs.forEach((w) => tryAdd(`this is ${w}`))
    thisIs.forEach((w) => tryAdd(`that is ${w}`))

    const iAmNow = ['ready', 'busy', 'free', 'tired', 'hungry', 'sorry', 'fine', 'okay']
    iAmNow.forEach((w) => tryAdd(`i am ${w} now`))

    const iAmToday = ['busy', 'free', 'tired', 'happy', 'sad', 'ready']
    iAmToday.forEach((w) => tryAdd(`i am ${w} today`))
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
      'pas de souci',
      'pas de problème',
      'pas grave',
      'd accord',
      'excuse moi',
      'pardon',
      'je suis désolé',
      'je suis prêt',
      'je suis fatigué',
      'je suis occupé',
      'je suis libre',
      'je suis là',
      'je suis ici',
      'je vais bien',
      'je vais mieux',
      'ça va',
      'comment ça va',
      'où es tu',
      'où sommes nous',
      'que fais tu',
      'tu es prêt',
      'tu as raison',
      'c est bon',
      'c est vrai',
      'c est fini',
      'c est ici',
      'c est parti',
      'c est parfait',
      'c est facile',
      'c est difficile',
      'c est possible',
      'c est important',
      'il est tard',
      'il est tôt',
      'il faut partir',
      'il faut attendre',
      'il faut essayer',
      'il faut y aller',
      'on y va',
      'viens ici',
      'viens avec moi',
      'reste avec moi',
      'aide moi',
      'attends moi',
      'écoute moi',
      'regarde ça',
      'je veux dormir',
      'je veux manger',
      'je veux partir',
      'je veux rester',
      'je veux rentrer',
      'je veux parler',
      'je veux aider',
      'je veux une pause',
      'je veux du café',
      'je veux du thé',
      'je peux aider',
      'je peux venir',
      'je peux attendre',
      'je peux le faire',
      'je peux y aller',
      'je dois partir',
      'je dois rentrer',
      'je dois attendre',
      'je dois travailler',
      'je dois y aller',
      'je vais partir',
      'je vais rentrer',
      'je vais attendre',
      'je vais manger',
      'je vais dormir',
      'je ne sais pas',
      'ne t inquiète pas',
      'ne bouge pas',
      'ne t en fais pas'
    ])

    const jeSuis = [
      'prêt',
      'fatigué',
      'occupé',
      'libre',
      'désolé',
      'calme',
      'heureux',
      'triste',
      'malade',
      'perdu',
      'stressé',
      'inquiet',
      'content',
      'surpris',
      'en retard',
      'en avance',
      'en route',
      'en forme',
      'de retour',
      'en colère'
    ]
    jeSuis.forEach((adj) => tryAdd(`je suis ${adj}`))

    const jePeux = [
      'aider',
      'venir',
      'attendre',
      'parler',
      'écouter',
      'regarder',
      'commencer',
      'arrêter',
      'essayer',
      'prendre',
      'finir',
      'rester',
      'partir'
    ]
    jePeux.forEach((v) => tryAdd(`je peux ${v}`))

    const peuxTu = ['aider', 'venir', 'attendre', 'écouter', 'regarder', 'répéter', 'parler', 'm aider', 'me dire', 'me montrer']
    peuxTu.forEach((v) => tryAdd(`peux tu ${v}`))

    const jeMeSens = ['bien', 'mal', 'mieux', 'fatigué', 'prêt', 'calme', 'stressé', 'perdu', 'heureux', 'triste']
    jeMeSens.forEach((adj) => tryAdd(`je me sens ${adj}`))

    const jeVeux = [
      'dormir',
      'manger',
      'boire',
      'partir',
      'rester',
      'rentrer',
      'parler',
      'aider',
      'attendre',
      'savoir',
      'comprendre',
      'voir',
      'une pause',
      'un moment',
      'du café',
      'du thé',
      'du temps'
    ]
    jeVeux.forEach((w) => tryAdd(`je veux ${w}`))

    const verbInf = [
      'partir',
      'rentrer',
      'attendre',
      'travailler',
      'manger',
      'boire',
      'dormir',
      'parler',
      'venir',
      'aller',
      'rester',
      'commencer',
      'arrêter',
      'essayer',
      'écouter',
      'regarder',
      'prendre',
      'finir'
    ]
    verbInf.forEach((v) => tryAdd(`je dois ${v}`))
    verbInf.forEach((v) => tryAdd(`je vais ${v}`))
    verbInf.forEach((v) => tryAdd(`il faut ${v}`))
    verbInf.forEach((v) => tryAdd(`tu peux ${v}`))
    verbInf.forEach((v) => tryAdd(`on peut ${v}`))
    verbInf.forEach((v) => tryAdd(`on va ${v}`))

    const cEst = [
      'bon',
      'vrai',
      'fini',
      'simple',
      'normal',
      'important',
      'possible',
      'parfait',
      'clair',
      'facile',
      'difficile',
      'incroyable',
      'super',
      'génial',
      'bizarre'
    ]
    cEst.forEach((w) => tryAdd(`c est ${w}`))

    const tuEs = ['prêt', 'fatigué', 'là', 'ici', 'sûr', 'calme']
    tuEs.forEach((w) => tryAdd(`tu es ${w}`))

    const onSeVoit = ['demain', 'bientôt', 'ce soir']
    onSeVoit.forEach((w) => tryAdd(`on se voit ${w}`))

    const merciPour = ['ton aide', 'votre aide', 'tout', 'ça']
    merciPour.forEach((w) => tryAdd(`merci pour ${w}`))

    const silVousPlait = ['s il te plaît', 's il vous plaît']
    silVousPlait.forEach((w) => tryAdd(w))

    addAll([
      'à plus tard',
      'à plus',
      'bonne soirée',
      'bon appétit',
      'bonne idée',
      'très bien',
      'tout va bien',
      'ça marche',
      'c est ok',
      'je comprends',
      'je ne comprends pas',
      'je sais',
      'je sais pas',
      'je suis sûr',
      'tu es sûr',
      'tu es là',
      'tu es ici',
      'où vas tu',
      'où es tu',
      'où est ça',
      'c est où',
      'c est loin',
      'c est près',
      'je veux un café',
      'je veux un thé',
      'je veux un taxi',
      'je veux une idée',
      'je veux un plan',
      'je veux ton avis',
      'je veux mon tour',
      'je veux aller dehors',
      'je veux rester ici',
      'je veux venir aussi',
      'je peux venir aussi',
      'je peux aider aussi',
      'tu peux venir aussi',
      'on peut y aller',
      'on peut attendre',
      'on va y aller',
      'je reviens vite',
      'je suis prêt',
      'je suis là',
      'je suis ici',
      'je suis revenu',
      'je suis parti',
      'je suis calme',
      'je suis content',
      'viens vite',
      'viens maintenant',
      'attends un peu',
      'attends ici',
      'reste ici',
      'reste là',
      'on se calme',
      'on peut y aller',
      'on va commencer',
      'on va essayer',
      'on va attendre',
      'on va partir',
      'tu peux aider',
      'tu peux venir',
      'tu peux attendre',
      'tu peux regarder',
      'tu peux écouter',
      'tu peux répéter',
      'tu peux partir',
      'dis moi',
      'montre moi',
      'répète encore',
      'parle plus lentement'
    ])
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
