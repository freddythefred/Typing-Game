import Phaser from 'phaser'
import {
  createBubbleTexture,
  createHaloTexture,
  createParticleTexture,
  createRippleTexture,
  createWaterTexture
} from '../systems/TextureFactory'

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload')
  }

  create() {
    createBubbleTexture(this)
    createHaloTexture(this)
    createParticleTexture(this)
    createRippleTexture(this)
    createWaterTexture(this)

    this.scene.start('Menu')
  }
}
