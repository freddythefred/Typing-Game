import Phaser from 'phaser'
import { createGlassPanel } from './GlassPanel'

export function createButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  onClick: () => void,
  options?: { width?: number; height?: number; depth?: number; accent?: number; radius?: number }
) {
  const width = options?.width ?? 220
  const height = options?.height ?? 56
  const depth = options?.depth ?? 7
  const accent = options?.accent ?? 0x66e3ff
  const radius = options?.radius ?? 18

  const panel = createGlassPanel(scene, x, y, width, height, {
    depth,
    radius,
    accent
  })

  const base = panel.getData('base') as Phaser.GameObjects.Image
  const border = panel.getData('border') as Phaser.GameObjects.Graphics
  const inner = panel.getData('inner') as Phaser.GameObjects.Graphics

  const glow = scene.add
    .image(0, 0, 'light')
    .setBlendMode(Phaser.BlendModes.ADD)
    .setTint(accent)
    .setAlpha(0)
  glow.setScale(Math.max(width, height) / 512)
  panel.addAt(glow, 1)
  panel.setData('glow', glow)
  panel.setData('buttonWidth', width)
  panel.setData('buttonHeight', height)
  panel.setData('buttonRadius', radius)
  panel.setData('buttonAccent', accent)

  const text = scene.add.text(0, 0, label, {
    fontFamily: 'BubbleDisplay',
    fontSize: '22px',
    color: '#eaf6ff'
  })
  text.setOrigin(0.5)
  text.setShadow(0, 3, 'rgba(0,0,0,0.35)', 10, false, true)

  panel.add(text)
  panel.setData('labelText', text)
  panel.setSize(width, height)
  panel.setInteractive({ useHandCursor: true })

  const setBorder = (a: number) => {
    border.clear()
    border.lineStyle(2, 0xffffff, a)
    border.strokeRoundedRect(-width / 2, -height / 2, width, height, radius)
  }

  const setInner = (a: number) => {
    inner.clear()
    inner.lineStyle(1, accent, a)
    inner.strokeRoundedRect(-width / 2 + 4, -height / 2 + 4, width - 8, height - 8, Math.max(0, radius - 4))
  }

  setBorder(0.12)
  setInner(0.16)

  panel.on('pointerover', () => {
    scene.tweens.add({ targets: panel, scale: 1.045, duration: 140, ease: 'Sine.easeOut' })
    scene.tweens.add({ targets: glow, alpha: 0.17, duration: 160, ease: 'Sine.easeOut' })
    scene.tweens.add({ targets: base, alpha: 1, duration: 160, ease: 'Sine.easeOut' })
    setBorder(0.22)
    setInner(0.32)
  })

  panel.on('pointerout', () => {
    scene.tweens.add({ targets: panel, scale: 1, duration: 180, ease: 'Sine.easeOut' })
    scene.tweens.add({ targets: glow, alpha: 0, duration: 220, ease: 'Sine.easeOut' })
    setBorder(0.12)
    setInner(0.16)
  })

  panel.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
    scene.tweens.add({ targets: panel, scale: 0.985, duration: 90, ease: 'Sine.easeOut' })

    const localX = pointer.x - panel.x
    const localY = pointer.y - panel.y
    const ripple = scene.add
      .image(localX, localY, 'light')
      .setBlendMode(Phaser.BlendModes.ADD)
      .setTint(accent)
      .setAlpha(0.2)
    ripple.setScale(0.05)
    panel.add(ripple)

    scene.tweens.add({
      targets: ripple,
      scale: Math.max(width, height) / 512,
      alpha: 0,
      duration: 420,
      ease: 'Sine.easeOut',
      onComplete: () => ripple.destroy()
    })
  })

  panel.on('pointerup', () => {
    scene.tweens.add({ targets: panel, scale: 1.045, duration: 120, ease: 'Back.easeOut' })
    onClick()
  })

  return panel
}

export function setButtonLabel(button: Phaser.GameObjects.Container, label: string) {
  const text = button.getData('labelText') as Phaser.GameObjects.Text | undefined
  if (!text) return
  text.setText(label)
}
