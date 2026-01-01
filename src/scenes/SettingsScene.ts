import Phaser from 'phaser'
import { createButton, setButtonLabel } from '../ui/components/UiButton'
import { createGlassPanel } from '../ui/components/GlassPanel'
import { loadSettings, saveSettings, type Settings } from '../systems/SettingsStore'
import { createUnderwaterBackground, type UnderwaterBackground } from '../ui/fx/UnderwaterBackground'
import type { LanguageId } from '../data/wordBank'
import { formatInt, t } from '../i18n/i18n'

const LANGUAGE_DISPLAY_NAMES: Record<LanguageId, string> = {
  en: 'English',
  fr: 'Français',
  es: 'Español',
  it: 'Italiano',
  de: 'Deutsch',
  ru: 'Русский',
  ar: 'العربية'
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

const LANGUAGE_ORDER: LanguageId[] = ['en', 'fr', 'es', 'it', 'de', 'ru', 'ar']

type LanguageDropdownState = {
  backdrop: Phaser.GameObjects.Rectangle
  panel: Phaser.GameObjects.Container
  items: Phaser.GameObjects.Container[]
}

export class SettingsScene extends Phaser.Scene {
  private settings!: Settings
  private uiScale = 1
  private titleText!: Phaser.GameObjects.Text
  private languageRow!: Phaser.GameObjects.Container
  private languageFlag!: Phaser.GameObjects.Image
  private languageText!: Phaser.GameObjects.Text
  private volumeText!: Phaser.GameObjects.Text
  private backdropFx?: UnderwaterBackground
  private languageDropdown?: LanguageDropdownState
  private languageButton?: Phaser.GameObjects.Container
  private volumeDownButton?: Phaser.GameObjects.Container
  private volumeUpButton?: Phaser.GameObjects.Container
  private backButton?: Phaser.GameObjects.Container
  private returnToScene?: string
  private languageOnlyMode = false
  private leaving = false

  constructor() {
    super('Settings')
  }

  create(data?: { openLanguageDropdown?: boolean; languageOnly?: boolean; returnToScene?: string }) {
    this.settings = loadSettings()
    this.returnToScene = data?.returnToScene
    this.languageOnlyMode = Boolean(data?.languageOnly)
    this.leaving = false
    const uiScale = Phaser.Math.Clamp(Math.min(this.scale.width / 1280, this.scale.height / 720), 0.82, 1.15)
    this.uiScale = uiScale
    const centerX = Math.round(this.scale.width / 2)
    this.cameras.main.fadeIn(520, 4, 10, 18)

    this.backdropFx?.destroy()
    this.backdropFx = createUnderwaterBackground(this, {
      depth: -12,
      withDust: true,
      withPointerLight: true,
      withShafts: false,
      accent: 0xffcf66
    })

    const panelWidth = Math.min(Math.round(720 * uiScale), this.scale.width - 60)
    const panelHeight = Math.round(360 * uiScale)
    createGlassPanel(this, centerX, Math.round(260 * uiScale), panelWidth, panelHeight, {
      depth: 6,
      radius: Math.round(28 * uiScale),
      accent: 0xffcf66,
      float: true
    })

    const buttonWidth = Math.min(Math.round(170 * uiScale), this.scale.width - 80)
    const buttonHeight = Math.round(50 * uiScale)
    const buttonOffsetX = Math.min(Math.round(210 * uiScale), Math.round(panelWidth * 0.36))

    const textGap = Math.round(16 * uiScale)
    const volumeValueWidth = Math.max(0, Math.floor(2 * buttonOffsetX - buttonWidth - textGap))
    const languageY = Math.round(204 * uiScale)
    const volumeY = Math.round(268 * uiScale)

    this.titleText = this.add
      .text(centerX, Math.round(120 * uiScale), t(this.settings.language, 'settings.title'), {
        fontFamily: 'BubbleDisplay',
        fontSize: `${Math.round(52 * uiScale)}px`,
        color: '#eaf6ff'
      })
      .setOrigin(0.5)
      .setDepth(10)
      .setStroke('rgba(255,207,102,0.2)', 8)
      .setShadow(0, 12, 'rgba(0,0,0,0.35)', 22, true, true)

    this.languageRow = this.add.container(centerX, languageY).setDepth(10)
    this.languageFlag = this.add.image(0, 0, LANGUAGE_FLAG_TEXTURE_KEYS[this.settings.language]).setOrigin(0.5)
    this.languageText = this.add
      .text(0, 0, '', {
        fontFamily: 'BubbleDisplay',
        fontSize: `${Math.round(22 * uiScale)}px`,
        color: '#eaf6ff'
      })
      .setOrigin(0, 0.5)
      .setShadow(0, 6, 'rgba(0,0,0,0.28)', 12, false, true)

    this.languageRow.add([this.languageFlag, this.languageText])
    this.languageRow.setSize(Math.round(360 * uiScale), Math.round(70 * uiScale))
    this.languageRow.setInteractive({ useHandCursor: true })

    this.languageRow.on('pointerover', () => {
      this.tweens.add({ targets: this.languageRow, scale: 1.03, duration: 140, ease: 'Sine.easeOut' })
    })
    this.languageRow.on('pointerout', () => {
      this.tweens.add({ targets: this.languageRow, scale: 1, duration: 180, ease: 'Sine.easeOut' })
    })

    this.applyFlagSizingAndCrop()

    this.volumeText = this.add
      .text(centerX, volumeY, '', {
        fontFamily: 'BubbleDisplay',
        fontSize: `${Math.round(22 * uiScale)}px`,
        color: '#eaf6ff',
        align: 'center',
        ...(volumeValueWidth > 0 ? { fixedWidth: volumeValueWidth } : {})
      })
      .setOrigin(0.5, 0.5)
      .setDepth(10)
      .setShadow(0, 6, 'rgba(0,0,0,0.28)', 12, false, true)

    this.languageButton = createButton(
      this,
      centerX - buttonOffsetX,
      languageY,
      t(this.settings.language, 'settings.language'),
      () => this.toggleLanguageDropdown(centerX, languageY, Math.round(360 * uiScale)),
      { width: buttonWidth, height: buttonHeight, depth: 9, accent: 0xffcf66 }
    )

    this.languageRow.on('pointerup', () => {
      this.toggleLanguageDropdown(centerX, languageY, Math.round(360 * uiScale))
    })

    this.volumeDownButton = createButton(
      this,
      centerX - buttonOffsetX,
      volumeY,
      t(this.settings.language, 'settings.volumeDown'),
      () => {
        this.settings.volume = Math.max(0, Math.round((this.settings.volume - 0.1) * 10) / 10)
        this.refresh()
        this.pulse(this.volumeText)
      },
      { width: buttonWidth, height: buttonHeight, depth: 9, accent: 0xffcf66 }
    )

    this.volumeUpButton = createButton(
      this,
      centerX + buttonOffsetX,
      volumeY,
      t(this.settings.language, 'settings.volumeUp'),
      () => {
        this.settings.volume = Math.min(1, Math.round((this.settings.volume + 0.1) * 10) / 10)
        this.refresh()
        this.pulse(this.volumeText)
      },
      { width: buttonWidth, height: buttonHeight, depth: 9, accent: 0xffcf66 }
    )

    this.backButton = createButton(
      this,
      centerX,
      this.scale.height - Math.round(90 * uiScale),
      t(this.settings.language, 'common.back'),
      () => {
        this.closeLanguageDropdown({ returnIfLanguageOnly: false })
        this.startReturnTo('Menu')
      },
      {
        width: Math.min(Math.round(260 * uiScale), this.scale.width - 80),
        height: Math.round(58 * uiScale),
        depth: 10,
        accent: 0x66e3ff
      }
    )

    const vignette = this.add
      .image(centerX, this.scale.height / 2, 'vignette')
      .setBlendMode(Phaser.BlendModes.MULTIPLY)
      .setAlpha(0.14)
      .setDepth(90)
    vignette.setScale(Math.max(this.scale.width, this.scale.height) / 512)

    this.refresh()
    if (data?.openLanguageDropdown) {
      this.toggleLanguageDropdown(centerX, languageY, Math.round(360 * uiScale))
    }

    this.scale.on('resize', () => this.scene.restart())
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.closeLanguageDropdown()
      this.backdropFx?.destroy()
      this.backdropFx = undefined
    })
  }

  update(time: number, delta: number) {
    this.backdropFx?.update(time, delta)
  }

  private refresh() {
    saveSettings(this.settings)
    const language = this.settings.language
    this.titleText.setText(t(language, 'settings.title'))
    this.languageText.setText(LANGUAGE_DISPLAY_NAMES[language])
    this.languageFlag.setTexture(LANGUAGE_FLAG_TEXTURE_KEYS[language])
    this.applyFlagSizingAndCrop()
    this.layoutLanguageRow()
    this.volumeText.setText(`${formatInt(language, Math.round(this.settings.volume * 100))}%`)
    if (this.languageButton) setButtonLabel(this.languageButton, t(language, 'settings.language'))
    if (this.volumeDownButton) setButtonLabel(this.volumeDownButton, t(language, 'settings.volumeDown'))
    if (this.volumeUpButton) setButtonLabel(this.volumeUpButton, t(language, 'settings.volumeUp'))
    if (this.backButton) setButtonLabel(this.backButton, t(language, 'common.back'))
  }

  private applyFlagSizingAndCrop() {
    this.applyFlagSizingAndCropFor(this.languageFlag, Math.round(48 * this.uiScale))
  }

  private applyFlagSizingAndCropFor(flag: Phaser.GameObjects.Image, targetHeight: number) {
    const targetWidth = Math.round(targetHeight * 1.5)
    const safeHeight = Math.max(1, flag.height)
    const scale = targetHeight / safeHeight

    flag.setScale(scale)

    const cropWidth = Math.min(flag.width, Math.round(targetWidth / scale))
    const cropX = Math.max(0, Math.floor((flag.width - cropWidth) / 2))
    flag.setCrop(cropX, 0, cropWidth, flag.height)
    flag.setData('visibleWidth', targetWidth)
    flag.setData('visibleHeight', targetHeight)
  }

  private layoutLanguageRow() {
    const gap = Math.round(12 * this.uiScale)
    const flagWidth = (this.languageFlag.getData('visibleWidth') as number | undefined) ?? this.languageFlag.displayWidth
    const textWidth = this.languageText.width
    const totalWidth = flagWidth + gap + textWidth

    this.languageFlag.x = Math.round(-totalWidth / 2 + flagWidth / 2)
    this.languageText.x = Math.round(this.languageFlag.x + flagWidth / 2 + gap)
  }

  private pulse(target: Phaser.GameObjects.GameObject) {
    this.tweens.add({
      targets: target,
      scale: 1.05,
      duration: 120,
      yoyo: true,
      ease: 'Sine.easeOut'
    })
  }

  private toggleLanguageDropdown(anchorX: number, anchorY: number, width: number) {
    if (this.languageDropdown) {
      this.closeLanguageDropdown({ returnIfLanguageOnly: true })
      return
    }

    const uiScale = this.uiScale
    const itemHeight = Math.round(56 * uiScale)
    const pad = Math.round(10 * uiScale)
    const outerPadding = Math.round(10 * uiScale)
    const panelWidth = Math.min(Math.max(width, Math.round(320 * uiScale)), this.scale.width - 40)
    const panelHeight = outerPadding * 2 + LANGUAGE_ORDER.length * itemHeight
    const panelRadius = Math.round(18 * uiScale)

    const preferBelowTop = anchorY + Math.round(40 * uiScale)
    const preferAboveTop = anchorY - Math.round(40 * uiScale) - panelHeight
    const topY =
      preferBelowTop + panelHeight < this.scale.height - 24 ? preferBelowTop : Math.max(24, preferAboveTop)
    const panelY = Math.round(topY + panelHeight / 2)

    const backdrop = this.add
      .rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, 0x061420, 0.98)
      .setDepth(44)
      .setInteractive()

    backdrop.on(
      'pointerdown',
      (
        _pointer: Phaser.Input.Pointer,
        _localX: number,
        _localY: number,
        event: Phaser.Types.Input.EventData
      ) => {
        event.stopPropagation()
      }
    )

    backdrop.on(
      'pointerup',
      (
        _pointer: Phaser.Input.Pointer,
        _localX: number,
        _localY: number,
        event: Phaser.Types.Input.EventData
      ) => {
        event.stopPropagation()
        this.closeLanguageDropdown({ returnIfLanguageOnly: true })
      }
    )

    const panel = createGlassPanel(this, anchorX, panelY, panelWidth, panelHeight, {
      depth: 45,
      radius: panelRadius,
      accent: 0xffcf66,
      float: false
    })

    const setItemBorder = (container: Phaser.GameObjects.Container, alpha: number) => {
      const border = container.getData('border') as Phaser.GameObjects.Graphics
      const w = container.getData('w') as number
      const h = container.getData('h') as number
      const r = container.getData('r') as number
      border.clear()
      border.lineStyle(2, 0xffffff, alpha)
      border.strokeRoundedRect(-w / 2, -h / 2, w, h, r)
    }

    const setItemInner = (container: Phaser.GameObjects.Container, alpha: number) => {
      const inner = container.getData('inner') as Phaser.GameObjects.Graphics
      const w = container.getData('w') as number
      const h = container.getData('h') as number
      const r = container.getData('r') as number
      inner.clear()
      inner.lineStyle(1, 0xffcf66, alpha)
      inner.strokeRoundedRect(-w / 2 + 4, -h / 2 + 4, w - 8, h - 8, Math.max(0, r - 4))
    }

    const items: Phaser.GameObjects.Container[] = []

    LANGUAGE_ORDER.forEach((language, index) => {
      const itemWidth = panelWidth - outerPadding * 2
      const itemX = anchorX
      const itemY = Math.round(topY + outerPadding + itemHeight / 2 + index * itemHeight)
      const item = createGlassPanel(this, itemX, itemY, itemWidth, itemHeight - 6, {
        depth: 46,
        radius: Math.round(16 * uiScale),
        accent: 0xffcf66,
        float: false
      })

      item.setSize(itemWidth, itemHeight - 6)
      item.setInteractive({ useHandCursor: true })
      item.setData('w', itemWidth)
      item.setData('h', itemHeight - 6)
      item.setData('r', Math.round(16 * uiScale))
      item.setData('language', language)

      const isSelected = this.settings.language === language
      setItemBorder(item, isSelected ? 0.26 : 0.12)
      setItemInner(item, isSelected ? 0.34 : 0.16)

      const flag = this.add.image(0, 0, LANGUAGE_FLAG_TEXTURE_KEYS[language]).setOrigin(0.5)
      const flagTargetH = Math.round(34 * uiScale)
      const flagTargetW = Math.round(flagTargetH * 1.5)
      this.applyFlagSizingAndCropFor(flag, flagTargetH)
      flag.x = -itemWidth / 2 + pad + flagTargetW / 2

      const label = this.add.text(0, 0, LANGUAGE_DISPLAY_NAMES[language], {
        fontFamily: 'BubbleDisplay',
        fontSize: `${Math.round(22 * uiScale)}px`,
        color: '#eaf6ff'
      })
      label.setOrigin(0, 0.5)
      label.setShadow(0, 6, 'rgba(0,0,0,0.28)', 12, false, true)
      label.x = Math.round(flag.x + flagTargetW / 2 + Math.round(12 * uiScale))

      item.add([flag, label])

      item.on('pointerover', () => {
        this.tweens.add({ targets: item, scale: 1.015, duration: 140, ease: 'Sine.easeOut' })
        setItemBorder(item, 0.24)
        setItemInner(item, 0.32)
      })
      item.on('pointerout', () => {
        this.tweens.add({ targets: item, scale: 1, duration: 180, ease: 'Sine.easeOut' })
        const selectedNow = this.settings.language === language
        setItemBorder(item, selectedNow ? 0.26 : 0.12)
        setItemInner(item, selectedNow ? 0.34 : 0.16)
      })
      item.on('pointerup', () => {
        this.settings.language = language
        this.refresh()
        this.pulse(this.languageRow)
        this.closeLanguageDropdown({ returnIfLanguageOnly: true })
      })

      items.push(item)
    })

    this.languageDropdown = { backdrop, panel, items }
  }

  private closeLanguageDropdown(options?: { returnIfLanguageOnly?: boolean }) {
    const dropdown = this.languageDropdown
    if (!dropdown) return
    dropdown.items.forEach((item) => item.destroy(true))
    dropdown.panel.destroy(true)
    dropdown.backdrop.destroy()
    this.languageDropdown = undefined

    if (options?.returnIfLanguageOnly && this.languageOnlyMode && this.returnToScene) {
      this.startReturnTo(this.returnToScene)
    }
  }

  private startReturnTo(sceneKey: string) {
    if (this.leaving) return
    this.leaving = true

    this.backButton?.disableInteractive()
    this.languageRow?.disableInteractive()
    this.languageButton?.disableInteractive()
    this.volumeDownButton?.disableInteractive()
    this.volumeUpButton?.disableInteractive()

    saveSettings(this.settings)
    this.cameras.main.fadeOut(240, 4, 10, 18)
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(sceneKey)
    })
  }
}
