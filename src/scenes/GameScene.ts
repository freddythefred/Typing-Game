import Phaser from 'phaser'
import { DIFFICULTY, type DifficultyId } from '../config/difficulty'
import { BubbleManager, type BubbleItem } from '../systems/BubbleManager'
import { TypingSystem } from '../systems/TypingSystem'
import { EffectsSystem } from '../systems/EffectsSystem'
import { AudioSystem } from '../systems/AudioSystem'
import { loadSettings } from '../systems/SettingsStore'
import { getBank, pickWord } from '../data/wordBank'
import { validateWordBank } from '../data/validate'
import { createGlassPanel } from '../ui/components/GlassPanel'
import { createUnderwaterBackground, type UnderwaterBackground } from '../ui/fx/UnderwaterBackground'

type HudRefs = {
  panel: Phaser.GameObjects.Container
  bufferPanel: Phaser.GameObjects.Container
  score: Phaser.GameObjects.Text
  combo: Phaser.GameObjects.Text
  accuracy: Phaser.GameObjects.Text
  lives: Phaser.GameObjects.Text
  buffer: Phaser.GameObjects.Text
  comboBar: Phaser.GameObjects.Graphics
  lifeBubbles: Phaser.GameObjects.Sprite[]
  bufferGlow: Phaser.GameObjects.Image
}

export class GameScene extends Phaser.Scene {
  private bubbleManager!: BubbleManager
  private typingSystem!: TypingSystem
  private effects!: EffectsSystem
  private audio!: AudioSystem
  private difficultyId: DifficultyId = 'level1'
  private backdropFx?: UnderwaterBackground
  private water!: Phaser.GameObjects.TileSprite
  private waterShine?: Phaser.GameObjects.TileSprite
  private spawnTimer?: Phaser.Time.TimerEvent
  private hud!: HudRefs
  private settings = loadSettings()
  private score = 0
  private combo = 0
  private longestCombo = 0
  private lives = 5
  private lastScore = 0
  private lastCombo = 0
  private lastLives = 5
  private isEnding = false
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
    this.lastScore = 0
    this.lastCombo = 0
    this.lastLives = 5
    this.isEnding = false
    this.popped = 0
    this.missed = 0

    this.settings = loadSettings()
    this.difficultyId = data.difficulty ?? this.settings.difficulty ?? 'level1'
    const config = DIFFICULTY[this.difficultyId]

    if (import.meta.env.DEV) {
      validateWordBank(getBank(this.settings.language), this.settings.language)
    }

    this.cameras.main.fadeIn(360, 4, 10, 18)

