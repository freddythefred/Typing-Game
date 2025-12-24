import Phaser from 'phaser'

export function createBubbleTexture(scene: Phaser.Scene) {
  const size = 256
  const canvas = scene.textures.createCanvas('bubble', size, size)
  if (!canvas) return
  const ctx = canvas.getContext()
  if (!ctx) return

  const center = size / 2
  const radius = size * 0.425

  ctx.clearRect(0, 0, size, size)

  const base = ctx.createRadialGradient(
    center - radius * 0.25,
    center - radius * 0.25,
    radius * 0.08,
    center,
    center,
    radius
  )
  base.addColorStop(0, 'rgba(235, 252, 255, 0.55)')
  base.addColorStop(0.35, 'rgba(180, 232, 255, 0.36)')
  base.addColorStop(0.7, 'rgba(105, 180, 240, 0.26)')
  base.addColorStop(1, 'rgba(55, 120, 175, 0.18)')

  ctx.fillStyle = base
  ctx.beginPath()
  ctx.arc(center, center, radius, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = 'rgba(230, 252, 255, 0.22)'
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.arc(center, center, radius * 0.965, 0, Math.PI * 2)
  ctx.stroke()

  ctx.strokeStyle = 'rgba(40, 85, 125, 0.12)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(center, center, radius * 0.9, 0, Math.PI * 2)
  ctx.stroke()

  canvas.refresh()
}

export function createHaloTexture(scene: Phaser.Scene) {
  const size = 256
  const canvas = scene.textures.createCanvas('halo', size, size)
  if (!canvas) return
  const ctx = canvas.getContext()
  if (!ctx) return

  const center = size / 2
  const radius = size * 0.45
  const gradient = ctx.createRadialGradient(center, center, radius * 0.3, center, center, radius)
  gradient.addColorStop(0, 'rgba(102, 227, 255, 0)')
  gradient.addColorStop(0.55, 'rgba(102, 227, 255, 0.4)')
  gradient.addColorStop(1, 'rgba(102, 227, 255, 0)')

  ctx.clearRect(0, 0, size, size)
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(center, center, radius, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = 'rgba(190, 250, 255, 0.35)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(center, center, radius * 0.78, 0, Math.PI * 2)
  ctx.stroke()

  canvas.refresh()
}

export function createParticleTexture(scene: Phaser.Scene) {
  const size = 32
  const canvas = scene.textures.createCanvas('particle', size, size)
  if (!canvas) return
  const ctx = canvas.getContext()
  if (!ctx) return

  const gradient = ctx.createRadialGradient(size / 2, size / 2, 2, size / 2, size / 2, 14)
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)')
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')

  ctx.clearRect(0, 0, size, size)
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, 14, 0, Math.PI * 2)
  ctx.fill()

  canvas.refresh()
}

export function createSparkTexture(scene: Phaser.Scene) {
  const size = 64
  const canvas = scene.textures.createCanvas('spark', size, size)
  if (!canvas) return
  const ctx = canvas.getContext()
  if (!ctx) return

  const center = size / 2
  const gradient = ctx.createRadialGradient(center, center, 1, center, center, size * 0.48)
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)')
  gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.55)')
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')

  ctx.clearRect(0, 0, size, size)
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(center, center, size * 0.48, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(center, 6)
  ctx.lineTo(center, size - 6)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(6, center)
  ctx.lineTo(size - 6, center)
  ctx.stroke()

  canvas.refresh()
}

export function createRippleTexture(scene: Phaser.Scene) {
  const size = 128
  const canvas = scene.textures.createCanvas('ripple', size, size)
  if (!canvas) return
  const ctx = canvas.getContext()
  if (!ctx) return

  ctx.clearRect(0, 0, size, size)
  ctx.strokeStyle = 'rgba(170, 240, 255, 0.65)'
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, size * 0.35, 0, Math.PI * 2)
  ctx.stroke()

  ctx.strokeStyle = 'rgba(170, 240, 255, 0.3)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, size * 0.42, 0, Math.PI * 2)
  ctx.stroke()

  canvas.refresh()
}

export function createWaterTexture(scene: Phaser.Scene) {
  const width = 512
  const height = 128
  const canvas = scene.textures.createCanvas('water', width, height)
  if (!canvas) return
  const ctx = canvas.getContext()
  if (!ctx) return

  ctx.clearRect(0, 0, width, height)

  const gradient = ctx.createLinearGradient(0, 0, 0, height)
  gradient.addColorStop(0, 'rgba(65, 155, 205, 0.88)')
  gradient.addColorStop(0.28, 'rgba(35, 110, 165, 0.92)')
  gradient.addColorStop(1, 'rgba(8, 30, 55, 0.98)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  const foam = ctx.createLinearGradient(0, 0, 0, height * 0.32)
  foam.addColorStop(0, 'rgba(210, 250, 255, 0.55)')
  foam.addColorStop(1, 'rgba(210, 250, 255, 0)')
  ctx.fillStyle = foam
  ctx.fillRect(0, 0, width, height * 0.32)

  ctx.strokeStyle = 'rgba(170, 240, 255, 0.55)'
  ctx.lineWidth = 2.25
  for (let i = 0; i < 7; i += 1) {
    const y = 10 + i * 16
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.bezierCurveTo(width * 0.18, y - 7, width * 0.42, y + 7, width * 0.6, y - 4)
    ctx.bezierCurveTo(width * 0.76, y + 6, width * 0.92, y - 7, width, y + 3)
    ctx.stroke()
  }

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)'
  ctx.lineWidth = 1.2
  for (let i = 0; i < 4; i += 1) {
    const y = 18 + i * 26
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.bezierCurveTo(width * 0.22, y + 5, width * 0.48, y - 5, width * 0.62, y + 2)
    ctx.bezierCurveTo(width * 0.78, y - 4, width * 0.92, y + 4, width, y - 2)
    ctx.stroke()
  }

  canvas.refresh()
}

