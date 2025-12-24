import Phaser from 'phaser'
import { createButton } from '../ui/components/UiButton'
import { createGlassPanel } from '../ui/components/GlassPanel'
import { loadSettings, saveSettings, type Settings } from '../systems/SettingsStore'
import { createUnderwaterBackground, type UnderwaterBackground } from '../ui/fx/UnderwaterBackground'

export class SettingsScene extends Phaser.Scene {
  private settings!: Settings
  private languageText!: Phaser.GameObjects.Text
  private accentText!: Phaser.GameObjects.Text
  private volumeText!: Phaser.GameObjects.Text
  private backdropFx?: UnderwaterBackground

  constructor() {
    super('Settings')
  }

  create() {
    this.settings = loadSettings()
    const uiScale = Phaser.Math.Clamp(Math.min(this.scale.width / 1280, this.scale.height / 720), 0.82, 1.15)
    const centerX = this.scale.width / 2
    this.cameras.main.fadeIn(520, 4, 10, 18)

    this.backdropFx?.destroy()
    this.backdropFx = createUnderwaterBackground(this, {
      depth: -12,
      withDust: true,
      withPointerLight: true,
      withShafts: true,
      accent: 0xffcf66
    })

    const panelWidth = Math.min(Math.round(720 * uiScale), this.scale.width - 60)
    const panelHeight = Math.round(360 * uiScale)
    createGlassPanel(this, centerX, Math.round(260 * uiScale), panelWidth, panelHeight, {
      depth: 6,
      radius: Math.round(28 * uiScale),
      accent: 0xffcf66,
      float: true
    })

    this.add
      .text(centerX, Math.round(120 * uiScale), 'Settings', {
        fontFamily: 'BubbleDisplay',
        fontSize: `${Math.round(52 * uiScale)}px`,
        color: '#eaf6ff'
      })
      .setOrigin(0.5)
      .setDepth(10)
      .setStroke('rgba(255,207,102,0.2)', 8)
      .setShadow(0, 12, 'rgba(0,0,0,0.35)', 22, true, true)

    this.languageText = this.add
      .text(centerX, Math.round(204 * uiScale), '', {
        fontFamily: 'BubbleDisplay',
        fontSize: `${Math.round(22 * uiScale)}px`,
        color: '#eaf6ff'
      })
      .setOrigin(0.5)
      .setDepth(10)
      .setShadow(0, 6, 'rgba(0,0,0,0.28)', 12, false, true)

    this.accentText = this.add
      .text(centerX, Math.round(268 * uiScale), '', {
        fontFamily: 'BubbleDisplay',
        fontSize: `${Math.round(22 * uiScale)}px`,
        color: '#eaf6ff'
      })
      .setOrigin(0.5)
      .setDepth(10)
      .setShadow(0, 6, 'rgba(0,0,0,0.28)', 12, false, true)

    this.volumeText = this.add
      .text(centerX, Math.round(332 * uiScale), '', {
        fontFamily: 'BubbleDisplay',
        fontSize: `${Math.round(22 * uiScale)}px`,
        color: '#eaf6ff'
      })
      .setOrigin(0.5)
      .setDepth(10)
      .setShadow(0, 6, 'rgba(0,0,0,0.28)', 12, false, true)

    const buttonWidth = Math.min(Math.round(170 * uiScale), this.scale.width - 80)
    const buttonHeight = Math.round(50 * uiScale)
    const buttonOffsetX = Math.min(Math.round(210 * uiScale), Math.round(panelWidth * 0.36))

    const languageButton = createButton(this, centerX - buttonOffsetX, Math.round(204 * uiScale), 'Language', () => {
      this.settings.language = this.settings.language === 'en' ? 'fr' : 'en'
      this.refresh()
      this.pulse(this.languageText)
    }, { width: buttonWidth, height: buttonHeight, depth: 9, accent: 0xffcf66 })

    const accentsButton = createButton(this, centerX - buttonOffsetX, Math.round(268 * uiScale), 'Accents', () => {
      this.settings.accentInsensitive = !this.settings.accentInsensitive
      this.refresh()
      this.pulse(this.accentText)
    }, { width: buttonWidth, height: buttonHeight, depth: 9, accent: 0xffcf66 })

    const volumeDown = createButton(this, centerX - buttonOffsetX, Math.round(332 * uiScale), 'Volume -', () => {
      this.settings.volume = Math.max(0, Math.round((this.settings.volume - 0.1) * 10) / 10)
      this.refresh()
      this.pulse(this.volumeText)
    }, { width: buttonWidth, height: buttonHeight, depth: 9, accent: 0xffcf66 })

    const volumeUp = createButton(this, centerX + buttonOffsetX, Math.round(332 * uiScale), 'Volume +', () => {
      this.settings.volume = Math.min(1, Math.round((this.settings.volume + 0.1) * 10) / 10)
      this.refresh()
      this.pulse(this.volumeText)
    }, { width: buttonWidth, height: buttonHeight, depth: 9, accent: 0xffcf66 })

    let transitioning = false
    const backButton = createButton(this, centerX, this.scale.height - Math.round(90 * uiScale), 'Back', () => {
      if (transitioning) return
      transitioning = true
      backButton.disableInteractive()
      languageButton.disableInteractive()
      accentsButton.disableInteractive()
      volumeDown.disableInteractive()
      volumeUp.disableInteractive()

      saveSettings(this.settings)
      this.cameras.main.fadeOut(240, 4, 10, 18)
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.start('Menu')
      })
    }, { width: Math.min(Math.round(260 * uiScale), this.scale.width - 80), height: Math.round(58 * uiScale), depth: 10, accent: 0x66e3ff })

    const vignette = this.add
      .image(centerX, this.scale.height / 2, 'vignette')
      .setBlendMode(Phaser.BlendModes.MULTIPLY)
      .setAlpha(0.14)
      .setDepth(90)
    vignette.setScale(Math.max(this.scale.width, this.scale.height) / 512)

    this.refresh()

    this.scale.on('resize', () => this.scene.restart())
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.backdropFx?.destroy()
      this.backdropFx = undefined
    })
  }

  update(time: number, delta: number) {
    this.backdropFx?.update(time, delta)
  }

  private refresh() {
    saveSettings(this.settings)
    this.languageText.setText(`Language: ${this.settings.language === 'en' ? 'English' : 'Français'}`)
    this.accentText.setText(
      `Accent-insensitive input: ${this.settings.accentInsensitive ? 'On' : 'Off'}`
    )
    this.volumeText.setText(`Volume: ${Math.round(this.settings.volume * 100)}%`)
  }

  private pulse(target: Phaser.GameObjects.Text) {
    this.tweens.add({
      targets: target,
      scale: 1.05,
      duration: 120,
      yoyo: true,
      ease: 'Sine.easeOut'
    })
  }
}
