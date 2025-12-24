import Phaser from 'phaser'
import type { DifficultyConfig } from '../config/difficulty'

export type BubbleItem = {
  id: number
  sprite: Phaser.Physics.Matter.Sprite
  halo: Phaser.GameObjects.Sprite
  spec: Phaser.GameObjects.Sprite
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

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  spawn(word: string, normalized: string, config: DifficultyConfig): BubbleItem {
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

    bubble.halo.setScale((radius * 2) / 256)
    bubble.halo.setAlpha(0)
    bubble.halo.setVisible(true)

    bubble.spec.setScale((radius * 2) / 256)
    bubble.spec.setAlpha(0.22)
    bubble.spec.setVisible(true)

    bubble.labelMatch.setText('')
    bubble.labelRest.setText(word)
    bubble.labelContainer.setVisible(true)
    bubble.labelContainer.setAlpha(0.9)
    this.setProgress(bubble, 0)

    this.active.push(bubble)
    return bubble
  }

  update(delta: number) {
    const dt = delta / 1000
    this.active.forEach((bubble) => {
      const wobble = Math.sin(bubble.wobblePhase) * 0.03
      bubble.wobblePhase += dt * bubble.wobbleSpeed
      bubble.sprite.setRotation(wobble)
      const targetBoost = bubble.isTarget ? 0.06 : 0
      bubble.sprite.setScale((bubble.radius * 2) / 256 + wobble * 0.05 + targetBoost)

      bubble.halo.setPosition(bubble.sprite.x, bubble.sprite.y)
      bubble.halo.setRotation(-wobble * 0.8)
      if (bubble.isTarget) {
        const pulse = 1 + Math.sin(bubble.wobblePhase * 2.2) * 0.06
        bubble.halo.setScale(((bubble.radius * 2) / 256) * 1.15 * pulse)
      }

      bubble.spec.setPosition(
        bubble.sprite.x - bubble.radius * 0.18,
        bubble.sprite.y - bubble.radius * 0.22
      )
      bubble.spec.setRotation(wobble)
      bubble.spec.setAlpha(bubble.isTarget ? 0.34 : 0.22)
      bubble.spec.setScale(((bubble.radius * 2) / 256) * (bubble.isTarget ? 1.02 : 1))

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
      item.halo.setAlpha(isTarget ? 0.8 : 0)
    })
  }

  release(bubble: BubbleItem) {
    bubble.active = false
    bubble.sprite.setVelocity(0, 0)
    bubble.sprite.setAngularVelocity(0)
    bubble.sprite.setIgnoreGravity(true)
    bubble.sprite.setActive(false)
    bubble.sprite.setVisible(false)
    bubble.sprite.setPosition(-9999, -9999)
    bubble.halo.setVisible(false)
    bubble.spec.setVisible(false)
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
    this.active.forEach((bubble) => this.release(bubble))
    this.active = []
  }

  private createBubble(): BubbleItem {
    const sprite = this.scene.matter.add.sprite(0, 0, 'bubble')
    sprite.setDepth(3)
    sprite.setCollisionCategory(0x0002)
    sprite.setCollidesWith(0x0001)

    const halo = this.scene.add.sprite(0, 0, 'halo').setDepth(2)
    halo.setBlendMode(Phaser.BlendModes.ADD)

    const spec = this.scene.add.sprite(0, 0, 'bubbleSpec').setDepth(3.2)
    spec.setBlendMode(Phaser.BlendModes.SCREEN)
    const labelMatch = this.scene.add.text(0, 0, '', {
      fontFamily: 'BubbleDisplay',
      fontSize: '20px',
      color: '#0b0b0b'
    })
    const labelRest = this.scene.add.text(0, 0, '', {
      fontFamily: 'BubbleDisplay',
      fontSize: '20px',
      color: '#0b0b0b'
    })
    labelMatch.setOrigin(0, 0.5)
    labelRest.setOrigin(0, 0.5)
    labelMatch.setStroke('rgba(255,255,255,0.25)', 2)
    labelRest.setStroke('rgba(255,255,255,0.25)', 2)

    const labelContainer = this.scene.add
      .container(0, 0, [labelMatch, labelRest])
      .setDepth(4)

    const bubble: BubbleItem = {
      id: this.idCounter++,
      sprite,
      halo,
      spec,
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
