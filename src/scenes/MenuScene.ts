import Phaser from 'phaser'
import { DIFFICULTY, type DifficultyId } from '../config/difficulty'
import { createButton } from '../ui/components/UiButton'
import { createGlassPanel } from '../ui/components/GlassPanel'
import { loadSettings, saveSettings } from '../systems/SettingsStore'
import { getBestScore } from '../systems/BestScoreStore'
import { createUnderwaterBackground, type UnderwaterBackground } from '../ui/fx/UnderwaterBackground'
import { ensureDefaultProfile, getActiveProfileId } from '../systems/ProfileStore'
import type { LanguageId } from '../data/wordBank'
import { difficultyLabel, formatInt, t } from '../i18n/i18n'

type BackBubble = {
  sprite: Phaser.GameObjects.Sprite
  spec: Phaser.GameObjects.Sprite
  speed: number
  drift: number
}

const LANGUAGE_FLAG_TEXTURE_KEYS: Record<LanguageId, string> = {
  en: 'flag-en',
  fr: 'flag-fr',
  es: 'flag-es',
  it: 'flag-it',
  de: 'flag-de',
  ru: 'flag-ru',
  ar: 'flag-ar'
}

export class MenuScene extends Phaser.Scene {
  private bubbles: BackBubble[] = []
  private difficultyId: DifficultyId = 'level1'
  private backdropFx?: UnderwaterBackground
  private heroBubble?: Phaser.GameObjects.Sprite
  private heroSpec?: Phaser.GameObjects.Sprite
  private title?: Phaser.GameObjects.Text
  private titleBaseY = 96
  private heroBaseY = 110

  constructor() {
    super('Menu')
  }

  create() {
    const settings = loadSettings()
    this.difficultyId = settings.difficulty
    const activeProfileId = getActiveProfileId() ?? ensureDefaultProfile().id
    const language = settings.language

    const uiScale = Phaser.Math.Clamp(Math.min(this.scale.width / 1280, this.scale.height / 720), 0.78, 1.2)
    const centerX = this.scale.width / 2
    this.titleBaseY = Math.round(96 * uiScale)
    this.heroBaseY = Math.round(110 * uiScale)

    this.cameras.main.fadeIn(650, 4, 10, 18)
    this.backdropFx?.destroy()
    this.backdropFx = createUnderwaterBackground(this, {
      depth: -12,
      withDust: true,
      withPointerLight: true,
      withShafts: false
    })

    this.createBackgroundBubbles()
    this.createHeroBubble(uiScale)

    this.title = this.add.text(centerX, this.titleBaseY, t(language, 'menu.title'), {
      fontFamily: 'BubbleDisplay',
      fontSize: `${Math.round(64 * uiScale)}px`,
      color: '#eaf6ff'
    })
    this.title.setOrigin(0.5)
    this.title.setStroke('rgba(102,227,255,0.22)', 8)
    this.title.setShadow(0, 12, 'rgba(0,0,0,0.35)', 22, true, true)
    this.title.setDepth(10)

    const panelWidth = Math.min(Math.round(860 * uiScale), this.scale.width - 60)
    const extraBottom = Math.round(38 * uiScale)
    const panelHeight = Math.round(310 * uiScale) + extraBottom
    const panelY = Math.round(294 * uiScale) + Math.round(extraBottom / 2)
    const panel = createGlassPanel(this, centerX, panelY, panelWidth, panelHeight, {
      depth: 6,
      float: !window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches,
      radius: Math.round(28 * uiScale),
      accent: 0x66e3ff
    })
    panel.setDepth(6)

    const applyFlagSizingAndCrop = (flag: Phaser.GameObjects.Image) => {
      const targetHeight = Math.round(52 * uiScale)
      const targetWidth = Math.round(targetHeight * 1.5)
      const scale = targetHeight / Math.max(1, flag.height)
      flag.setScale(scale)

      const cropWidth = Math.min(flag.width, Math.round(targetWidth / scale))
      const cropX = Math.max(0, Math.floor((flag.width - cropWidth) / 2))
      flag.setCrop(cropX, 0, cropWidth, flag.height)
    }

    const languageFlag = this.add
      .image(0, 0, LANGUAGE_FLAG_TEXTURE_KEYS[settings.language])
      .setOrigin(1, 0)
      .setDepth(11)
      .setAlpha(0)
    applyFlagSizingAndCrop(languageFlag)

    const flagPadding = Math.round(18 * uiScale)
    const panelRight = centerX + panelWidth / 2
    const panelTop = panelY - panelHeight / 2
    languageFlag.setPosition(Math.round(panelRight - flagPadding), Math.round(panelTop + flagPadding))

    this.time.delayedCall(300, () => {
      languageFlag.setAlpha(1)
    })

    const difficultyTitle = this.add.text(centerX, Math.round(188 * uiScale), t(language, 'menu.chooseMode'), {
      fontFamily: 'BubbleDisplay',
      fontSize: `${Math.round(20 * uiScale)}px`,
      color: 'rgba(234,246,255,0.72)'
    })
    difficultyTitle.setOrigin(0.5)
    difficultyTitle.setDepth(10)

    const wordEntries = [DIFFICULTY.level1, DIFFICULTY.level2, DIFFICULTY.level3]
    const phraseEntries = [DIFFICULTY.extra, DIFFICULTY.phrases2, DIFFICULTY.phrases3]
    const spacing = Math.round(18 * uiScale)
    const cardHeight = Math.round(84 * uiScale)

    const cardsInnerPadding = Math.round(50 * uiScale)
    const maxCardsWidth = Math.max(0, Math.min(panelWidth - cardsInnerPadding, Math.round(920 * uiScale)))
    const cardsPerRow = 3
    const cardWidth = Math.floor((maxCardsWidth - spacing * (cardsPerRow - 1)) / cardsPerRow)
    const totalWidth = cardWidth * cardsPerRow + spacing * (cardsPerRow - 1)
    const startX = centerX - totalWidth / 2 + cardWidth / 2
    const leftEdgeX = startX - cardWidth / 2
    const rightEdgeX = leftEdgeX + totalWidth

    const sectionLabelStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: 'BubbleDisplay',
      fontSize: `${Math.round(18 * uiScale)}px`,
      color: 'rgba(234,246,255,0.75)'
    }

