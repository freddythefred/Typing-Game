import Phaser from 'phaser'
import { createButton } from '../ui/components/UiButton'
import { createGlassPanel } from '../ui/components/GlassPanel'
import { createUnderwaterBackground, type UnderwaterBackground } from '../ui/fx/UnderwaterBackground'
import {
  addProfile,
  deleteProfile,
  ensureDefaultProfile,
  getActiveProfileId,
  loadProfiles,
  MAX_PROFILES,
  renameProfile,
  setActiveProfileId
} from '../systems/ProfileStore'
import { deleteProfileScores, migrateLegacyScoresToProfile } from '../systems/BestScoreStore'

export class ProfileSelectScene extends Phaser.Scene {
  private backdropFx?: UnderwaterBackground
  private selectedId?: string
  private cards: Phaser.GameObjects.Container[] = []

  constructor() {
    super('ProfileSelect')
  }

  create() {
    ensureDefaultProfile()

    const uiScale = Phaser.Math.Clamp(Math.min(this.scale.width / 1280, this.scale.height / 720), 0.82, 1.15)
    const centerX = this.scale.width / 2
    const centerY = this.scale.height / 2

    this.cameras.main.fadeIn(520, 4, 10, 18)
    this.backdropFx?.destroy()
    this.backdropFx = createUnderwaterBackground(this, {
      depth: -12,
      withDust: true,
      withPointerLight: true,
      withShafts: false,
      accent: 0xffcf66
    })

    const panelWidth = Math.min(Math.round(860 * uiScale), this.scale.width - 60)
    const panelHeight = Math.round(460 * uiScale)
    const panelY = Math.round(centerY - 10 * uiScale)
    createGlassPanel(this, centerX, panelY, panelWidth, panelHeight, {
      depth: 6,
      radius: Math.round(30 * uiScale),
      accent: 0xffcf66,
      float: true
    })

    this.add
      .text(centerX, Math.round(120 * uiScale), 'Choose Profile', {
        fontFamily: 'BubbleDisplay',
        fontSize: `${Math.round(52 * uiScale)}px`,
        color: '#eaf6ff'
      })
      .setOrigin(0.5)
      .setDepth(10)
      .setStroke('rgba(255,207,102,0.2)', 8)
      .setShadow(0, 12, 'rgba(0,0,0,0.35)', 22, true, true)

    const profiles = loadProfiles()
    this.selectedId = getActiveProfileId() ?? profiles[0]?.id

    const panelTopY = panelY - panelHeight / 2
    const panelBottomY = panelY + panelHeight / 2
    const listPadY = Math.round(72 * uiScale)
    const listAreaTopY = panelTopY + listPadY
    const listAreaBottomY = panelBottomY - listPadY
    const listHeight = Math.max(0, listAreaBottomY - listAreaTopY)
    const listCenterY = listAreaTopY + listHeight / 2
    const maxCardsAreaWidth = Math.min(panelWidth - Math.round(140 * uiScale), Math.round(720 * uiScale))

    const render = () => {
      this.cards.forEach((c) => c.destroy())
      this.cards = []

      const nextProfiles = loadProfiles()
      if (!this.selectedId || !nextProfiles.some((p) => p.id === this.selectedId)) {
        this.selectedId = nextProfiles[0]?.id
      }

      const setButtonRestStyle = (button: Phaser.GameObjects.Container, selected: boolean) => {
        const width = (button.getData('buttonWidth') as number | undefined) ?? 220
        const height = (button.getData('buttonHeight') as number | undefined) ?? 56
        const radius = (button.getData('buttonRadius') as number | undefined) ?? 18
        const accent = (button.getData('buttonAccent') as number | undefined) ?? 0x66e3ff

        const border = button.getData('border') as Phaser.GameObjects.Graphics | undefined
        const inner = button.getData('inner') as Phaser.GameObjects.Graphics | undefined
        const glow = button.getData('glow') as Phaser.GameObjects.Image | undefined

        const borderAlpha = selected ? 0.26 : 0.12
        const innerAlpha = selected ? 0.42 : 0.16
        const glowAlpha = selected ? 0.12 : 0
        const restScale = selected ? 1.03 : 1

        if (border) {
          border.clear()
          border.lineStyle(2, 0xffffff, borderAlpha)
          border.strokeRoundedRect(-width / 2, -height / 2, width, height, radius)
        }

        if (inner) {
          inner.clear()
          inner.lineStyle(1, accent, innerAlpha)
          inner.strokeRoundedRect(
            -width / 2 + 4,
            -height / 2 + 4,
            width - 8,
            height - 8,
            Math.max(0, radius - 4)
          )
        }

        this.tweens.killTweensOf(button)
        this.tweens.add({ targets: button, scale: restScale, duration: 140, ease: 'Sine.easeOut' })

        if (glow) {
          this.tweens.killTweensOf(glow)
          this.tweens.add({ targets: glow, alpha: glowAlpha, duration: 160, ease: 'Sine.easeOut' })
        }
      }

      const columns = nextProfiles.length > 6 ? 2 : 1
      const rows = Math.max(1, Math.ceil(nextProfiles.length / columns))
      const spacingX = Math.round(18 * uiScale)
      let spacingY = Math.round(14 * uiScale)
      const cardWidth = Math.floor((maxCardsAreaWidth - spacingX * (columns - 1)) / columns)
      let cardHeight = Math.round(52 * uiScale)

      const requiredHeight = rows * cardHeight + (rows - 1) * spacingY
      if (listHeight > 0 && requiredHeight > listHeight) {
        const scale = listHeight / requiredHeight
        cardHeight = Math.max(Math.round(34 * uiScale), Math.floor(cardHeight * scale))
        spacingY = Math.max(Math.round(8 * uiScale), Math.floor(spacingY * scale))
      }

      const totalWidth = cardWidth * columns + spacingX * (columns - 1)
      const startX = centerX - totalWidth / 2 + cardWidth / 2
      const span = (rows - 1) * (cardHeight + spacingY)
      const idealStartY = listCenterY - span / 2
      const minStartY = listAreaTopY + cardHeight / 2
      const maxStartY = listAreaBottomY - cardHeight / 2 - span
      const startY = Phaser.Math.Clamp(idealStartY, minStartY, Math.max(minStartY, maxStartY))

      nextProfiles.slice(0, 12).forEach((profile, index) => {
        const col = index % columns
        const row = Math.floor(index / columns)
        const x = startX + col * (cardWidth + spacingX)
        const y = startY + row * (cardHeight + spacingY)

        const selected = profile.id === this.selectedId
        const accent = selected ? 0xffcf66 : 0x66e3ff
        const card = createButton(this, x, y, profile.name, () => {
          this.selectedId = profile.id
          render()
        }, { width: cardWidth, height: cardHeight, depth: 10, accent })

        setButtonRestStyle(card, selected)
        card.on('pointerout', () => {
          const isSelectedNow = profile.id === this.selectedId
          setButtonRestStyle(card, isSelectedNow)
        })

        this.cards.push(card)
      })
    }

    render()

    let transitioning = false
    const buttonWidth = Math.min(Math.round(240 * uiScale), this.scale.width - 80)
    const buttonHeight = Math.round(56 * uiScale)

    const buttonsDownY = Math.round(57 * uiScale)
    const bottomMargin = Math.round(24 * uiScale)
    const desiredBottomRowY = this.scale.height - Math.round(110 * uiScale) + buttonsDownY
    const bottomRowY = Math.min(desiredBottomRowY, this.scale.height - buttonHeight / 2 - bottomMargin)
    const midRowY = bottomRowY - Math.round(72 * uiScale)
    const leftX = centerX - Math.round(170 * uiScale)
    const rightX = centerX + Math.round(170 * uiScale)

    let addButton: Phaser.GameObjects.Container | undefined
    let continueButton: Phaser.GameObjects.Container | undefined
    let renameButton: Phaser.GameObjects.Container | undefined
    let deleteButton: Phaser.GameObjects.Container | undefined

    addButton = createButton(this, rightX, midRowY, 'Add Profile', () => {
      if (transitioning) return
      if (loadProfiles().length >= MAX_PROFILES) {
        window.alert(`Maximum ${MAX_PROFILES} profiles.`)
        return
      }
      const name = window.prompt('Profile name?')
      if (!name) return
      const created = addProfile(name)
      if (!created) return
      this.selectedId = created.id
      render()
    }, { width: buttonWidth, height: buttonHeight, depth: 10, accent: 0xffcf66 })

    continueButton = createButton(this, rightX, bottomRowY, 'Continue', () => {
      if (transitioning) return
      if (!this.selectedId) return
      transitioning = true
      addButton?.disableInteractive()
      continueButton?.disableInteractive()
      renameButton?.disableInteractive()
      deleteButton?.disableInteractive()

      setActiveProfileId(this.selectedId)
      migrateLegacyScoresToProfile(this.selectedId)

      let started = false
      const go = () => {
        if (started) return
        started = true
        this.scene.start('Menu')
      }

      this.cameras.main.fadeOut(240, 4, 10, 18)
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, go)
      this.time.delayedCall(280, go)
    }, { width: buttonWidth, height: buttonHeight, depth: 10, accent: 0x66e3ff })

