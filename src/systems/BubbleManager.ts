import Phaser from 'phaser'
import type { DifficultyConfig } from '../config/difficulty'

export type BubbleItem = {
  id: number
  sprite: Phaser.Physics.Matter.Sprite
  ring: Phaser.GameObjects.Arc
  labelMatch: Phaser.GameObjects.Text
  labelRest: Phaser.GameObjects.Text
  labelContainer: Phaser.GameObjects.Container
  text: string
  normalized: string
  progress: number
  active: boolean
  isTarget: boolean
  radius: number
  wobblePhase: number
  wobbleSpeed: number
}

export class BubbleManager {
  private scene: Phaser.Scene
  private pool: BubbleItem[] = []
  private active: BubbleItem[] = []
  private idCounter = 0
  private disposed = false

  private isArabicText(text: string) {
    return /[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff]/i.test(text)
  }

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.scene.events.on(Phaser.Scenes.Events.POST_UPDATE, this.postUpdate, this)
  }

  destroy(options?: { destroyObjects?: boolean }) {
    if (this.disposed) return
    this.disposed = true

    this.scene.events.off(Phaser.Scenes.Events.POST_UPDATE, this.postUpdate, this)

    if (options?.destroyObjects) {
      const all = [...this.active, ...this.pool]
      this.active = []
      this.pool = []
      all.forEach((bubble) => this.destroyBubbleObjects(bubble))
      return
    }

    this.clear()
  }

  spawn(word: string, normalized: string, config: DifficultyConfig): BubbleItem {
    if (this.disposed) {
      throw new Error('[BubbleManager] spawn() called after destroy()')
    }
    const bubble = this.pool.pop() ?? this.createBubble()
    const [minRadius, maxRadius] = config.bubbleRadius
    const radius = Phaser.Math.Between(minRadius, maxRadius)

    bubble.text = word
    bubble.normalized = normalized
    bubble.progress = 0
    bubble.radius = radius
    bubble.wobblePhase = Math.random() * Math.PI * 2
    bubble.wobbleSpeed = 0.8 + Math.random() * 0.6
    bubble.active = true

    const fontSize = this.isArabicText(word) ? 30 : 26
    bubble.labelMatch.setFontSize(fontSize)
    bubble.labelRest.setFontSize(fontSize)

    const x = Phaser.Math.Between(radius + 40, this.scene.scale.width - radius - 40)
    const y = -radius - Phaser.Math.Between(30, 140)
    bubble.sprite.setPosition(x, y)
    bubble.sprite.setCircle(radius)
    bubble.sprite.setScale((radius * 2) / 256)
    bubble.sprite.setFrictionAir(0.018)
    bubble.sprite.setBounce(0.4)
    bubble.sprite.setIgnoreGravity(false)
    bubble.sprite.setStatic(false)
    bubble.sprite.setActive(true)
    bubble.sprite.setVisible(true)
    bubble.sprite.setCollisionCategory(0x0002)
    bubble.sprite.setCollidesWith(config.collisions ? 0x0002 | 0x0001 : 0x0001)

    bubble.ring.setVisible(true)
    bubble.ring.setPosition(x, y)
    bubble.ring.setScale(bubble.sprite.scaleX)
    bubble.ring.setStrokeStyle(4, 0xffffff, 0)

    bubble.labelMatch.setText('')
    bubble.labelRest.setText(word)
    bubble.labelContainer.setVisible(true)
    bubble.labelContainer.setAlpha(0.95)
    this.setProgress(bubble, 0)

    this.active.push(bubble)
    return bubble
  }

  private postUpdate(_time: number, delta: number) {
    if (this.disposed) return
    const dt = delta / 1000
    this.active.forEach((bubble) => {
      const wobble = Math.sin(bubble.wobblePhase) * 0.03
      bubble.wobblePhase += dt * bubble.wobbleSpeed
      bubble.sprite.setRotation(wobble)
      const targetBoost = bubble.isTarget ? 0.06 : 0
      bubble.sprite.setScale((bubble.radius * 2) / 256 + wobble * 0.05 + targetBoost)

      bubble.ring.setPosition(bubble.sprite.x, bubble.sprite.y)
      bubble.ring.setScale(bubble.sprite.scaleX * (bubble.isTarget ? 1.05 : 1))

      bubble.labelContainer.setPosition(bubble.sprite.x, bubble.sprite.y)
      bubble.labelContainer.setScale(bubble.isTarget ? 1.04 : 1)
    })
  }

  setProgress(bubble: BubbleItem, progress: number) {
    bubble.progress = progress
    bubble.labelMatch.setText(bubble.text.slice(0, progress))
    bubble.labelRest.setText(bubble.text.slice(progress))
    const totalWidth = bubble.labelMatch.width + bubble.labelRest.width + 2
    bubble.labelMatch.setX(-totalWidth / 2)
    bubble.labelRest.setX(bubble.labelMatch.x + bubble.labelMatch.width + 2)
  }

  setHighlight(bubble: BubbleItem | null) {
    this.active.forEach((item) => {
      const isTarget = bubble && item.id === bubble.id
      item.isTarget = Boolean(isTarget)
      item.ring.setStrokeStyle(4, 0xffffff, isTarget ? 0.22 : 0)
    })
  }

  release(bubble: BubbleItem) {
    const sprite = bubble.sprite as unknown as { destroyed?: boolean; scene?: unknown }
    if (sprite.destroyed || !sprite.scene) {
      bubble.active = false
      bubble.progress = 0
      bubble.isTarget = false
      this.active = this.active.filter((item) => item.id !== bubble.id)
      return
    }

    bubble.active = false
    bubble.sprite.setVelocity(0, 0)
    bubble.sprite.setAngularVelocity(0)
    bubble.sprite.setIgnoreGravity(true)
    bubble.sprite.setActive(false)
    bubble.sprite.setVisible(false)
    bubble.sprite.setPosition(-9999, -9999)
    bubble.ring.setVisible(false)
    bubble.labelContainer.setVisible(false)
    bubble.progress = 0
    bubble.isTarget = false

    this.active = this.active.filter((item) => item.id !== bubble.id)
    this.pool.push(bubble)
  }

  getActiveBubbles() {
    return this.active
  }

  clear() {
    if (this.disposed) return
    this.active.forEach((bubble) => this.release(bubble))
    this.active = []
  }

  private destroyBubbleObjects(bubble: BubbleItem) {
    try {
      bubble.sprite?.destroy()
    } catch {
      // ignore
    }
    try {
      bubble.ring?.destroy()
    } catch {
      // ignore
    }
    try {
      bubble.labelContainer?.destroy(true)
    } catch {
      // ignore
    }
  }

  private createBubble(): BubbleItem {
    const sprite = this.scene.matter.add.sprite(0, 0, 'bubble')
    sprite.setDepth(3)
    sprite.setCollisionCategory(0x0002)
    sprite.setCollidesWith(0x0001)

    const ring = this.scene.add.circle(0, 0, 128, 0x000000, 0).setDepth(3.1)
    ring.setStrokeStyle(4, 0xffffff, 0)
    ring.setVisible(false)
    const labelMatch = this.scene.add.text(0, 0, '', {
      fontFamily: 'BubbleDisplay',
      fontSize: '26px',
      color: '#66e3ff'
    })
    const labelRest = this.scene.add.text(0, 0, '', {
      fontFamily: 'BubbleDisplay',
      fontSize: '26px',
      color: '#eaf6ff'
    })
    labelMatch.setOrigin(0, 0.5)
    labelRest.setOrigin(0, 0.5)
    labelMatch.setStroke('rgba(0,0,0,0.55)', 4)
    labelRest.setStroke('rgba(0,0,0,0.55)', 4)
    labelMatch.setShadow(0, 4, 'rgba(0,0,0,0.55)', 10, false, true)
    labelRest.setShadow(0, 4, 'rgba(0,0,0,0.55)', 10, false, true)

    const labelContainer = this.scene.add
      .container(0, 0, [labelMatch, labelRest])
      .setDepth(4)

    const bubble: BubbleItem = {
      id: this.idCounter++,
      sprite,
      ring,
      labelMatch,
      labelRest,
      labelContainer,
      text: '',
      normalized: '',
      progress: 0,
      active: false,
      isTarget: false,
      radius: 48,
      wobblePhase: 0,
      wobbleSpeed: 1
    }
    sprite.setData('bubble', bubble)
    return bubble
  }
}
