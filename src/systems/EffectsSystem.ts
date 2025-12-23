import Phaser from 'phaser'

export class EffectsSystem {
  private scene: Phaser.Scene
  private popEmitter: Phaser.GameObjects.Particles.ParticleEmitter
  private splashEmitter: Phaser.GameObjects.Particles.ParticleEmitter

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
  }

  pop(x: number, y: number) {
    this.popEmitter.explode(14, x, y)
  }

  splash(x: number, y: number) {
    this.splashEmitter.explode(18, x, y - 8)

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
  }

  shake(intensity = 0.004, duration = 120) {
    this.scene.cameras.main.shake(duration, intensity)
  }
}
