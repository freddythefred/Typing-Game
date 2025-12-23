import Phaser from 'phaser'

export function createButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  onClick: () => void,
  options?: { width?: number; height?: number }
) {
  const width = options?.width ?? 220
  const height = options?.height ?? 54
  const bg = scene.add.graphics()
  bg.fillStyle(0xffffff, 0.14)
  bg.fillRoundedRect(-width / 2, -height / 2, width, height, 16)
  bg.lineStyle(2, 0xffffff, 0.2)
  bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 16)

  const text = scene.add.text(0, 0, label, {
    fontFamily: 'BubbleDisplay',
    fontSize: '22px',
    color: '#eaf6ff'
  })
  text.setOrigin(0.5)

  const container = scene.add.container(x, y, [bg, text])
  container.setSize(width, height)
  container.setInteractive({ useHandCursor: true })

  container.on('pointerover', () => {
    bg.clear()
    bg.fillStyle(0xffffff, 0.22)
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 16)
    bg.lineStyle(2, 0xffffff, 0.35)
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 16)
    scene.tweens.add({ targets: container, scale: 1.03, duration: 120 })
  })
  container.on('pointerout', () => {
    bg.clear()
    bg.fillStyle(0xffffff, 0.14)
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 16)
    bg.lineStyle(2, 0xffffff, 0.2)
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 16)
    scene.tweens.add({ targets: container, scale: 1, duration: 120 })
  })
  container.on('pointerdown', () => {
    scene.tweens.add({ targets: container, scale: 0.98, duration: 80 })
  })
  container.on('pointerup', () => {
    onClick()
  })

  return container
}
