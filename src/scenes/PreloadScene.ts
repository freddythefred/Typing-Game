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

  preload() {
    this.load.svg('flag-fr', 'flags/fr.svg', { width: 384, height: 256 })
    this.load.svg('flag-en', 'flags/uk.svg', { width: 512, height: 256 })
    this.load.image('flag-es', 'flags/es.png')
    this.load.image('flag-ar', 'flags/ar.png')
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
