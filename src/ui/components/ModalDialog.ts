import Phaser from 'phaser'
import { createButton } from './UiButton'
import { createGlassPanel } from './GlassPanel'

type BaseDialogOptions = {
  depth?: number
  accent?: number
  title?: string
  message?: string
}

type AlertOptions = BaseDialogOptions & {
  okLabel: string
}

type ConfirmOptions = BaseDialogOptions & {
  confirmLabel: string
  cancelLabel: string
}

type PromptOptions = BaseDialogOptions & {
  confirmLabel: string
  cancelLabel: string
  initialValue?: string
  placeholder?: string
  maxLength?: number
  normalize?: (value: string) => string
  validate?: (value: string) => string | null
}

function getUiScale(scene: Phaser.Scene) {
  return Phaser.Math.Clamp(Math.min(scene.scale.width / 1280, scene.scale.height / 720), 0.82, 1.15)
}

function destroySafe(obj?: Phaser.GameObjects.GameObject) {
  try {
    obj?.destroy()
  } catch {
    // ignore
  }
}

function createModalRoot(scene: Phaser.Scene, depth: number) {
  const root = scene.add.container(0, 0).setDepth(depth)
  root.setData('isModalDialog', true)
  root.setPosition(Math.round(scene.scale.width / 2), Math.round(scene.scale.height / 2))

  const backdrop = scene.add
    .rectangle(0, 0, scene.scale.width, scene.scale.height, 0x061420, 0.98)
    .setOrigin(0.5)
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
    }
  )
  root.add(backdrop)

  const resize = () => {
    backdrop.setSize(scene.scale.width, scene.scale.height)
    root.setPosition(Math.round(scene.scale.width / 2), Math.round(scene.scale.height / 2))
  }
  scene.scale.on('resize', resize)
  root.setData('resize', resize)

  const cleanup = () => {
    scene.scale.off('resize', resize)
  }
  root.setData('cleanup', cleanup)

  return { root, backdrop }
}

export function showAlertDialog(scene: Phaser.Scene, options: AlertOptions): Promise<void> {
  const depth = options.depth ?? 1000
  const accent = options.accent ?? 0xffcf66
  const uiScale = getUiScale(scene)

  const { root } = createModalRoot(scene, depth)
  const panelWidth = Math.min(Math.round(700 * uiScale), scene.scale.width - 60)
  const panelHeight = Math.round(320 * uiScale)
  const panel = createGlassPanel(scene, 0, -Math.round(20 * uiScale), panelWidth, panelHeight, {
    depth,
    radius: Math.round(26 * uiScale),
    accent,
    float: false
  })
  root.add(panel)

  const titleText = scene.add
    .text(0, -panelHeight / 2 + Math.round(52 * uiScale), options.title ?? '', {
      fontFamily: 'BubbleDisplay',
      fontSize: `${Math.round(34 * uiScale)}px`,
      color: '#eaf6ff',
      align: 'center',
      wordWrap: { width: panelWidth - Math.round(60 * uiScale) }
    })
    .setOrigin(0.5)
  root.add(titleText)

  const messageText = scene.add
    .text(0, -Math.round(18 * uiScale), options.message ?? '', {
      fontFamily: 'BubbleDisplay',
      fontSize: `${Math.round(20 * uiScale)}px`,
      color: 'rgba(234,246,255,0.85)',
      align: 'center',
      wordWrap: { width: panelWidth - Math.round(80 * uiScale) }
    })
    .setOrigin(0.5)
  messageText.setShadow(0, 6, 'rgba(0,0,0,0.28)', 12, false, true)
  root.add(messageText)

  return new Promise((resolve) => {
    let done = false

    const close = () => {
      if (done) return
      done = true
      const cleanup = root.getData('cleanup') as (() => void) | undefined
      cleanup?.()
      destroySafe(root)
      resolve()
    }

    const okButton = createButton(
      scene,
      0,
      panel.y + panelHeight / 2 - Math.round(60 * uiScale),
      options.okLabel,
      close,
      { width: Math.min(Math.round(320 * uiScale), panelWidth - 60), height: Math.round(58 * uiScale), depth: depth + 1, accent }
    )
    root.add(okButton)

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === 'Escape') close()
    }
    scene.input.keyboard?.on('keydown', onKeyDown)

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, close)
    root.once(Phaser.GameObjects.Events.DESTROY, () => {
      scene.input.keyboard?.off('keydown', onKeyDown)
    })
  })
}

