import Phaser from 'phaser'

export class EffectsSystem {
  private scene: Phaser.Scene
  private popEmitter: Phaser.GameObjects.Particles.ParticleEmitter
  private popSparkEmitter: Phaser.GameObjects.Particles.ParticleEmitter
  private splashEmitter: Phaser.GameObjects.Particles.ParticleEmitter
  private splashSparkEmitter: Phaser.GameObjects.Particles.ParticleEmitter

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.popEmitter = this.scene.add.particles(0, 0, 'particle', {
      emitting: false,
      frequency: -1,
      speed: { min: -120, max: 120 },
      lifespan: 600,
      alpha: { start: 0.9, end: 0 },
      scale: { start: 0.6, end: 0 },
      quantity: 14
    })
    this.popEmitter.setDepth(6)
    this.popEmitter.setBlendMode(Phaser.BlendModes.ADD)

    this.popSparkEmitter = this.scene.add.particles(0, 0, 'spark', {
      emitting: false,
      frequency: -1,
      speed: { min: -90, max: 90 },
      lifespan: 520,
      alpha: { start: 0.65, end: 0 },
      scale: { start: 0.22, end: 0 },
      quantity: 6
    })
    this.popSparkEmitter.setDepth(7)
    this.popSparkEmitter.setBlendMode(Phaser.BlendModes.ADD)

    this.splashEmitter = this.scene.add.particles(0, 0, 'particle', {
      emitting: false,
      frequency: -1,
      speed: { min: -160, max: 160 },
      lifespan: 700,
      alpha: { start: 0.85, end: 0 },
      scale: { start: 0.8, end: 0 },
      quantity: 18
    })
    this.splashEmitter.setDepth(6)
    this.splashEmitter.setBlendMode(Phaser.BlendModes.ADD)

    this.splashSparkEmitter = this.scene.add.particles(0, 0, 'spark', {
      emitting: false,
      frequency: -1,
      speed: { min: -140, max: 140 },
      lifespan: 640,
      alpha: { start: 0.55, end: 0 },
      scale: { start: 0.24, end: 0 },
      quantity: 8
    })
    this.splashSparkEmitter.setDepth(7)
    this.splashSparkEmitter.setBlendMode(Phaser.BlendModes.ADD)
  }

  pop(x: number, y: number) {
    this.popEmitter.explode(18, x, y)
    this.popSparkEmitter.explode(7, x, y)

    const ring = this.scene.add
      .image(x, y, 'ripple')
      .setDepth(5)
      .setAlpha(0.9)
      .setBlendMode(Phaser.BlendModes.ADD)
    ring.setScale(0.18)
    this.scene.tweens.add({
      targets: ring,
      scale: 1.35,
      alpha: 0,
      duration: 520,
      ease: 'Sine.easeOut',
      onComplete: () => ring.destroy()
    })

    const flash = this.scene.add
      .image(x, y, 'light')
      .setDepth(5)
      .setAlpha(0.16)
      .setTint(0x66e3ff)
      .setBlendMode(Phaser.BlendModes.ADD)
    flash.setScale(0.12)
    this.scene.tweens.add({
      targets: flash,
      scale: 0.55,
      alpha: 0,
      duration: 320,
      ease: 'Sine.easeOut',
      onComplete: () => flash.destroy()
    })
  }

  splash(x: number, y: number) {
    this.splashEmitter.explode(22, x, y - 8)
    this.splashSparkEmitter.explode(9, x, y - 10)

    const ripple = this.scene.add.image(x, y, 'ripple').setDepth(4).setAlpha(0.7)
    ripple.setScale(0.3)
    this.scene.tweens.add({
      targets: ripple,
      scale: 1.2,
      alpha: 0,
      duration: 900,
      ease: 'Sine.easeOut',
      onComplete: () => ripple.destroy()
    })

    const glow = this.scene.add
      .image(x, y - 10, 'light')
      .setDepth(4)
      .setAlpha(0.12)
      .setTint(0x66e3ff)
      .setBlendMode(Phaser.BlendModes.ADD)
    glow.setScale(0.14)
    this.scene.tweens.add({
      targets: glow,
      alpha: 0,
      scale: 0.85,
      duration: 520,
      ease: 'Sine.easeOut',
      onComplete: () => glow.destroy()
    })
  }

  shake(intensity = 0.004, duration = 120) {
    this.scene.cameras.main.shake(duration, intensity)
  }
}
