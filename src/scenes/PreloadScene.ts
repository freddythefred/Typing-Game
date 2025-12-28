import Phaser from 'phaser'
import {
  createBubbleSpecTexture,
  createBubbleTexture,
  createHaloTexture,
  createLightTexture,
  createNoiseTexture,
  createParticleTexture,
  createRippleTexture,
  createShaftTexture,
  createSheenTexture,
  createSparkTexture,
  createVignetteTexture,
  createWaterTexture
} from '../systems/TextureFactory'

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload')
  }

  create() {
    createBubbleTexture(this)
    createBubbleSpecTexture(this)
    createHaloTexture(this)
    createParticleTexture(this)
    createSparkTexture(this)
    createRippleTexture(this)
    createWaterTexture(this)
    createNoiseTexture(this)
    createSheenTexture(this)
    createLightTexture(this)
    createVignetteTexture(this)
    createShaftTexture(this)

    this.scene.start('ProfileSelect')
  }
}
