import Phaser from 'phaser'

export function createBubbleTexture(scene: Phaser.Scene) {
  const size = 256
  const canvas = scene.textures.createCanvas('bubble', size, size)
  if (!canvas) return
  const ctx = canvas.getContext()
  if (!ctx) return

  const center = size / 2
  const radius = size * 0.42

  const gradient = ctx.createRadialGradient(center, center, radius * 0.2, center, center, radius)
  gradient.addColorStop(0, 'rgba(180, 220, 245, 0.28)')
  gradient.addColorStop(0.6, 'rgba(120, 180, 220, 0.22)')
  gradient.addColorStop(1, 'rgba(80, 140, 190, 0.18)')

  ctx.clearRect(0, 0, size, size)
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(center, center, radius, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = 'rgba(140, 200, 235, 0.45)'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.arc(center, center, radius * 0.97, 0, Math.PI * 2)
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
  gradient.addColorStop(0.6, 'rgba(102, 227, 255, 0.35)')
  gradient.addColorStop(1, 'rgba(102, 227, 255, 0)')

  ctx.clearRect(0, 0, size, size)
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(center, center, radius, 0, Math.PI * 2)
  ctx.fill()

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

export function createRippleTexture(scene: Phaser.Scene) {
  const size = 128
  const canvas = scene.textures.createCanvas('ripple', size, size)
  if (!canvas) return
  const ctx = canvas.getContext()
  if (!ctx) return

  ctx.clearRect(0, 0, size, size)
  ctx.strokeStyle = 'rgba(150, 220, 255, 0.6)'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, size * 0.35, 0, Math.PI * 2)
  ctx.stroke()

  ctx.strokeStyle = 'rgba(150, 220, 255, 0.35)'
  ctx.lineWidth = 2
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

  const gradient = ctx.createLinearGradient(0, 0, 0, height)
  gradient.addColorStop(0, 'rgba(40, 110, 150, 0.85)')
  gradient.addColorStop(1, 'rgba(10, 40, 70, 0.95)')

  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  ctx.strokeStyle = 'rgba(120, 210, 255, 0.5)'
  ctx.lineWidth = 2
  for (let i = 0; i < 6; i += 1) {
    const y = 12 + i * 18
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.bezierCurveTo(width * 0.2, y - 6, width * 0.4, y + 6, width * 0.6, y - 4)
    ctx.bezierCurveTo(width * 0.75, y + 6, width * 0.9, y - 6, width, y + 2)
    ctx.stroke()
  }

  canvas.refresh()
}