    const wordsRowY = Math.round(266 * uiScale)
    const phrasesSectionOffsetY = Math.round(38 * uiScale)
    const phrasesRowY = Math.round(366 * uiScale) + phrasesSectionOffsetY
    const labelOffsetY = Math.round(cardHeight / 2 + 18 * uiScale)
    const wordsLabelY = Math.round(wordsRowY - labelOffsetY)
    const phrasesLabelY = Math.round(phrasesRowY - labelOffsetY)

    const wordsLabel = this.add.text(leftEdgeX, wordsLabelY, t(language, 'menu.words'), {
      ...sectionLabelStyle,
      color: 'rgba(102,227,255,0.82)'
    })
    wordsLabel.setOrigin(0, 0.5)
    wordsLabel.setDepth(10)

    const phrasesLabel = this.add.text(leftEdgeX, phrasesLabelY, t(language, 'menu.phrases'), {
      ...sectionLabelStyle,
      color: 'rgba(255,207,102,0.82)'
    })
    phrasesLabel.setOrigin(0, 0.5)
    phrasesLabel.setDepth(10)

    const divider = this.add.graphics().setDepth(10)
    divider.lineStyle(1, 0xffffff, 0.12)
    divider.beginPath()
    divider.moveTo(leftEdgeX, Math.round((wordsLabelY + phrasesLabelY) / 2))
    divider.lineTo(rightEdgeX, Math.round((wordsLabelY + phrasesLabelY) / 2))
    divider.strokePath()

    const cards: Phaser.GameObjects.Container[] = []

