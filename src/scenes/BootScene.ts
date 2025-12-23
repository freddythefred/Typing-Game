import Phaser from 'phaser'

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot')
  }

  create() {
    this.cameras.main.setBackgroundColor('#0c1f2d')
    this.scene.start('Preload')
  }
}
