# Bubble Type
Premium 2D typing game built with Phaser 3 (Matter.js) + Vite + TypeScript.

## Prerequisites
- Node.js 18+ (20+ recommended)

## Install
```bash
npm install
```

## Run (dev)
```bash
npm run dev
```

## Build
```bash
npm run build
```

## Preview production build
```bash
npm run preview
```

## Adding words and phrases
Edit the language files:
- `src/data/words.en.json`
- `src/data/words.fr.json`
- `src/data/words.es.json`

Each file contains four arrays:
- `words_3_4` (3–4 letters)
- `words_4_6` (4–6 letters)
- `words_6_10` (6–10 letters)
- `phrases` (short phrases or sentences)

In dev, the game validates word lengths and logs warnings for any entries that
fall outside their bucket length requirements.

## Tuning difficulty
Open `src/config/difficulty.ts`. You can tune:
- `spawnIntervalMs`: time between spawns
- `gravityY`: fall speed
- `wind`: horizontal drift strength
- `maxBubbles`: max active bubbles
- `bubbleRadius`: min/max size
- `points` and `comboBonus`: scoring
- `collisions`: bubble-to-bubble collisions

## Controls
- Type the bubble text to pop it.
- Backspace to correct the buffer.
- In Settings, toggle language and accent-insensitive input.
