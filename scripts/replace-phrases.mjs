import fs from 'node:fs'

const filePath = process.argv[2]
if (!filePath) {
  console.error('Usage: node scripts/replace-phrases.mjs <path-to-words.xx.json>')
  process.exit(1)
}

const original = fs.readFileSync(filePath, 'utf8')
const newline = original.includes('\r\n') ? '\r\n' : '\n'

const phrases = fs
  .readFileSync(0, 'utf8')
  .split(/\r?\n/)
  .map((s) => s.trim())
  .filter(Boolean)

const startIndex = original.indexOf('  "phrases": [')
if (startIndex === -1) {
  throw new Error(`Could not find "phrases" array in ${filePath}`)
}

const lastBraceIndex = original.lastIndexOf('}')
if (lastBraceIndex === -1 || lastBraceIndex < startIndex) {
  throw new Error(`Could not find end of JSON object in ${filePath}`)
}

function escapeJsonString(value) {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

const phraseLines = phrases.map((p) => `    "${escapeJsonString(p)}"`).join(`,${newline}`)
const newTail = `  "phrases": [${newline}${phraseLines}${newline}  ]${newline}}`
const out = original.slice(0, startIndex) + newTail + original.slice(lastBraceIndex + 1)

fs.writeFileSync(filePath, out, 'utf8')
console.log(`[Typingame] Updated ${filePath} phrases: ${phrases.length}`)
