import Phaser from 'phaser'
import type { BubbleManager, BubbleItem } from './BubbleManager'

export type TypingStats = {
  totalKeys: number
  correctKeys: number
}

export type TypingCallbacks = {
  onCorrectKey: () => void
  onErrorKey: () => void
  onComplete: (bubble: BubbleItem) => void
}

export class TypingSystem {
  private scene: Phaser.Scene
  private bubbleManager: BubbleManager
  private callbacks: TypingCallbacks
  private buffer = ''
  private activeTarget: BubbleItem | null = null
  private accentInsensitive = false
  private stats: TypingStats = { totalKeys: 0, correctKeys: 0 }

  constructor(scene: Phaser.Scene, bubbleManager: BubbleManager, callbacks: TypingCallbacks) {
    this.scene = scene
    this.bubbleManager = bubbleManager
    this.callbacks = callbacks
    this.scene.input.keyboard?.on('keydown', this.handleKey, this)
  }

  destroy() {
    this.scene.input.keyboard?.off('keydown', this.handleKey, this)
  }

  setAccentInsensitive(value: boolean) {
    this.accentInsensitive = value
  }

  getBuffer() {
    return this.buffer
  }

  getStats() {
    return this.stats
  }

  reset() {
    this.buffer = ''
    this.activeTarget = null
    this.stats = { totalKeys: 0, correctKeys: 0 }
    this.bubbleManager.setHighlight(null)
  }

  private handleKey(event: KeyboardEvent) {
    if (this.activeTarget && !this.activeTarget.active) {
      this.activeTarget = null
    }

    if (event.key === 'Backspace') {
      this.buffer = this.buffer.slice(0, -1)
      this.updateTarget()
      return
    }

    if (event.key.length !== 1) return
    this.stats.totalKeys += 1

    this.buffer += event.key
    const normalizedBuffer = this.normalize(this.buffer)

    const exactMatch = this.pickExactMatch(normalizedBuffer)
    if (exactMatch) {
      this.stats.correctKeys += 1
      this.callbacks.onCorrectKey()
      this.bubbleManager.setHighlight(exactMatch)
      this.activeTarget = exactMatch
      this.updateProgress(exactMatch)

      this.callbacks.onComplete(exactMatch)
      this.buffer = ''
      this.activeTarget = null
      this.bubbleManager.setHighlight(null)
      this.bubbleManager.getActiveBubbles().forEach((bubble) => this.bubbleManager.setProgress(bubble, 0))
      return
    }

    const nextTarget = this.selectTarget(normalizedBuffer)
    if (nextTarget) {
      const normalizedTarget = nextTarget.normalized || this.normalize(nextTarget.text)
      if (!normalizedTarget.startsWith(normalizedBuffer)) {
        this.callbacks.onErrorKey()
        this.buffer = this.buffer.slice(0, -1)
        this.updateTarget()
        return
      }
      this.stats.correctKeys += 1
      this.callbacks.onCorrectKey()
      this.activeTarget = nextTarget
      this.updateProgress(nextTarget)
      if (normalizedTarget === normalizedBuffer) {
        this.callbacks.onComplete(nextTarget)
        this.buffer = ''
        this.activeTarget = null
        this.bubbleManager.setHighlight(null)
        this.bubbleManager.getActiveBubbles().forEach((bubble) => this.bubbleManager.setProgress(bubble, 0))
      }
      return
    }

    this.callbacks.onErrorKey()
    this.buffer = this.buffer.slice(0, -1)
    this.updateTarget()
  }

  private updateTarget() {
    const normalizedBuffer = this.normalize(this.buffer)
    if (!normalizedBuffer.length) {
      this.activeTarget = null
      this.bubbleManager.setHighlight(null)
      this.bubbleManager.getActiveBubbles().forEach((bubble) => this.bubbleManager.setProgress(bubble, 0))
      return
    }

    if (this.activeTarget) {
      const normalizedTarget = this.activeTarget.normalized || this.normalize(this.activeTarget.text)
      if (normalizedTarget.startsWith(normalizedBuffer)) {
        this.updateProgress(this.activeTarget)
        return
      }
    }

    const nextTarget = this.selectTarget(normalizedBuffer)
    this.activeTarget = nextTarget
    this.updateProgress(nextTarget)
  }

  private selectTarget(normalizedBuffer: string) {
    if (this.activeTarget) {
      const normalizedTarget = this.activeTarget.normalized || this.normalize(this.activeTarget.text)
      if (normalizedTarget.startsWith(normalizedBuffer)) {
        this.bubbleManager.setHighlight(this.activeTarget)
        return this.activeTarget
      }
    }

    const candidates = this.bubbleManager.getActiveBubbles().filter((bubble) => {
      const normalized = bubble.normalized || this.normalize(bubble.text)
      return normalized.startsWith(normalizedBuffer)
    })
    if (candidates.length === 0) {
      this.bubbleManager.setHighlight(null)
      return null
    }
    const target = candidates.sort((a, b) => b.sprite.y - a.sprite.y)[0]
    this.bubbleManager.setHighlight(target)
    return target
  }

  private pickExactMatch(normalizedBuffer: string) {
    if (!normalizedBuffer.length) return null

    const exact = this.bubbleManager.getActiveBubbles().filter((bubble) => {
      const normalizedTarget = bubble.normalized || this.normalize(bubble.text)
      return normalizedTarget === normalizedBuffer
    })
    if (exact.length === 0) return null

    return exact.sort((a, b) => b.sprite.y - a.sprite.y)[0]
  }

  private updateProgress(target: BubbleItem | null) {
    this.bubbleManager.getActiveBubbles().forEach((bubble) => {
      if (!target || bubble.id !== target.id) {
        this.bubbleManager.setProgress(bubble, 0)
        return
      }
      this.bubbleManager.setProgress(bubble, this.buffer.length)
    })
  }

  private normalize(text: string) {
    const lowered = text.toLowerCase()
    if (!this.accentInsensitive) return lowered
    return lowered.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  }
}