    this.backdropFx?.destroy()
    this.backdropFx = createUnderwaterBackground(this, {
      depth: -12,
      withDust: true,
      withPointerLight: true,
      withShafts: true,
      accent: 0x66e3ff
    })

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
        this.flashBuffer(0x66e3ff, 0.15)
      },
      onErrorKey: () => {
        this.combo = 0
        this.audio.playError()
        this.effects.shake(0.006, 120)
        this.flashBuffer(0xff5a7a, 0.22)
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

    const vignette = this.add
      .image(this.scale.width / 2, this.scale.height / 2, 'vignette')
      .setBlendMode(Phaser.BlendModes.MULTIPLY)
      .setAlpha(0.12)
      .setDepth(90)
    vignette.setScale(Math.max(this.scale.width, this.scale.height) / 512)
  }

  update(time: number, delta: number) {
    const config = DIFFICULTY[this.difficultyId]
    this.backdropFx?.update(time, delta)
    this.bubbleManager.update(delta)

    this.bubbleManager.getActiveBubbles().forEach((bubble) => {
      const wind = Math.sin((time / 1000) * 0.6 + bubble.id) * config.wind
      this.windForce.set(wind, 0)
      bubble.sprite.applyForce(this.windForce)
    })

    this.water.tilePositionX += delta * 0.03
    if (this.waterShine) {
      this.waterShine.tilePositionX -= delta * 0.045
      this.waterShine.tilePositionY += delta * 0.03
    }

    const caret = Math.floor(time / 450) % 2 === 0 ? '▍' : ''
    this.hud.buffer.setText(`${this.typingSystem.getBuffer()}${caret}`)
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
    if (this.isEnding) return
    this.isEnding = true

    this.spawnTimer?.destroy()
    this.typingSystem.destroy()
    const stats = this.typingSystem.getStats()
    const duration = (this.time.now - this.startTime) / 1000
    const accuracy = stats.totalKeys > 0 ? stats.correctKeys / stats.totalKeys : 1
    const charsPerSecond = stats.correctKeys / Math.max(1, duration)

    const payload = {
      score: this.score,
      accuracy,
      longestCombo: this.longestCombo,
      popped: this.popped,
      missed: this.missed,
      cps: charsPerSecond
    }

    this.cameras.main.fadeOut(260, 4, 10, 18)
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('Result', payload)
    })
  }

  private createWaterline() {
    const height = this.scale.height
    const waterHeight = Math.max(120, height * 0.18)
    this.water = this.add
      .tileSprite(0, height - waterHeight, this.scale.width, waterHeight, 'water')
      .setOrigin(0, 0)
      .setDepth(1)

    this.waterShine?.destroy()
    this.waterShine = this.add
      .tileSprite(0, height - waterHeight, this.scale.width, waterHeight, 'noise')
      .setOrigin(0, 0)
      .setDepth(2)
      .setAlpha(0.085)
      .setScale(1.5)
      .setTint(0x66e3ff)
      .setBlendMode(Phaser.BlendModes.ADD)
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

    this.backdropFx?.destroy()
    this.backdropFx = undefined
    this.waterShine?.destroy()
    this.waterShine = undefined
  }

  private createHud() {
    const uiScale = Phaser.Math.Clamp(Math.min(this.scale.width / 1280, this.scale.height / 720), 0.82, 1.15)
    const marginX = Math.round(30 * uiScale)
    const marginY = Math.round(26 * uiScale)
    const pad = Math.round(26 * uiScale)
    const depth = 20
    const panelWidth = Math.min(Math.round(440 * uiScale), this.scale.width - marginX * 2)
    const panelHeight = Math.round(180 * uiScale)
    const panel = createGlassPanel(
      this,
      marginX + panelWidth / 2,
      marginY + panelHeight / 2,
      panelWidth,
      panelHeight,
      {
        depth,
        radius: Math.round(28 * uiScale),
        accent: 0x66e3ff
      }
    )

    const scoreLabel = this.add.text(-panelWidth / 2 + pad, -panelHeight / 2 + Math.round(18 * uiScale), 'SCORE', {
      fontFamily: 'BubbleDisplay',
      fontSize: `${Math.round(12 * uiScale)}px`,
      color: 'rgba(234,246,255,0.62)'
    })
    scoreLabel.setOrigin(0, 0)

    const score = this.add.text(-panelWidth / 2 + pad, -panelHeight / 2 + Math.round(36 * uiScale), '0', {
      fontFamily: 'BubbleDisplay',
      fontSize: `${Math.round(36 * uiScale)}px`,
      color: '#eaf6ff'
    })
    score.setOrigin(0, 0)
    score.setShadow(0, 8, 'rgba(0,0,0,0.35)', 18, false, true)

    const comboLabel = this.add.text(panelWidth / 2 - pad, -panelHeight / 2 + Math.round(18 * uiScale), 'COMBO', {
      fontFamily: 'BubbleDisplay',
      fontSize: `${Math.round(12 * uiScale)}px`,
      color: 'rgba(234,246,255,0.62)'
    })
    comboLabel.setOrigin(1, 0)

    const combo = this.add.text(panelWidth / 2 - pad, -panelHeight / 2 + Math.round(36 * uiScale), '0', {
      fontFamily: 'BubbleDisplay',
      fontSize: `${Math.round(36 * uiScale)}px`,
      color: '#66e3ff'
    })
    combo.setOrigin(1, 0)
    combo.setShadow(0, 8, 'rgba(0,0,0,0.35)', 18, false, true)

    const barW = Math.round(170 * uiScale)
    const barX = panelWidth / 2 - pad - barW
    const barY = -panelHeight / 2 + Math.round(84 * uiScale)
    const barH = Math.max(10, Math.round(12 * uiScale))
    const comboBar = this.add.graphics()
    comboBar.setDataEnabled()
    comboBar.setData('x', barX)
    comboBar.setData('y', barY)
    comboBar.setData('w', barW)
    comboBar.setData('h', barH)
    comboBar.setData('r', Math.round(8 * uiScale))

    const accuracy = this.add.text(-panelWidth / 2 + pad, -panelHeight / 2 + Math.round(92 * uiScale), '', {
      fontFamily: 'BubbleDisplay',
      fontSize: `${Math.round(16 * uiScale)}px`,
      color: 'rgba(234,246,255,0.72)'
    })
    accuracy.setOrigin(0, 0)

    const lives = this.add.text(-panelWidth / 2 + pad, -panelHeight / 2 + Math.round(120 * uiScale), '', {
      fontFamily: 'BubbleDisplay',
      fontSize: `${Math.round(16 * uiScale)}px`,
      color: 'rgba(234,246,255,0.72)'
    })
    lives.setOrigin(0, 0)

    const lifeBubbles: Phaser.GameObjects.Sprite[] = []
    for (let i = 0; i < 5; i += 1) {
      const icon = this.add.sprite(
        -panelWidth / 2 + pad + i * Math.round(30 * uiScale),
        -panelHeight / 2 + Math.round(152 * uiScale),
        'bubble'
      )
      const scale = 0.12 * uiScale
      icon.setScale(scale)
      icon.setDataEnabled()
      icon.setData('activeScale', scale)
      icon.setData('inactiveScale', scale * 0.79)
      icon.setAlpha(0.55)
      icon.setTint(0xffffff)
      icon.setBlendMode(Phaser.BlendModes.NORMAL)
      lifeBubbles.push(icon)
    }

    panel.add([scoreLabel, score, comboLabel, combo, comboBar, accuracy, lives, ...lifeBubbles])

    const bufferWidth = Math.min(Math.round(680 * uiScale), this.scale.width - Math.round(80 * uiScale))
    const bufferHeight = Math.round(76 * uiScale)
    const bufferPanel = createGlassPanel(this, this.scale.width / 2, this.scale.height - Math.round(70 * uiScale), bufferWidth, bufferHeight, {
      depth,
      radius: Math.round(26 * uiScale),
      accent: 0xffcf66,
      animateSheen: false
    })

    const bufferGlow = this.add
      .image(0, 0, 'light')
      .setBlendMode(Phaser.BlendModes.ADD)
      .setTint(0x66e3ff)
      .setAlpha(0)
    bufferGlow.setScale(bufferWidth / 512)
    bufferPanel.addAt(bufferGlow, 1)

    const buffer = this.add.text(0, 0, '', {
      fontFamily: 'BubbleDisplay',
      fontSize: `${Math.round(28 * uiScale)}px`,
      color: '#eaf6ff'
    })
    buffer.setOrigin(0.5)
    buffer.setShadow(0, 10, 'rgba(0,0,0,0.35)', 18, false, true)
    bufferPanel.add(buffer)

    this.hud = {
      panel,
      bufferPanel,
      score,
      combo,
      accuracy,
      lives,
      buffer,
      comboBar,
      lifeBubbles,
      bufferGlow
    }
  }

  private updateHud() {
    const stats = this.typingSystem.getStats()
    const accuracy = stats.totalKeys > 0 ? (stats.correctKeys / stats.totalKeys) * 100 : 100

    if (this.score !== this.lastScore) {
      if (this.score > this.lastScore) this.punchText(this.hud.score, 1.06)
      this.lastScore = this.score
    }
    if (this.combo !== this.lastCombo) {
      if (this.combo > this.lastCombo) this.punchText(this.hud.combo, 1.1)
      this.lastCombo = this.combo
    }
    if (this.lives !== this.lastLives) {
      if (this.lives < this.lastLives) {
        const index = Phaser.Math.Clamp(this.lives, 0, this.hud.lifeBubbles.length - 1)
        const icon = this.hud.lifeBubbles[index]
        const worldX = this.hud.panel.x + icon.x
        const worldY = this.hud.panel.y + icon.y
        const spark = this.add
          .image(worldX, worldY, 'spark')
          .setDepth(30)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setTint(0xff5a7a)
          .setAlpha(0.55)
          .setScale(0.35)
        this.tweens.add({
          targets: spark,
          alpha: 0,
          scale: 1.2,
          duration: 520,
          ease: 'Sine.easeOut',
          onComplete: () => spark.destroy()
        })
      }
      this.lastLives = this.lives
    }

    this.hud.score.setText(`${this.score}`)
    this.hud.combo.setText(`${this.combo}`)
    this.hud.accuracy.setText(`Accuracy ${accuracy.toFixed(0)}%`)
    this.hud.lives.setText(`Lives ${this.lives}/5`)

    this.hud.lifeBubbles.forEach((icon, index) => {
      const active = index < this.lives
      icon.setAlpha(active ? 0.55 : 0.14)
      const activeScale = (icon.getData('activeScale') as number) ?? icon.scaleX
      const inactiveScale = (icon.getData('inactiveScale') as number) ?? icon.scaleX * 0.79
      icon.setScale(active ? activeScale : inactiveScale)
    })

    const barX = this.hud.comboBar.getData('x') as number
    const barY = this.hud.comboBar.getData('y') as number
    const barW = this.hud.comboBar.getData('w') as number
    const barH = this.hud.comboBar.getData('h') as number
    const barR = this.hud.comboBar.getData('r') as number
    const ratio = Phaser.Math.Clamp(this.combo / 16, 0, 1)

    this.hud.comboBar.clear()
    this.hud.comboBar.fillStyle(0xffffff, 0.08)
    this.hud.comboBar.fillRoundedRect(barX, barY, barW, barH, barR)
    this.hud.comboBar.fillStyle(0x66e3ff, 0.85)
    this.hud.comboBar.fillRoundedRect(barX, barY, barW * ratio, barH, barR)
    this.hud.comboBar.lineStyle(1, 0xffffff, 0.14)
    this.hud.comboBar.strokeRoundedRect(barX, barY, barW, barH, barR)
  }

  private punchText(target: Phaser.GameObjects.Text, scale = 1.08) {
    this.tweens.killTweensOf(target)
    target.setScale(1)
    this.tweens.add({
      targets: target,
      scale,
      duration: 140,
      yoyo: true,
      ease: 'Sine.easeOut'
    })
  }

  private flashBuffer(tint: number, alpha: number) {
    if (!this.hud) return

    this.tweens.killTweensOf(this.hud.bufferGlow)
    this.tweens.killTweensOf(this.hud.bufferPanel)

    this.hud.bufferGlow.setTint(tint)
    this.hud.bufferGlow.setAlpha(0)
    this.hud.bufferPanel.setScale(1)

    this.tweens.add({
      targets: this.hud.bufferGlow,
      alpha,
      duration: 90,
      yoyo: true,
      ease: 'Sine.easeOut'
    })
    this.tweens.add({
      targets: this.hud.bufferPanel,
      scale: 1.012,
      duration: 90,
      yoyo: true,
      ease: 'Sine.easeOut'
    })
  }

  private normalize(text: string, accentInsensitive: boolean) {
    const lowered = text.toLowerCase()
    if (!accentInsensitive) return lowered
    return lowered.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  }
}