    const createCard = (entry: (typeof wordEntries)[number], x: number, y: number) => {
      const accent = entry.phraseMode ? 0xffcf66 : 0x66e3ff
      const card = createGlassPanel(this, x, y, cardWidth, cardHeight, {
        depth: 7,
        radius: Math.round(22 * uiScale),
        accent,
        animateSheen: false
      })
      card.setSize(cardWidth, cardHeight)
      card.setInteractive({ useHandCursor: true })

      const halo = this.add
        .image(0, 0, 'halo')
        .setAlpha(0)
        .setTint(accent)
        .setBlendMode(Phaser.BlendModes.ADD)
      halo.setScale((cardWidth / 256) * 1.55)
      card.addAt(halo, 1)
      card.setData('halo', halo)

      const label = this.add.text(0, -16, difficultyLabel(language, entry.id), {
        fontFamily: 'BubbleDisplay',
        fontSize: `${Math.round(18 * uiScale)}px`,
        color: '#eaf6ff'
      })
      label.setOrigin(0.5)
      label.setShadow(0, 4, 'rgba(0,0,0,0.35)', 10, false, true)

      const sub = this.add.text(0, 6, entry.phraseMode ? t(language, 'menu.phrases') : t(language, 'menu.words'), {
        fontFamily: 'BubbleDisplay',
        fontSize: `${Math.round(13 * uiScale)}px`,
        color: 'rgba(234,246,255,0.62)'
      })
      sub.setOrigin(0.5)

      const best = getBestScore(activeProfileId, language, entry.id)
      const bestText = formatInt(language, best > 0 ? best : 0)
      const bestLabel = this.add.text(0, 24, t(language, 'menu.best', { value: bestText }), {
        fontFamily: 'BubbleDisplay',
        fontSize: `${Math.round(12 * uiScale)}px`,
        color: 'rgba(234,246,255,0.55)'
      })
      bestLabel.setOrigin(0.5)

      card.add([label, sub, bestLabel])

      card.on('pointerover', () => {
        this.tweens.add({ targets: card, scale: 1.05, duration: 150, ease: 'Sine.easeOut' })
      })
      card.on('pointerout', () => {
        this.tweens.add({ targets: card, scale: 1, duration: 180, ease: 'Sine.easeOut' })
      })
      card.on('pointermove', (pointer: Phaser.Input.Pointer) => {
        const rx = Phaser.Math.Clamp((pointer.x - card.x) / (cardWidth * 0.5), -1, 1)
        const ry = Phaser.Math.Clamp((pointer.y - card.y) / (cardHeight * 0.5), -1, 1)
        halo.setPosition(-rx * 4, -ry * 4)
      })
      card.on('pointerup', () => {
        this.difficultyId = entry.id
        this.updateCardHighlights(cards)
      })

      card.setData('entry', entry.id)
      card.setDepth(8)
      return card
    }

    wordEntries.forEach((entry, index) => {
      const x = startX + index * (cardWidth + spacing)
      cards.push(createCard(entry, x, wordsRowY))
    })
    phraseEntries.forEach((entry, index) => {
      const x = startX + index * (cardWidth + spacing)
      cards.push(createCard(entry, x, phrasesRowY))
    })

    this.updateCardHighlights(cards)

    let transitioning = false
    const buttonWidth = Math.min(Math.round(300 * uiScale), this.scale.width - 80)
    const playHeight = Math.round(60 * uiScale)
    const settingsHeight = Math.round(56 * uiScale)
    const profileHeight = Math.round(56 * uiScale)
    const panelBottom = panelY + panelHeight / 2
    const buttonsTopGap = Math.round(22 * uiScale)
    const buttonsGap = Math.round(14 * uiScale)
    const playY = Math.round(panelBottom + buttonsTopGap + playHeight / 2)
    const settingsY = Math.round(playY + playHeight / 2 + buttonsGap + settingsHeight / 2)
    const profileY = Math.round(settingsY + settingsHeight / 2 + buttonsGap + profileHeight / 2)

    let playButton: Phaser.GameObjects.Container | undefined
    let settingsButton: Phaser.GameObjects.Container | undefined
    let changeProfileButton: Phaser.GameObjects.Container | undefined