export function showConfirmDialog(scene: Phaser.Scene, options: ConfirmOptions): Promise<boolean> {
  const depth = options.depth ?? 1000
  const accent = options.accent ?? 0xffcf66
  const uiScale = getUiScale(scene)

  const { root } = createModalRoot(scene, depth)
  const panelWidth = Math.min(Math.round(740 * uiScale), scene.scale.width - 60)
  const panelHeight = Math.round(340 * uiScale)
  const panel = createGlassPanel(scene, 0, -Math.round(20 * uiScale), panelWidth, panelHeight, {
    depth,
    radius: Math.round(26 * uiScale),
    accent,
    float: false
  })
  root.add(panel)

  const titleText = scene.add
    .text(0, -panelHeight / 2 + Math.round(52 * uiScale), options.title ?? '', {
      fontFamily: 'BubbleDisplay',
      fontSize: `${Math.round(34 * uiScale)}px`,
      color: '#eaf6ff',
      align: 'center',
      wordWrap: { width: panelWidth - Math.round(60 * uiScale) }
    })
    .setOrigin(0.5)
  root.add(titleText)

  const messageText = scene.add
    .text(0, -Math.round(20 * uiScale), options.message ?? '', {
      fontFamily: 'BubbleDisplay',
      fontSize: `${Math.round(20 * uiScale)}px`,
      color: 'rgba(234,246,255,0.85)',
      align: 'center',
      wordWrap: { width: panelWidth - Math.round(80 * uiScale) }
    })
    .setOrigin(0.5)
  messageText.setShadow(0, 6, 'rgba(0,0,0,0.28)', 12, false, true)
  root.add(messageText)

  return new Promise((resolve) => {
    let done = false

    const finish = (value: boolean) => {
      if (done) return
      done = true
      const cleanup = root.getData('cleanup') as (() => void) | undefined
      cleanup?.()
      destroySafe(root)
      resolve(value)
    }

    const buttonWidth = Math.min(Math.round(300 * uiScale), Math.floor((panelWidth - Math.round(80 * uiScale)) / 2))
    const y = panel.y + panelHeight / 2 - Math.round(60 * uiScale)

    const cancelButton = createButton(scene, -Math.round((buttonWidth + 14 * uiScale) / 2), y, options.cancelLabel, () => finish(false), {
      width: buttonWidth,
      height: Math.round(58 * uiScale),
      depth: depth + 1,
      accent: 0x66e3ff
    })
    const okButton = createButton(scene, Math.round((buttonWidth + 14 * uiScale) / 2), y, options.confirmLabel, () => finish(true), {
      width: buttonWidth,
      height: Math.round(58 * uiScale),
      depth: depth + 1,
      accent
    })
    root.add([cancelButton, okButton])

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') finish(false)
      if (event.key === 'Enter') finish(true)
    }
    scene.input.keyboard?.on('keydown', onKeyDown)

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => finish(false))
    root.once(Phaser.GameObjects.Events.DESTROY, () => {
      scene.input.keyboard?.off('keydown', onKeyDown)
    })
  })
}

