import Phaser from 'phaser'

export type UnderwaterBackground = {
  update: (time: number, delta: number) => void
  resize: (width: number, height: number) => void
  destroy: () => void
}

type UnderwaterBackgroundOptions = {
  depth?: number
  accent?: number
  withPointerLight?: boolean
  withShafts?: boolean
  withDust?: boolean
}

export function createUnderwaterBackground(
  scene: Phaser.Scene,
  options: UnderwaterBackgroundOptions = {}
): UnderwaterBackground {
  let destroyed = false
  const depth = options.depth ?? -10
  const accent = options.accent ?? 0x66e3ff
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false

  const backdrop = scene.add.graphics().setDepth(depth)
  const noise = scene.add
    .tileSprite(0, 0, scene.scale.width, scene.scale.height, 'noise')
    .setOrigin(0, 0)
    .setDepth(depth + 1)
    .setAlpha(0.06)
    .setBlendMode(Phaser.BlendModes.OVERLAY)

  const caustics = scene.add
    .tileSprite(0, 0, scene.scale.width, scene.scale.height, 'noise')
    .setOrigin(0, 0)
    .setDepth(depth + 2)
    .setAlpha(0.06)
    .setScale(1.55)
    .setTint(accent)
    .setBlendMode(Phaser.BlendModes.ADD)

  const shafts: Phaser.GameObjects.Image[] = []
  if (options.withShafts ?? true) {
    const shaftCount = reduceMotion ? 2 : 3
    for (let i = 0; i < shaftCount; i += 1) {
      const shaft = scene.add
        .image(Phaser.Math.Between(0, scene.scale.width), -80, 'shaft')
        .setOrigin(0.5, 0)
        .setDepth(depth + 3)
        .setAlpha(0.08)
        .setTint(0xbff8ff)
        .setBlendMode(Phaser.BlendModes.SCREEN)

      shaft.setScale(Phaser.Math.FloatBetween(2.2, 3.2), (scene.scale.height + 260) / 512)
      shaft.setRotation(Phaser.Math.FloatBetween(-0.22, 0.22))
      shafts.push(shaft)

      if (!reduceMotion) {
        scene.tweens.add({
          targets: shaft,
          alpha: { from: 0.05, to: 0.13 },
          duration: Phaser.Math.Between(2200, 3400),
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
          delay: i * 140
        })
      }
    }
  }

  let pointerLight: Phaser.GameObjects.Image | null = null
  const pointerTarget = new Phaser.Math.Vector2(scene.scale.width * 0.5, scene.scale.height * 0.35)
  const pointerPos = pointerTarget.clone()

  if (options.withPointerLight ?? true) {
    pointerLight = scene.add
      .image(pointerPos.x, pointerPos.y, 'light')
      .setDepth(depth + 4)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0.14)
      .setTint(accent)
    pointerLight.setScale(Math.max(scene.scale.width, scene.scale.height) / 512)
  }

  const dustZone = new Phaser.Geom.Rectangle(0, 0, scene.scale.width, scene.scale.height + 80)
  const dust = options.withDust ?? true
    ? scene.add.particles(0, 0, 'particle', {
        emitting: true,
        frequency: reduceMotion ? 240 : 110,
        quantity: 1,
        lifespan: { min: 5200, max: 8600 },
        speedX: { min: -10, max: 10 },
        speedY: { min: -24, max: -8 },
        scale: { start: 0.16, end: 0 },
        alpha: { start: 0.14, end: 0 },
        tint: 0xffffff,
        blendMode: Phaser.BlendModes.ADD,
        emitZone: { type: 'random', source: dustZone }
      } as any)
    : null

  if (dust) {
    dust?.setDepth(depth + 2)
  }

  const redrawBackdrop = () => {
    backdrop.clear()
    backdrop.fillGradientStyle(0x071925, 0x0b1f2d, 0x12364c, 0x1f4f6a, 1)
    backdrop.fillRect(0, 0, scene.scale.width, scene.scale.height)
  }
  redrawBackdrop()

  const resize = (width: number, height: number) => {
    if (destroyed) return
    noise.setSize(width, height)
    caustics.setSize(width, height)
    dustZone.width = width
    dustZone.height = height + 80

    if (pointerLight) {
      pointerLight.setScale(Math.max(width, height) / 512)
    }

    shafts.forEach((shaft) => {
      shaft.setScale(shaft.scaleX, (height + 260) / 512)
    })

    redrawBackdrop()
  }

  const update = (time: number, delta: number) => {
    if (destroyed) return
    const dt = delta / 1000
    const t = time / 1000

    if (!reduceMotion) {
      noise.tilePositionX += delta * 0.025
      noise.tilePositionY -= delta * 0.018
      caustics.tilePositionX -= delta * 0.042
      caustics.tilePositionY += delta * 0.03
      caustics.rotation = Math.sin(t * 0.08) * 0.012
      shafts.forEach((shaft, index) => {
        shaft.x += Math.sin(t * 0.12 + index * 2.4) * dt * 6
      })
    }

    if (pointerLight) {
      const pointer = scene.input.activePointer
      if (pointer && (pointer.isDown || pointer.x !== 0 || pointer.y !== 0)) {
        pointerTarget.set(pointer.x, pointer.y)
      } else {
        pointerTarget.set(scene.scale.width * 0.5, scene.scale.height * 0.35)
      }

      pointerPos.x = Phaser.Math.Linear(pointerPos.x, pointerTarget.x, 1 - Math.pow(0.0002, delta))
      pointerPos.y = Phaser.Math.Linear(pointerPos.y, pointerTarget.y, 1 - Math.pow(0.0002, delta))

      pointerLight.setPosition(pointerPos.x, pointerPos.y)
      pointerLight.setAlpha(reduceMotion ? 0.1 : 0.12 + Math.sin(t * 0.9) * 0.02)
    }
  }

  const destroy = () => {
    if (destroyed) return
    destroyed = true
    backdrop.destroy()
    noise.destroy()
    caustics.destroy()
    shafts.forEach((shaft) => shaft.destroy())
    pointerLight?.destroy()
    dust?.destroy()
  }

  return { update, resize, destroy }
}