export function createNoiseTexture(scene: Phaser.Scene) {
  const size = 256
  const canvas = scene.textures.createCanvas('noise', size, size)
  if (!canvas) return
  const ctx = canvas.getContext()
  if (!ctx) return

  const image = ctx.createImageData(size, size)
  const data = image.data
  for (let i = 0; i < data.length; i += 4) {
    const v = Math.floor(Math.random() * 255)
    data[i] = v
    data[i + 1] = v
    data[i + 2] = v
    data[i + 3] = Math.floor(Math.random() * 55)
  }
  ctx.putImageData(image, 0, 0)
  canvas.refresh()
}

export function createSheenTexture(scene: Phaser.Scene) {
  const size = 256
  const canvas = scene.textures.createCanvas('sheen', size, size)
  if (!canvas) return
  const ctx = canvas.getContext()
  if (!ctx) return

  ctx.clearRect(0, 0, size, size)

  const gradient = ctx.createLinearGradient(0, 0, size, size)
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0)')
  gradient.addColorStop(0.35, 'rgba(255, 255, 255, 0)')
  gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.95)')
  gradient.addColorStop(0.65, 'rgba(255, 255, 255, 0)')
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)

  canvas.refresh()
}

export function createLightTexture(scene: Phaser.Scene) {
  const size = 512
  const canvas = scene.textures.createCanvas('light', size, size)
  if (!canvas) return
  const ctx = canvas.getContext()
  if (!ctx) return

  const center = size / 2
  const gradient = ctx.createRadialGradient(center, center, 0, center, center, center)
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)')
  gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.45)')
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')

  ctx.clearRect(0, 0, size, size)
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(center, center, center, 0, Math.PI * 2)
  ctx.fill()

  canvas.refresh()
}

export function createVignetteTexture(scene: Phaser.Scene) {
  const size = 512
  const canvas = scene.textures.createCanvas('vignette', size, size)
  if (!canvas) return
  const ctx = canvas.getContext()
  if (!ctx) return

  const center = size / 2
  const gradient = ctx.createRadialGradient(center, center, size * 0.12, center, center, center)
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)')
  gradient.addColorStop(0.6, 'rgba(0, 0, 0, 0.15)')
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.72)')

  ctx.clearRect(0, 0, size, size)
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(center, center, center, 0, Math.PI * 2)
  ctx.fill()

  canvas.refresh()
}

export function createShaftTexture(scene: Phaser.Scene) {
  const width = 128
  const height = 512
  const canvas = scene.textures.createCanvas('shaft', width, height)
  if (!canvas) return
  const ctx = canvas.getContext()
  if (!ctx) return

  ctx.clearRect(0, 0, width, height)

  const xGrad = ctx.createLinearGradient(0, 0, width, 0)
  xGrad.addColorStop(0, 'rgba(255, 255, 255, 0)')
  xGrad.addColorStop(0.45, 'rgba(255, 255, 255, 0.38)')
  xGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.55)')
  xGrad.addColorStop(0.55, 'rgba(255, 255, 255, 0.38)')
  xGrad.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.fillStyle = xGrad
  ctx.fillRect(0, 0, width, height)

  ctx.globalCompositeOperation = 'destination-in'
  const yGrad = ctx.createLinearGradient(0, 0, 0, height)
  yGrad.addColorStop(0, 'rgba(255, 255, 255, 0.75)')
  yGrad.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.fillStyle = yGrad
  ctx.fillRect(0, 0, width, height)
  ctx.globalCompositeOperation = 'source-over'

  canvas.refresh()
}

export function createBubbleSpecTexture(scene: Phaser.Scene) {
  const size = 256
  const canvas = scene.textures.createCanvas('bubbleSpec', size, size)
  if (!canvas) return
  const ctx = canvas.getContext()
  if (!ctx) return

  const center = size / 2
  const radius = size * 0.45

  ctx.clearRect(0, 0, size, size)
  ctx.save()
  ctx.translate(center - radius * 0.18, center - radius * 0.22)
  ctx.rotate(-0.6)
  const spec = ctx.createRadialGradient(0, 0, radius * 0.06, 0, 0, radius * 0.62)
  spec.addColorStop(0, 'rgba(255, 255, 255, 0.95)')
  spec.addColorStop(0.25, 'rgba(255, 255, 255, 0.28)')
  spec.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.fillStyle = spec
  ctx.beginPath()
  ctx.ellipse(0, 0, radius * 0.6, radius * 0.36, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  canvas.refresh()
}
