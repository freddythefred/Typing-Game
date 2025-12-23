import Phaser from 'phaser'

export class AudioSystem {
  private scene: Phaser.Scene
  private context: AudioContext | null = null
  private masterGain: GainNode | null = null

  constructor(scene: Phaser.Scene, volume: number) {
    this.scene = scene

    if (this.scene.sound instanceof Phaser.Sound.WebAudioSoundManager) {
      this.context = this.scene.sound.context
      this.masterGain = this.context.createGain()
      this.masterGain.gain.value = volume
      this.masterGain.connect(this.context.destination)
    }
  }

  setVolume(volume: number) {
    if (!this.masterGain) return
    this.masterGain.gain.value = volume
  }

  playTick() {
    if (!this.context || !this.masterGain) return
    this.playTone('triangle', 880, 0.05, 0.18)
  }

  playError() {
    if (!this.context || !this.masterGain) return
    this.playTone('sawtooth', 190, 0.12, 0.22)
  }

  playPop() {
    if (!this.context || !this.masterGain) return
    this.playNoise(0.12, 0.2, 1200)
  }

  playSplash() {
    if (!this.context || !this.masterGain) return
    this.playNoise(0.2, 0.25, 600)
  }

  private playTone(type: OscillatorType, freq: number, duration: number, gainValue: number) {
    if (!this.context || !this.masterGain) return
    const now = this.context.currentTime
    const osc = this.context.createOscillator()
    const gain = this.context.createGain()
    osc.type = type
    osc.frequency.value = freq
    gain.gain.value = gainValue

    osc.connect(gain)
    gain.connect(this.masterGain)

    gain.gain.setValueAtTime(gainValue, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration)

    osc.start(now)
    osc.stop(now + duration)
  }

  private playNoise(duration: number, gainValue: number, lowpass: number) {
    if (!this.context || !this.masterGain) return
    const now = this.context.currentTime
    const bufferSize = Math.floor(this.context.sampleRate * duration)
    const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize)
    }

    const source = this.context.createBufferSource()
    source.buffer = buffer

    const filter = this.context.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = lowpass

    const gain = this.context.createGain()
    gain.gain.value = gainValue

    source.connect(filter)
    filter.connect(gain)
    gain.connect(this.masterGain)

    source.start(now)
    source.stop(now + duration)
  }
}
