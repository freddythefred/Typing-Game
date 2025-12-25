import Phaser from 'phaser'
import type { DifficultyId } from '../config/difficulty'
import { createButton } from '../ui/components/UiButton'
import { createGlassPanel } from '../ui/components/GlassPanel'
import { createUnderwaterBackground, type UnderwaterBackground } from '../ui/fx/UnderwaterBackground'
import { loadSettings } from '../systems/SettingsStore'
import { recordBestScore } from '../systems/BestScoreStore'

type ResultData = {
  score: number
  accuracy: number
  longestCombo: number
  popped: number
  missed: number
  cps: number
  difficultyId?: DifficultyId
}

export class ResultScene extends Phaser.Scene {
  private backdropFx?: UnderwaterBackground
  private lastData?: ResultData

  constructor() {
    super('Result')
  }

  create(data?: Partial<ResultData>) {
    const resolved: ResultData = {
      score: data?.score ?? 0,
      accuracy: data?.accuracy ?? 1,
      longestCombo: data?.longestCombo ?? 0,
      popped: data?.popped ?? 0,
      missed: data?.missed ?? 0,
      cps: data?.cps ?? 0,
      difficultyId: data?.difficultyId
    }

    this.lastData = resolved
    this.cameras.main.fadeIn(520, 4, 10, 18)
    const uiScale = Phaser.Math.Clamp(Math.min(this.scale.width / 1280, this.scale.height / 720), 0.82, 1.15)
    const centerX = this.scale.width / 2

    this.backdropFx?.destroy()
    this.backdropFx = createUnderwaterBackground(this, {
      depth: -12,
      withDust: true,
      withPointerLight: true,
      withShafts: true,
      accent: 0x66e3ff
    })

    const panelWidth = Math.min(Math.round(760 * uiScale), this.scale.width - 60)
    const panelHeight = Math.round(420 * uiScale)
    createGlassPanel(this, centerX, Math.round(280 * uiScale), panelWidth, panelHeight, {
      depth: 6,
      radius: Math.round(30 * uiScale),
      accent: 0x66e3ff,
      float: true
    })

    this.add
      .text(centerX, Math.round(120 * uiScale), 'Run Complete', {
        fontFamily: 'BubbleDisplay',
        fontSize: `${Math.round(54 * uiScale)}px`,
        color: '#eaf6ff'
      })
      .setOrigin(0.5)
      .setDepth(10)
      .setStroke('rgba(102,227,255,0.2)', 8)
      .setShadow(0, 12, 'rgba(0,0,0,0.35)', 22, true, true)

    const stats = [
      `Score: ${resolved.score}`,
      `Accuracy: ${(resolved.accuracy * 100).toFixed(0)}%`,
      `Longest Streak: ${resolved.longestCombo}`,
      `Bubbles Popped: ${resolved.popped}`,
      `Bubbles Missed: ${resolved.missed}`,
      `Chars/sec: ${resolved.cps.toFixed(1)}`
    ]

    const statTexts = stats.map((line, index) =>
      this.add
        .text(centerX, Math.round(210 * uiScale) + index * Math.round(40 * uiScale), line, {
          fontFamily: 'BubbleDisplay',
          fontSize: `${Math.round(22 * uiScale)}px`,
          color: '#eaf6ff'
        })
        .setOrigin(0.5)
        .setDepth(10)
        .setShadow(0, 6, 'rgba(0,0,0,0.28)', 12, false, true)
    )

    let transitioning = false
    const buttonWidth = Math.min(Math.round(320 * uiScale), this.scale.width - 80)
    const resolvedDifficulty = resolved.difficultyId ?? loadSettings().difficulty ?? 'level1'
    recordBestScore(resolvedDifficulty, resolved.score)

    let playAgainButton: Phaser.GameObjects.Container | undefined
    let backButton: Phaser.GameObjects.Container | undefined

    const restartWithData = () => {
      if (transitioning) return
      this.scene.restart(this.lastData)
    }
    this.scale.on('resize', restartWithData)

    const onKeyDown = (event: KeyboardEvent) => {
      if (transitioning) return
      if (event.key === 'Enter' || event.key === 'r' || event.key === 'R') {
        startWithFade(() => this.scene.start('Game', { difficulty: resolvedDifficulty }))
        return
      }
      if (event.key === 'Escape' || event.key === 'm' || event.key === 'M') {
        startWithFade(() => this.scene.start('Menu'))
      }
    }
    this.input.keyboard?.on('keydown', onKeyDown)

    const startWithFade = (start: () => void) => {
      if (transitioning) return
      transitioning = true
      playAgainButton?.disableInteractive()
      backButton?.disableInteractive()
      this.scale.off('resize', restartWithData)
      this.input.keyboard?.off('keydown', onKeyDown)

      let started = false
      const doStart = () => {
        if (started) return
        started = true
        start()
      }

      this.cameras.main.fadeOut(240, 4, 10, 18)
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, doStart)
      this.time.delayedCall(280, doStart)
    }

    playAgainButton = createButton(
      this,
      centerX,
      this.scale.height - Math.round(160 * uiScale),
      'Play Again',
      () => startWithFade(() => this.scene.start('Game', { difficulty: resolvedDifficulty })),
      { width: buttonWidth, height: Math.round(60 * uiScale), depth: 10, accent: 0xffcf66 }
    )

    backButton = createButton(
      this,
      centerX,
      this.scale.height - Math.round(90 * uiScale),
      'Back to Menu',
      () => startWithFade(() => this.scene.start('Menu')),
      { width: buttonWidth, height: Math.round(60 * uiScale), depth: 10 }
    )

    const vignette = this.add
      .image(centerX, this.scale.height / 2, 'vignette')
      .setBlendMode(Phaser.BlendModes.MULTIPLY)
      .setAlpha(0.14)
      .setDepth(90)
    vignette.setScale(Math.max(this.scale.width, this.scale.height) / 512)

    const entrance = [...statTexts, playAgainButton, backButton].filter(Boolean) as Phaser.GameObjects.GameObject[]
    entrance.forEach((obj) => {
      const anyObj = obj as unknown as Phaser.GameObjects.Components.Transform &
        Phaser.GameObjects.Components.Alpha & { y: number; alpha: number }
      anyObj.alpha = 0
      anyObj.y += 10
    })
    this.tweens.add({
      targets: entrance,
      alpha: 1,
      y: '-=10',
      duration: 520,
      ease: 'Cubic.easeOut',
      stagger: 35,
      delay: 160
    })

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', restartWithData)
      this.input.keyboard?.off('keydown', onKeyDown)
      this.backdropFx?.destroy()
      this.backdropFx = undefined
    })
  }

  update(time: number, delta: number) {
    this.backdropFx?.update(time, delta)
  }
}
