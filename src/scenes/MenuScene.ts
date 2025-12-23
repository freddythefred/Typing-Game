import Phaser from 'phaser'
import { DIFFICULTY, type DifficultyId } from '../config/difficulty'
import { createButton } from '../ui/components/UiButton'
import { createGlassPanel } from '../ui/components/GlassPanel'
import { loadSettings, saveSettings } from '../systems/SettingsStore'

type BackBubble = {
  sprite: Phaser.GameObjects.Sprite
  speed: number
  drift: number
}

export class MenuScene extends Phaser.Scene {
  private bubbles: BackBubble[] = []
  private difficultyId: DifficultyId = 'level1'

  constructor() {
    super('Menu')
  }

  create() {
    const settings = loadSettings()
    this.difficultyId = settings.difficulty

    this.addGradientBackdrop()
    this.createBackgroundBubbles()

    const title = this.add.text(this.scale.width / 2, 90, 'Bubble Type', {
      fontFamily: 'BubbleDisplay',
      fontSize: '52px',
      color: '#eaf6ff'
    })
    title.setOrigin(0.5)

    createGlassPanel(this, this.scale.width / 2, 230, 720, 140)

    const difficultyTitle = this.add.text(this.scale.width / 2, 180, 'Choose Mode', {
      fontFamily: 'BubbleDisplay',
      fontSize: '22px',
      color: 'rgba(234,246,255,0.7)'
    })
    difficultyTitle.setOrigin(0.5)

    const cards = Object.values(DIFFICULTY).map((entry, index) => {
      const cardWidth = 150
      const spacing = 20
      const totalWidth = cardWidth * 4 + spacing * 3
      const startX = this.scale.width / 2 - totalWidth / 2 + cardWidth / 2
      const x = startX + index * (cardWidth + spacing)
      const y = 240

      const card = this.add.container(x, y)
      const bg = this.add.graphics()
      const label = this.add.text(0, -10, entry.label, {
        fontFamily: 'BubbleDisplay',
        fontSize: '18px',
        color: '#eaf6ff'
      })
      label.setOrigin(0.5)
      const sub = this.add.text(0, 18, entry.phraseMode ? 'Phrases' : 'Words', {
        fontFamily: 'BubbleDisplay',
        fontSize: '14px',
        color: 'rgba(234,246,255,0.6)'
      })
      sub.setOrigin(0.5)
      card.add([bg, label, sub])
      card.setSize(cardWidth, 70)
      card.setInteractive({ useHandCursor: true })
      card.on('pointerup', () => {
        this.difficultyId = entry.id
        this.updateCardHighlights(cards)
      })
      card.setData('bg', bg)
      card.setData('entry', entry.id)
      return card
    })

    this.updateCardHighlights(cards)

    createButton(this, this.scale.width / 2, 360, 'Play', () => {
      const next = { ...settings, difficulty: this.difficultyId }
      saveSettings(next)
      this.scene.start('Game', { difficulty: this.difficultyId })
    })

    createButton(this, this.scale.width / 2, 430, 'Settings', () => {
      this.scene.start('Settings')
    })

    this.add.text(this.scale.width / 2, this.scale.height - 40, 'Type fast. Stay afloat.', {
      fontFamily: 'BubbleDisplay',
      fontSize: '18px',
      color: 'rgba(234,246,255,0.6)'
    }).setOrigin(0.5)

    this.scale.on('resize', () => {
      this.scene.restart()
    })
  }

  update(time: number, delta: number) {
    const dt = delta / 1000
    const t = time / 1000
    this.bubbles.forEach((bubble, index) => {
      const sway = Math.sin(t * 0.6 + index) * 10
      bubble.sprite.y -= bubble.speed * dt
      bubble.sprite.x += (bubble.drift + sway) * dt
      bubble.sprite.rotation = Math.sin(t * 0.9 + index) * 0.08
      if (bubble.sprite.y < -80) {
        bubble.sprite.y = this.scale.height + 80
      }
      if (bubble.sprite.x < -80) {
        bubble.sprite.x = this.scale.width + 80
      }
      if (bubble.sprite.x > this.scale.width + 80) {
        bubble.sprite.x = -80
      }
    })
  }

  private updateCardHighlights(cards: Phaser.GameObjects.Container[]) {
    cards.forEach((card) => {
      const bg = card.getData('bg') as Phaser.GameObjects.Graphics
      const id = card.getData('entry') as DifficultyId
      const isActive = id === this.difficultyId
      bg.clear()
      bg.fillStyle(0xffffff, isActive ? 0.28 : 0.1)
      bg.fillRoundedRect(-75, -35, 150, 70, 14)
      bg.lineStyle(2, 0xffffff, isActive ? 0.35 : 0.15)
      bg.strokeRoundedRect(-75, -35, 150, 70, 14)
      card.setScale(isActive ? 1.05 : 1)
    })
  }

  private addGradientBackdrop() {
    const backdrop = this.add.graphics()
    backdrop.fillGradientStyle(0x0c1f2d, 0x0c1f2d, 0x13304a, 0x1f4460, 1)
    backdrop.fillRect(0, 0, this.scale.width, this.scale.height)
    backdrop.setDepth(-5)

    const bokeh = this.add.graphics()
    bokeh.fillStyle(0x66e3ff, 0.08)
    for (let i = 0; i < 6; i += 1) {
      const x = Phaser.Math.Between(60, this.scale.width - 60)
      const y = Phaser.Math.Between(60, this.scale.height - 60)
      const radius = Phaser.Math.Between(60, 140)
      bokeh.fillCircle(x, y, radius)
    }
    bokeh.setDepth(-4)
  }

  private createBackgroundBubbles() {
    this.bubbles = []
    for (let i = 0; i < 18; i += 1) {
      const sprite = this.add.sprite(
        Phaser.Math.Between(0, this.scale.width),
        Phaser.Math.Between(0, this.scale.height),
        'bubble'
      )
      const scale = Phaser.Math.FloatBetween(0.1, 0.22)
      sprite.setScale(scale)
      sprite.setAlpha(0.2)
      sprite.setDepth(-1)
      this.bubbles.push({
        sprite,
        speed: Phaser.Math.FloatBetween(12, 30),
        drift: Phaser.Math.FloatBetween(-8, 8)
      })
    }
  }
}
