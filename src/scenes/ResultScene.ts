import Phaser from 'phaser'
import { createButton } from '../ui/components/UiButton'
import { createGlassPanel } from '../ui/components/GlassPanel'

type ResultData = {
  score: number
  accuracy: number
  longestCombo: number
  popped: number
  missed: number
  cps: number
}

export class ResultScene extends Phaser.Scene {
  constructor() {
    super('Result')
  }

  create(data: ResultData) {
    this.add.graphics().fillGradientStyle(0x0b1b2a, 0x0b1b2a, 0x122c42, 0x1c3f58, 1).fillRect(
      0,
      0,
      this.scale.width,
      this.scale.height
    )

    createGlassPanel(this, this.scale.width / 2, 260, 680, 360)

    this.add
      .text(this.scale.width / 2, 120, 'Run Complete', {
        fontFamily: 'BubbleDisplay',
        fontSize: '46px',
        color: '#eaf6ff'
      })
      .setOrigin(0.5)

    const stats = [
      `Score: ${data.score}`,
      `Accuracy: ${(data.accuracy * 100).toFixed(0)}%`,
      `Longest Streak: ${data.longestCombo}`,
      `Bubbles Popped: ${data.popped}`,
      `Bubbles Missed: ${data.missed}`,
      `Chars/sec: ${data.cps.toFixed(1)}`
    ]

    stats.forEach((line, index) => {
      this.add
        .text(this.scale.width / 2, 200 + index * 36, line, {
          fontFamily: 'BubbleDisplay',
          fontSize: '22px',
          color: '#eaf6ff'
        })
        .setOrigin(0.5)
    })

    createButton(this, this.scale.width / 2, this.scale.height - 90, 'Back to Menu', () => {
      this.scene.start('Menu')
    })
  }
}