    renameButton = createButton(this, leftX, midRowY, 'Rename', () => {
      if (transitioning) return
      if (!this.selectedId) return
      const current = loadProfiles().find((p) => p.id === this.selectedId)
      const nextName = window.prompt('New profile name?', current?.name ?? '')
      if (!nextName) return
      const updated = renameProfile(this.selectedId, nextName)
      if (!updated) return
      render()
    }, { width: buttonWidth, height: buttonHeight, depth: 10, accent: 0xffcf66 })

    deleteButton = createButton(this, leftX, bottomRowY, 'Delete', () => {
      if (transitioning) return
      if (!this.selectedId) return

      const profilesNow = loadProfiles()
      if (profilesNow.length <= 1) return

      const target = profilesNow.find((p) => p.id === this.selectedId)
      const ok = window.confirm(`Delete profile "${target?.name ?? 'Profile'}"?`)
      if (!ok) return

      const deletedId = this.selectedId
      const deleted = deleteProfile(deletedId)
      if (!deleted) return
      deleteProfileScores(deletedId)

      const after = loadProfiles()
      this.selectedId = getActiveProfileId() ?? after[0]?.id
      render()
    }, { width: buttonWidth, height: buttonHeight, depth: 10, accent: 0xff5a7a })

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.backdropFx?.destroy()
      this.backdropFx = undefined
    })
  }

  update(time: number, delta: number) {
    this.backdropFx?.update(time, delta)
  }
}
