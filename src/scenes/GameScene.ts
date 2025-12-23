import Phaser from 'phaser'
import { DIFFICULTY, type DifficultyId } from '../config/difficulty'
import { BubbleManager, type BubbleItem } from '../systems/BubbleManager'
import { TypingSystem } from '../systems/TypingSystem'
import { EffectsSystem } from '../systems/EffectsSystem'
import { AudioSystem } from '../systems/AudioSystem'
import { loadSettings } from '../systems/SettingsStore'
import { getBank, pickWord } from '../data/wordBank'
import { validateWordBank } from '../data/validate'

type HudRefs = {
  score: Phaser.GameObjects.Text
  combo: Phaser.GameObjects.Text
  accuracy: Phaser.GameObjects.Text
  lives: Phaser.GameObjects.Text
  buffer: Phaser.GameObjects.Text
}

export class GameScene extends Phaser.Scene {
  private bubbleManager!: BubbleManager
  private typingSystem!: TypingSystem
  private effects!: EffectsSystem
  private audio!: AudioSystem
  private difficultyId: DifficultyId = 'level1'
  private water!: Phaser.GameObjects.TileSprite
  private spawnTimer?: Phaser.Time.TimerEvent
  private hud!: HudRefs
  private settings = loadSettings()
  private score = 0
  private combo = 0
  private longestCombo = 0
  private lives = 5
  private popped = 0
  private missed = 0
  private startTime = 0
  private readonly windForce = new Phaser.Math.Vector2(0, 0)

  constructor() {
    super('Game')
  }