export function showPromptDialog(scene: Phaser.Scene, options: PromptOptions): Promise<string | null> {
  const depth = options.depth ?? 1000
  const accent = options.accent ?? 0xffcf66
  const uiScale = getUiScale(scene)
  const maxLength = options.maxLength ?? 24

  const { root } = createModalRoot(scene, depth)
  const panelWidth = Math.min(Math.round(760 * uiScale), scene.scale.width - 60)
  const panelHeight = Math.round(420 * uiScale)
  const panel = createGlassPanel(scene, 0, -Math.round(14 * uiScale), panelWidth, panelHeight, {
    depth,
    radius: Math.round(26 * uiScale),
    accent,
    float: false
  })
  root.add(panel)

  const titleText = scene.add
    .text(0, -panelHeight / 2 + Math.round(52 * uiScale), options.title ?? '', {
      fontFamily: 'BubbleDisplay',
      fontSize: `${Math.round(34 * uiScale)}px`,
      color: '#eaf6ff',
      align: 'center',
      wordWrap: { width: panelWidth - Math.round(60 * uiScale) }
    })
    .setOrigin(0.5)
  root.add(titleText)

  const messageText = scene.add
    .text(0, -Math.round(110 * uiScale), options.message ?? '', {
      fontFamily: 'BubbleDisplay',
      fontSize: `${Math.round(20 * uiScale)}px`,
      color: 'rgba(234,246,255,0.85)',
      align: 'center',
      wordWrap: { width: panelWidth - Math.round(80 * uiScale) }
    })
    .setOrigin(0.5)
  messageText.setShadow(0, 6, 'rgba(0,0,0,0.28)', 12, false, true)
  root.add(messageText)

  const inputWidth = Math.min(Math.round(560 * uiScale), panelWidth - Math.round(80 * uiScale))
  const inputHeight = Math.round(62 * uiScale)
  const inputY = -Math.round(30 * uiScale)
  const inputPanel = createGlassPanel(scene, 0, inputY, inputWidth, inputHeight, {
    depth: depth + 1,
    radius: Math.round(18 * uiScale),
    accent: 0x66e3ff,
    float: false
  })
  root.add(inputPanel)

  const inputText = scene.add
    .text(0, inputY, '', {
      fontFamily: 'BubbleDisplay',
      fontSize: `${Math.round(24 * uiScale)}px`,
      color: '#eaf6ff',
      align: 'center'
    })
    .setOrigin(0.5)
  inputText.setShadow(0, 6, 'rgba(0,0,0,0.28)', 12, false, true)
  root.add(inputText)

  const errorText = scene.add
    .text(0, inputY + Math.round(56 * uiScale), '', {
      fontFamily: 'BubbleDisplay',
      fontSize: `${Math.round(16 * uiScale)}px`,
      color: '#ffb3c1',
      align: 'center',
      wordWrap: { width: panelWidth - Math.round(80 * uiScale) }
    })
    .setOrigin(0.5)
  root.add(errorText)

  let caretOn = true
  const caretTimer = scene.time.addEvent({
    delay: 520,
    loop: true,
    callback: () => {
      caretOn = !caretOn
      render()
    }
  })

  let value = options.initialValue ?? ''

  const normalizeValue = (raw: string) => (options.normalize ? options.normalize(raw) : raw)
  const validateValue = (raw: string) => (options.validate ? options.validate(raw) : null)

  const render = () => {
    const shown = value.length > 0 ? value : options.placeholder ?? ''
    const dim = value.length === 0 && Boolean(options.placeholder)
    inputText.setText(`${shown}${caretOn ? '|' : ' '}`)
    inputText.setAlpha(dim ? 0.55 : 1)
  }
  render()

  return new Promise((resolve) => {
    let done = false

    const finish = (next: string | null) => {
      if (done) return
      done = true
      caretTimer.destroy()
      const cleanup = root.getData('cleanup') as (() => void) | undefined
      cleanup?.()
      destroySafe(root)
      resolve(next)
    }

    const tryAccept = () => {
      const normalized = normalizeValue(value)
      const err = validateValue(normalized)
      if (err) {
        errorText.setText(err)
        return
      }
      finish(normalized)
    }

    const buttonWidth = Math.min(Math.round(300 * uiScale), Math.floor((panelWidth - Math.round(80 * uiScale)) / 2))
    const buttonsY = panel.y + panelHeight / 2 - Math.round(60 * uiScale)

    const cancelButton = createButton(
      scene,
      -Math.round((buttonWidth + 14 * uiScale) / 2),
      buttonsY,
      options.cancelLabel,
      () => finish(null),
      { width: buttonWidth, height: Math.round(58 * uiScale), depth: depth + 2, accent: 0x66e3ff }
    )
    const okButton = createButton(
      scene,
      Math.round((buttonWidth + 14 * uiScale) / 2),
      buttonsY,
      options.confirmLabel,
      tryAccept,
      { width: buttonWidth, height: Math.round(58 * uiScale), depth: depth + 2, accent }
    )
    root.add([cancelButton, okButton])

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        finish(null)
        return
      }
      if (event.key === 'Enter') {
        tryAccept()
        return
      }
      if (event.key === 'Backspace') {
        value = value.slice(0, -1)
        errorText.setText('')
        render()
        return
      }
      if (event.key === 'Delete') {
        value = ''
        errorText.setText('')
        render()
        return
      }
      if (event.ctrlKey || event.metaKey || event.altKey) return
      if (event.key.length !== 1) return
      if (value.length >= maxLength) return
      value += event.key
      errorText.setText('')
      render()
    }

    scene.input.keyboard?.on('keydown', onKeyDown)
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => finish(null))
    root.once(Phaser.GameObjects.Events.DESTROY, () => {
      scene.input.keyboard?.off('keydown', onKeyDown)
    })
  })
}
