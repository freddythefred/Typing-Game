import Phaser from 'phaser'
import { createButton } from '../ui/components/UiButton'
import { createGlassPanel } from '../ui/components/GlassPanel'
import { createUnderwaterBackground, type UnderwaterBackground } from '../ui/fx/UnderwaterBackground'

type ResultData = {
  score: number
  accuracy: number
  longestCombo: number
  popped: number
  missed: number
  cps: number
}

export class ResultScene extends Phaser.Scene {
  private backdropFx?: UnderwaterBackground

  constructor() {
    super('Result')
  }

  create(data: ResultData) {
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
      `Score: ${data.score}`,
      `Accuracy: ${(data.accuracy * 100).toFixed(0)}%`,
      `Longest Streak: ${data.longestCombo}`,
      `Bubbles Popped: ${data.popped}`,
      `Bubbles Missed: ${data.missed}`,
      `Chars/sec: ${data.cps.toFixed(1)}`
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
    const backButton = createButton(this, centerX, this.scale.height - Math.round(90 * uiScale), 'Back to Menu', () => {
      if (transitioning) return
      transitioning = true
      backButton.disableInteractive()
      this.cameras.main.fadeOut(240, 4, 10, 18)
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.start('Menu')
      })
    }, { width: Math.min(Math.round(320 * uiScale), this.scale.width - 80), height: Math.round(60 * uiScale), depth: 10 })

    const vignette = this.add
      .image(centerX, this.scale.height / 2, 'vignette')
      .setBlendMode(Phaser.BlendModes.MULTIPLY)
      .setAlpha(0.14)
      .setDepth(90)
    vignette.setScale(Math.max(this.scale.width, this.scale.height) / 512)

    const entrance = [...statTexts, backButton].filter(Boolean) as Phaser.GameObjects.GameObject[]
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

    this.scale.on('resize', () => this.scene.restart())
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.backdropFx?.destroy()
      this.backdropFx = undefined
    })
  }

  update(time: number, delta: number) {
    this.backdropFx?.update(time, delta)
  }
}