    playButton = createButton(this, centerX, playY, t(language, 'menu.play'), () => {
      if (transitioning) return
      transitioning = true
      playButton?.disableInteractive()
      settingsButton?.disableInteractive()
      changeProfileButton?.disableInteractive()

      const next = { ...settings, difficulty: this.difficultyId }
      saveSettings(next)

      this.cameras.main.fadeOut(260, 4, 10, 18)
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.start('Game', { difficulty: this.difficultyId })
      })
    }, { width: buttonWidth, height: playHeight, depth: 9 })

    settingsButton = createButton(this, centerX, settingsY, t(language, 'menu.settings'), () => {
      if (transitioning) return
      transitioning = true
      playButton?.disableInteractive()
      settingsButton?.disableInteractive()
      changeProfileButton?.disableInteractive()
      this.cameras.main.fadeOut(240, 4, 10, 18)
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.start('Settings')
      })
    }, { width: buttonWidth, height: settingsHeight, depth: 9, accent: 0xffcf66 })

    changeProfileButton = createButton(this, centerX, profileY, t(language, 'menu.changeProfile'), () => {
      if (transitioning) return
      transitioning = true
      playButton?.disableInteractive()
      settingsButton?.disableInteractive()
      changeProfileButton?.disableInteractive()
      this.cameras.main.fadeOut(240, 4, 10, 18)
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.start('ProfileSelect')
      })
    }, { width: buttonWidth, height: profileHeight, depth: 9 })

    const tagline = this.add.text(centerX, 0, t(language, 'menu.tagline'), {
      fontFamily: 'BubbleDisplay',
      fontSize: `${Math.round(18 * uiScale)}px`,
      color: 'rgba(234,246,255,0.6)'
    })
    tagline.setOrigin(0.5)
    tagline.setY(this.scale.height - tagline.height / 2 - Math.round(2 * uiScale))

    const vignette = this.add
      .image(this.scale.width / 2, this.scale.height / 2, 'vignette')
      .setBlendMode(Phaser.BlendModes.MULTIPLY)
      .setAlpha(0.16)
      .setDepth(90)
    vignette.setScale(Math.max(this.scale.width, this.scale.height) / 512)

    const entrance = [
      this.title,
      panel,
      difficultyTitle,
      wordsLabel,
      phrasesLabel,
      divider,
      ...cards,
      playButton,
      settingsButton,
      changeProfileButton
    ].filter(
      Boolean
    ) as Phaser.GameObjects.GameObject[]

    entrance.forEach((obj) => {
      const anyObj = obj as unknown as Phaser.GameObjects.Components.Transform &
        Phaser.GameObjects.Components.Alpha & { y: number; alpha: number }
      anyObj.alpha = 0
      anyObj.y += 10 * uiScale
    })
    this.tweens.add({
      targets: entrance,
      alpha: 1,
      y: '-=10',
      duration: 520,
      ease: 'Cubic.easeOut',
      stagger: 35,
      delay: 120
    })

    this.scale.on('resize', () => {
      this.scene.restart()
    })

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.backdropFx?.destroy()
      this.backdropFx = undefined
    })
  }

  update(time: number, delta: number) {
    this.backdropFx?.update(time, delta)

    const dt = delta / 1000
    const t = time / 1000
    this.bubbles.forEach((bubble, index) => {
      const sway = Math.sin(t * 0.6 + index) * 10
      bubble.sprite.y -= bubble.speed * dt
      bubble.sprite.x += (bubble.drift + sway) * dt
      bubble.sprite.rotation = Math.sin(t * 0.9 + index) * 0.08
      bubble.spec.setPosition(bubble.sprite.x - bubble.sprite.scaleX * 18, bubble.sprite.y - bubble.sprite.scaleY * 22)
      bubble.spec.setRotation(bubble.sprite.rotation)

      if (bubble.sprite.y < -80) {
        bubble.sprite.y = this.scale.height + 80
      }
      if (bubble.sprite.x < -80) {
        bubble.sprite.x = this.scale.width + 80
      }
      if (bubble.sprite.x > this.scale.width + 80) {
        bubble.sprite.x = -80
      }
    })

    const pointer = this.input.activePointer
    const dx = Phaser.Math.Clamp((pointer.x - this.scale.width / 2) / (this.scale.width / 2), -1, 1)
    const dy = Phaser.Math.Clamp((pointer.y - this.scale.height / 2) / (this.scale.height / 2), -1, 1)

    if (this.heroBubble && this.heroSpec) {
      this.heroBubble.setPosition(this.scale.width / 2 + dx * 18, this.heroBaseY + dy * 12)
      this.heroBubble.setRotation(Math.sin(t * 0.22) * 0.08)
      this.heroSpec.setPosition(this.heroBubble.x - 28 + dx * 6, this.heroBubble.y - 34 + dy * 5)
      this.heroSpec.setRotation(this.heroBubble.rotation)
    }

    if (this.title) {
      this.title.setPosition(this.scale.width / 2 + dx * 10, this.titleBaseY + dy * 6)
    }
  }

  private updateCardHighlights(cards: Phaser.GameObjects.Container[]) {
    cards.forEach((card) => {
      const id = card.getData('entry') as DifficultyId
      const isActive = id === this.difficultyId

      const border = card.getData('border') as Phaser.GameObjects.Graphics
      const inner = card.getData('inner') as Phaser.GameObjects.Graphics
      const halo = card.getData('halo') as Phaser.GameObjects.Image
      const width = card.width || 176
      const height = card.height || 84
      const radius = 22

      border.clear()
      border.lineStyle(2, 0xffffff, isActive ? 0.26 : 0.12)
      border.strokeRoundedRect(-width / 2, -height / 2, width, height, radius)

      inner.clear()
      inner.lineStyle(1, halo.tintTopLeft, isActive ? 0.46 : 0.16)
      inner.strokeRoundedRect(
        -width / 2 + 4,
        -height / 2 + 4,
        width - 8,
        height - 8,
        Math.max(0, radius - 4)
      )

      halo.setAlpha(isActive ? 0.55 : 0)
      this.tweens.add({
        targets: card,
        scale: isActive ? 1.065 : 1,
        duration: 180,
        ease: 'Sine.easeOut'
      })

      if (isActive) {
        this.tweens.killTweensOf(halo)
        this.tweens.add({
          targets: halo,
          scaleX: { from: halo.scaleX, to: halo.scaleX * 1.07 },
          scaleY: { from: halo.scaleY, to: halo.scaleY * 1.07 },
          alpha: { from: 0.5, to: 0.65 },
          duration: 820,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        })
      } else {
        this.tweens.killTweensOf(halo)
        halo.setScale((width / 256) * 1.55)
      }
    })
  }

  private createBackgroundBubbles() {
    this.bubbles = []
    for (let i = 0; i < 18; i += 1) {
      const sprite = this.add.sprite(
        Phaser.Math.Between(0, this.scale.width),
        Phaser.Math.Between(0, this.scale.height),
        'bubble'
      )
      const scale = Phaser.Math.FloatBetween(0.1, 0.24)
      sprite.setScale(scale)
      sprite.setAlpha(0.18)
      sprite.setDepth(-1)
      sprite.setTint(0xe8fbff)

      const spec = this.add.sprite(sprite.x - 18, sprite.y - 22, 'bubbleSpec')
      spec.setScale(scale)
      spec.setAlpha(0.06)
      spec.setDepth(-0.8)
      spec.setBlendMode(Phaser.BlendModes.SCREEN)
      this.bubbles.push({
        sprite,
        spec,
        speed: Phaser.Math.FloatBetween(12, 30),
        drift: Phaser.Math.FloatBetween(-8, 8)
      })
    }
  }

  private createHeroBubble(uiScale: number) {
    this.heroBubble?.destroy()
    this.heroSpec?.destroy()
    const scale = Phaser.Math.Clamp(1.9 * uiScale, 1.35, 2.4)
    const ox = 28 * uiScale
    const oy = 34 * uiScale
    this.heroBubble = this.add
      .sprite(this.scale.width / 2, this.heroBaseY, 'bubble')
      .setScale(scale)
      .setAlpha(0.12)
      .setDepth(0)
      .setTint(0xffffff)

    this.heroSpec = this.add
      .sprite(this.heroBubble.x - ox, this.heroBubble.y - oy, 'bubbleSpec')
      .setScale(scale)
      .setAlpha(0.12)
      .setDepth(0.2)
      .setBlendMode(Phaser.BlendModes.SCREEN)
  }
}
