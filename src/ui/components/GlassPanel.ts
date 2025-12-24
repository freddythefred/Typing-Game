import Phaser from 'phaser'

export function createGlassPanel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  options?: {
    depth?: number
    radius?: number
    alpha?: number
    accent?: number
    float?: boolean
    animateSheen?: boolean
  }
) {
  const depth = options?.depth ?? 5
  const radius = options?.radius ?? 22
  const alpha = options?.alpha ?? 1
  const accent = options?.accent ?? 0x66e3ff
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false
  const animateSheen = options?.animateSheen ?? !reduceMotion
  const float = Boolean(options?.float && !reduceMotion)

  const key = `glass-${Math.round(width)}x${Math.round(height)}-r${Math.round(radius)}`
  if (!scene.textures.exists(key)) {
    const canvas = scene.textures.createCanvas(key, Math.max(8, Math.round(width)), Math.max(8, Math.round(height)))
    const ctx = canvas?.getContext()
    if (canvas && ctx) {
      const w = canvas.width
      const h = canvas.height
      const r = Math.min(radius, Math.min(w, h) / 2)

      const drawRoundedRect = (inset: number) => {
        const x0 = inset
        const y0 = inset
        const x1 = w - inset
        const y1 = h - inset
        const rr = Math.max(0, r - inset)
        ctx.beginPath()
        ctx.moveTo(x0 + rr, y0)
        ctx.arcTo(x1, y0, x1, y1, rr)
        ctx.arcTo(x1, y1, x0, y1, rr)
        ctx.arcTo(x0, y1, x0, y0, rr)
        ctx.arcTo(x0, y0, x1, y0, rr)
        ctx.closePath()
      }

      ctx.clearRect(0, 0, w, h)

      const base = ctx.createLinearGradient(0, 0, w, h)
      base.addColorStop(0, 'rgba(255, 255, 255, 0.18)')
      base.addColorStop(0.5, 'rgba(255, 255, 255, 0.07)')
      base.addColorStop(1, 'rgba(255, 255, 255, 0.035)')

      ctx.fillStyle = base
      drawRoundedRect(0)
      ctx.fill()

      const innerGlow = ctx.createLinearGradient(0, 0, 0, h)
      innerGlow.addColorStop(0, 'rgba(255, 255, 255, 0.18)')
      innerGlow.addColorStop(0.32, 'rgba(255, 255, 255, 0.02)')
      innerGlow.addColorStop(1, 'rgba(255, 255, 255, 0)')
      ctx.globalCompositeOperation = 'screen'
      ctx.fillStyle = innerGlow
      drawRoundedRect(0)
      ctx.fill()
      ctx.globalCompositeOperation = 'source-over'

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)'
      ctx.lineWidth = 2
      drawRoundedRect(1)
      ctx.stroke()

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'
      ctx.lineWidth = 1
      drawRoundedRect(4)
      ctx.stroke()

      const topShine = ctx.createLinearGradient(0, 0, w, 0)
      topShine.addColorStop(0, 'rgba(255, 255, 255, 0)')
      topShine.addColorStop(0.35, 'rgba(255, 255, 255, 0.14)')
      topShine.addColorStop(0.65, 'rgba(255, 255, 255, 0.12)')
      topShine.addColorStop(1, 'rgba(255, 255, 255, 0)')
      ctx.fillStyle = topShine
      ctx.globalAlpha = 0.7
      ctx.fillRect(0, 0, w, Math.max(2, Math.round(h * 0.22)))
      ctx.globalAlpha = 1

      canvas.refresh()
    }
  }

  const container = scene.add.container(x, y).setDepth(depth).setAlpha(alpha)

  const shadow = scene.add.graphics()
  shadow.fillStyle(0x000000, 0.28)
  shadow.fillRoundedRect(-width / 2 + 6, -height / 2 + 10, width, height, radius)

  const base = scene.add.image(0, 0, key).setOrigin(0.5)

  const border = scene.add.graphics()
  border.lineStyle(2, 0xffffff, 0.12)
  border.strokeRoundedRect(-width / 2, -height / 2, width, height, radius)

  const inner = scene.add.graphics()
  inner.lineStyle(1, accent, 0.16)
  inner.strokeRoundedRect(
    -width / 2 + 4,
    -height / 2 + 4,
    width - 8,
    height - 8,
    Math.max(0, radius - 4)
  )

  const maskShape = scene.add.graphics()
  maskShape.setVisible(false)
  maskShape.fillStyle(0xffffff, 1)
  maskShape.fillRoundedRect(-width / 2, -height / 2, width, height, radius)
  const mask = maskShape.createGeometryMask()

  const sheen = scene.add
    .image(-width * 0.7, -height * 0.55, 'sheen')
    .setOrigin(0.5)
    .setAlpha(0.1)
    .setBlendMode(Phaser.BlendModes.ADD)
  sheen.setScale((width / 256) * 2.1, (height / 256) * 2.1)
  sheen.setRotation(-0.15)
  sheen.setMask(mask)

  container.add([shadow, base, border, inner, maskShape, sheen])

  if (float) {
    scene.tweens.add({
      targets: container,
      y: y + 6,
      duration: 2600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })
  }

  if (animateSheen) {
    scene.tweens.add({
      targets: sheen,
      x: width * 0.65,
      duration: float ? 3200 : 5200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: float ? 0 : 500
    })
  } else {
    sheen.setX(0)
  }

  container.setDataEnabled()
  container.setData('base', base)
  container.setData('border', border)
  container.setData('inner', inner)
  container.setData('sheen', sheen)
  container.setData('mask', mask)
  container.setData('maskShape', maskShape)

  return container
}
