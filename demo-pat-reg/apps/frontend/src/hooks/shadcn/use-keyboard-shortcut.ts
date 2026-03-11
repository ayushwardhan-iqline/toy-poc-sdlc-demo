import * as React from "react"

type KeyboardModifier = "ctrl" | "alt" | "shift" | "meta"

interface UseKeyboardShortcutOptions {
  key: string
  modifiers?: KeyboardModifier[]
  callback: (event: KeyboardEvent) => void
  preventDefault?: boolean
  enabled?: boolean
}

export function useKeyboardShortcut({
  key,
  modifiers = [],
  callback,
  preventDefault = true,
  enabled = true,
}: UseKeyboardShortcutOptions): void {
  const callbackRef = React.useRef(callback)

  React.useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  React.useEffect(() => {
    if (!enabled) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const keyMatches = event.key.toLowerCase() === key.toLowerCase()
      if (!keyMatches) {
        return
      }

      const ctrlRequired = modifiers.includes("ctrl")
      const altRequired = modifiers.includes("alt")
      const shiftRequired = modifiers.includes("shift")
      const metaRequired = modifiers.includes("meta")

      const ctrlPressed = event.ctrlKey || event.metaKey
      const altPressed = event.altKey
      const shiftPressed = event.shiftKey
      const metaPressed = event.metaKey

      const ctrlMatches = ctrlRequired ? ctrlPressed : !event.ctrlKey
      const altMatches = altRequired ? altPressed : !altPressed
      const shiftMatches = shiftRequired ? shiftPressed : !shiftPressed
      const metaMatches = metaRequired ? metaPressed : true

      if (ctrlMatches && altMatches && shiftMatches && metaMatches) {
        if (preventDefault) {
          event.preventDefault()
        }
        callbackRef.current(event)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [enabled, key, modifiers, preventDefault])
}

export function useIsMac(): boolean {
  const [isMac, setIsMac] = React.useState(false)

  React.useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().includes("MAC"))
  }, [])

  return isMac
}

export function useModifierKey(): string {
  const isMac = useIsMac()
  return isMac ? "Cmd" : "Ctrl"
}
