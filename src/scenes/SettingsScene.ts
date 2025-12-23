import Phaser from 'phaser'
import { createButton } from '../ui/components/UiButton'
import { createGlassPanel } from '../ui/components/GlassPanel'
import { loadSettings, saveSettings, type Settings } from '../systems/SettingsStore'

export class SettingsScene extends Phaser.Scene {
  private settings!: Settings
  private languageText!: Phaser.GameObjects.Text
  private accentText!: Phaser.GameObjects.Text
  private volumeText!: Phaser.GameObjects.Text

  constructor() {
    super('Settings')
  }

  create() {
    this.settings = loadSettings()
    this.add.graphics().fillGradientStyle(0x0b1b2a, 0x0b1b2a, 0x122c42, 0x1c3f58, 1).fillRect(
      0,
      0,
      this.scale.width,
      this.scale.height
    )

    createGlassPanel(this, this.scale.width / 2, 240, 600, 320)

    this.add
      .text(this.scale.width / 2, 120, 'Settings', {
        fontFamily: 'BubbleDisplay',
        fontSize: '42px',
        color: '#eaf6ff'
      })
      .setOrigin(0.5)

    this.languageText = this.add
      .text(this.scale.width / 2, 200, '', {
        fontFamily: 'BubbleDisplay',
        fontSize: '22px',
        color: '#eaf6ff'
      })
      .setOrigin(0.5)

    this.accentText = this.add
      .text(this.scale.width / 2, 260, '', {
        fontFamily: 'BubbleDisplay',
        fontSize: '22px',
        color: '#eaf6ff'
      })
      .setOrigin(0.5)

    this.volumeText = this.add
      .text(this.scale.width / 2, 320, '', {
        fontFamily: 'BubbleDisplay',
        fontSize: '22px',
        color: '#eaf6ff'
      })
      .setOrigin(0.5)

    createButton(this, this.scale.width / 2 - 160, 200, 'Language', () => {
      this.settings.language = this.settings.language === 'en' ? 'fr' : 'en'
      this.refresh()
    }, { width: 140, height: 44 })

    createButton(this, this.scale.width / 2 - 160, 260, 'Accents', () => {
      this.settings.accentInsensitive = !this.settings.accentInsensitive
      this.refresh()
    }, { width: 140, height: 44 })

    createButton(this, this.scale.width / 2 - 160, 320, 'Volume -', () => {
      this.settings.volume = Math.max(0, Math.round((this.settings.volume - 0.1) * 10) / 10)
      this.refresh()
    }, { width: 140, height: 44 })

    createButton(this, this.scale.width / 2 + 160, 320, 'Volume +', () => {
      this.settings.volume = Math.min(1, Math.round((this.settings.volume + 0.1) * 10) / 10)
      this.refresh()
    }, { width: 140, height: 44 })

    createButton(this, this.scale.width / 2, this.scale.height - 80, 'Back', () => {
      saveSettings(this.settings)
      this.scene.start('Menu')
    })

    this.refresh()
  }

  private refresh() {
    saveSettings(this.settings)
    this.languageText.setText(`Language: ${this.settings.language === 'en' ? 'English' : 'Français'}`)
    this.accentText.setText(
      `Accent-insensitive input: ${this.settings.accentInsensitive ? 'On' : 'Off'}`
    )
    this.volumeText.setText(`Volume: ${Math.round(this.settings.volume * 100)}%`)
  }
}
