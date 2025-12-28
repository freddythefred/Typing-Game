import Phaser from 'phaser'
import { BootScene } from '../scenes/BootScene'
import { PreloadScene } from '../scenes/PreloadScene'
import { ProfileSelectScene } from '../scenes/ProfileSelectScene'
import { MenuScene } from '../scenes/MenuScene'
import { SettingsScene } from '../scenes/SettingsScene'
import { GameScene } from '../scenes/GameScene'
import { ResultScene } from '../scenes/ResultScene'

export function createGame() {
  return new Phaser.Game({
    type: Phaser.WEBGL,
    parent: 'app',
    backgroundColor: '#0c1f2d',
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 1280,
      height: 720
    },
    physics: {
      default: 'matter',
      matter: {
        gravity: { x: 0, y: 0.8 }
      }
    },
    render: {
      antialias: true,
      pixelArt: false,
      powerPreference: 'high-performance'
    },
    scene: [BootScene, PreloadScene, ProfileSelectScene, MenuScene, SettingsScene, GameScene, ResultScene]
  })
}
