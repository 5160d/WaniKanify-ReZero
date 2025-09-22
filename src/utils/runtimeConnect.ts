import { __WK_PORT_SAFE } from '~src/internal/tokens'

type RuntimeLike = typeof chrome.runtime | undefined

type ChromeEvent = chrome.events.Event<(...args: unknown[]) => void>

const createEventStub = (): ChromeEvent => {
  const listeners = new Set<(...args: unknown[]) => void>()
  return {
    addListener: (listener: (...args: unknown[]) => void) => {
      listeners.add(listener)
    },
    removeListener: (listener: (...args: unknown[]) => void) => {
      listeners.delete(listener)
    },
    hasListener: (listener: (...args: unknown[]) => void) => listeners.has(listener),
    hasListeners: () => listeners.size > 0
  } as ChromeEvent
}

const createPortStub = (): chrome.runtime.Port => ({
  name: __WK_PORT_SAFE,
  disconnect: () => {},
  postMessage: () => {},
  onDisconnect: createEventStub(),
  onMessage: createEventStub()
})

const isContextInvalidatedError = (error: unknown): boolean =>
  error instanceof Error && error.message?.includes("Extension context invalidated")

export const ensureSafeRuntimeConnect = (runtime: RuntimeLike = chrome?.runtime): void => {
  if (!runtime?.connect) {
    return
  }

  const current = runtime.connect as typeof runtime.connect & { __wanikanify_safe?: boolean }

  if (current.__wanikanify_safe) {
    return
  }

  const originalConnect = runtime.connect

  const safeConnect: typeof runtime.connect & { __wanikanify_safe?: boolean } = function (...args: Parameters<typeof runtime.connect>) {
    try {
      return originalConnect.apply(runtime, args)
    } catch (error) {
      if (isContextInvalidatedError(error)) {
        // Lazy import to avoid circular dependency and cost when not needed.
        // Using dynamic import keeps tree-shaking effective.
        import('~src/utils/log')
          .then(({ log }) => log.debug('runtime connect skipped', error))
          .catch(() => {})
        return createPortStub()
      }
      throw error
    }
  }

  safeConnect.__wanikanify_safe = true

  runtime.connect = safeConnect
}

