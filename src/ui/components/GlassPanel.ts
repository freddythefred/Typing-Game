import Phaser from 'phaser'

export function createGlassPanel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number
) {
  const panel = scene.add.graphics({ x, y })
  panel.fillStyle(0xffffff, 0.08)
  panel.fillRoundedRect(-width / 2, -height / 2, width, height, 18)
  panel.lineStyle(2, 0xffffff, 0.2)
  panel.strokeRoundedRect(-width / 2, -height / 2, width, height, 18)

  const shine = scene.add.graphics({ x, y })
  shine.fillStyle(0xffffff, 0.08)
  shine.fillRoundedRect(-width / 2 + 8, -height / 2 + 6, width - 16, height * 0.4, 14)

  return scene.add.container(0, 0, [panel, shine]).setDepth(5)
}