  create(data: { difficulty?: DifficultyId }) {
    this.cleanup()

    this.score = 0
    this.combo = 0
    this.longestCombo = 0
    this.lives = 5
    this.popped = 0
    this.missed = 0

    this.settings = loadSettings()
    this.difficultyId = data.difficulty ?? this.settings.difficulty ?? 'level1'
    const config = DIFFICULTY[this.difficultyId]

    if (import.meta.env.DEV) {
      validateWordBank(getBank(this.settings.language), this.settings.language)
    }

    this.addGradientBackdrop()
    this.createWaterline()

    this.matter.world.setBounds(0, 0, this.scale.width, this.scale.height, 64, true, true, false, true)
    this.matter.world.setGravity(0, config.gravityY)
    const walls = this.matter.world.walls
    Object.values(walls).forEach((wall) => {
      if (wall) {
        wall.collisionFilter.category = 0x0001
      }
    })

    this.bubbleManager = new BubbleManager(this)
    this.effects = new EffectsSystem(this)
    this.audio = new AudioSystem(this, this.settings.volume)
    this.typingSystem = new TypingSystem(this, this.bubbleManager, {
      onCorrectKey: () => {
        this.audio.playTick()
      },
      onErrorKey: () => {
        this.combo = 0
        this.audio.playError()
        this.effects.shake(0.006, 120)
        this.updateHud()
      },
      onComplete: (bubble) => {
        this.popBubble(bubble)
      }
    })
    this.typingSystem.setAccentInsensitive(this.settings.accentInsensitive)

    this.createHud()
    this.startTime = this.time.now

    this.spawnTimer = this.time.addEvent({
      delay: config.spawnIntervalMs,
      loop: true,
      callback: () => this.spawnBubble()
    })
    this.spawnBubble()

    this.matter.world.on('collisionstart', this.handleCollision, this)

    this.scale.on('resize', this.handleResize, this)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this)
  }

  update(time: number, delta: number) {
    const config = DIFFICULTY[this.difficultyId]
    this.bubbleManager.update(delta)

    this.bubbleManager.getActiveBubbles().forEach((bubble) => {
      const wind = Math.sin((time / 1000) * 0.6 + bubble.id) * config.wind
      this.windForce.set(wind, 0)
      bubble.sprite.applyForce(this.windForce)
    })

    this.water.tilePositionX += delta * 0.03
    this.hud.buffer.setText(this.typingSystem.getBuffer())
    this.updateHud()
  }

  private spawnBubble() {
    const config = DIFFICULTY[this.difficultyId]
    if (this.bubbleManager.getActiveBubbles().length >= config.maxBubbles) return

    const word = pickWord(this.settings.language, this.difficultyId)
    const normalized = this.normalize(word, this.settings.accentInsensitive)
    this.bubbleManager.spawn(word, normalized, config)
  }

  private popBubble(bubble: BubbleItem) {
    const config = DIFFICULTY[this.difficultyId]
    this.combo += 1
    this.longestCombo = Math.max(this.longestCombo, this.combo)
    const earned = config.points + this.combo * config.comboBonus
    this.score += earned
    this.popped += 1

    this.effects.pop(bubble.sprite.x, bubble.sprite.y)
    this.audio.playPop()

    this.bubbleManager.release(bubble)
    this.updateHud()
  }

  private handleCollision(event: Phaser.Physics.Matter.Events.CollisionStartEvent) {
    event.pairs.forEach((pair) => {
      const bodyA = pair.bodyA
      const bodyB = pair.bodyB
      if (bodyA.label === 'water' || bodyB.label === 'water') {
        const other = bodyA.label === 'water' ? bodyB : bodyA
        const gameObject = other.gameObject as Phaser.Physics.Matter.Sprite | undefined
        const bubble = gameObject?.getData('bubble') as BubbleItem | undefined
        if (bubble && bubble.active) {
          this.missBubble(bubble)
        }
      }
    })
  }

  private missBubble(bubble: BubbleItem) {
    const config = DIFFICULTY[this.difficultyId]
    this.lives = Math.max(0, this.lives - 1)
    this.combo = 0
    this.missed += 1
    this.score = Math.max(0, this.score - Math.round(config.points * 0.4))

    this.effects.splash(bubble.sprite.x, this.water.y)
    this.audio.playSplash()
    this.effects.shake(0.004, 140)
    this.bubbleManager.release(bubble)
    this.updateHud()

    if (this.lives <= 0) {
      this.endGame()
    }
  }

  private endGame() {
    this.spawnTimer?.destroy()
    this.typingSystem.destroy()
    const stats = this.typingSystem.getStats()
    const duration = (this.time.now - this.startTime) / 1000
    const accuracy = stats.totalKeys > 0 ? stats.correctKeys / stats.totalKeys : 1
    const charsPerSecond = stats.correctKeys / Math.max(1, duration)

    this.scene.start('Result', {
      score: this.score,
      accuracy,
      longestCombo: this.longestCombo,
      popped: this.popped,
      missed: this.missed,
      cps: charsPerSecond
    })
  }

  private createWaterline() {
    const height = this.scale.height
    const waterHeight = Math.max(120, height * 0.18)
    this.water = this.add
      .tileSprite(0, height - waterHeight, this.scale.width, waterHeight, 'water')
      .setOrigin(0, 0)
      .setDepth(1)
    this.matter.add.rectangle(
      this.scale.width / 2,
      height - waterHeight / 2,
      this.scale.width,
      waterHeight,
      {
        isSensor: true,
        isStatic: true,
        label: 'water',
        collisionFilter: { category: 0x0001 }
      }
    )
  }

  private handleResize() {
    this.scene.restart({ difficulty: this.difficultyId })
  }

  private cleanup() {
    this.spawnTimer?.destroy()
    this.spawnTimer = undefined

    this.typingSystem?.destroy()
    this.matter.world.off('collisionstart', this.handleCollision, this)
    this.scale.off('resize', this.handleResize, this)

    this.bubbleManager?.clear()
  }

  private createHud() {
    const panel = this.add.graphics().setDepth(8)
    panel.fillStyle(0xffffff, 0.12)
    panel.fillRoundedRect(20, 20, 360, 140, 18)
    panel.lineStyle(2, 0xffffff, 0.2)
    panel.strokeRoundedRect(20, 20, 360, 140, 18)

    this.hud = {
      score: this.add.text(40, 40, '', {
        fontFamily: 'BubbleDisplay',
        fontSize: '20px',
        color: '#eaf6ff'
      }).setDepth(9),
      combo: this.add.text(40, 70, '', {
        fontFamily: 'BubbleDisplay',
        fontSize: '18px',
        color: '#66e3ff'
      }).setDepth(9),
      accuracy: this.add.text(40, 98, '', {
        fontFamily: 'BubbleDisplay',
        fontSize: '16px',
        color: 'rgba(234,246,255,0.7)'
      }).setDepth(9),
      lives: this.add.text(40, 122, '', {
        fontFamily: 'BubbleDisplay',
        fontSize: '16px',
        color: 'rgba(234,246,255,0.7)'
      }).setDepth(9),
      buffer: this.add.text(this.scale.width / 2, this.scale.height - 60, '', {
        fontFamily: 'BubbleDisplay',
        fontSize: '24px',
        color: '#eaf6ff'
      }).setDepth(9)
    }
    this.hud.buffer.setOrigin(0.5)

    const bufferPanel = this.add.graphics().setDepth(8)
    bufferPanel.fillStyle(0xffffff, 0.12)
    bufferPanel.fillRoundedRect(
      this.scale.width / 2 - 240,
      this.scale.height - 90,
      480,
      60,
      18
    )
    bufferPanel.lineStyle(2, 0xffffff, 0.2)
    bufferPanel.strokeRoundedRect(
      this.scale.width / 2 - 240,
      this.scale.height - 90,
      480,
      60,
      18
    )
  }

  private updateHud() {
    const stats = this.typingSystem.getStats()
    const accuracy = stats.totalKeys > 0 ? (stats.correctKeys / stats.totalKeys) * 100 : 100
    this.hud.score.setText(`Score: ${this.score}`)
    this.hud.combo.setText(`Combo: ${this.combo}`)
    this.hud.accuracy.setText(`Accuracy: ${accuracy.toFixed(0)}%`)
    this.hud.lives.setText(`Lives: ${this.lives}`)
  }

  private addGradientBackdrop() {
    const backdrop = this.add.graphics()
    backdrop.fillGradientStyle(0x0c1f2d, 0x0c1f2d, 0x123349, 0x234863, 1)
    backdrop.fillRect(0, 0, this.scale.width, this.scale.height)
    backdrop.setDepth(-5)

    const bokeh = this.add.graphics()
    bokeh.fillStyle(0x66e3ff, 0.08)
    for (let i = 0; i < 7; i += 1) {
      const x = Phaser.Math.Between(60, this.scale.width - 60)
      const y = Phaser.Math.Between(60, this.scale.height - 60)
      const radius = Phaser.Math.Between(70, 160)
      bokeh.fillCircle(x, y, radius)
    }
    bokeh.setDepth(-4)
  }

  private normalize(text: string, accentInsensitive: boolean) {
    const lowered = text.toLowerCase()
    if (!accentInsensitive) return lowered
    return lowered.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  }
}
