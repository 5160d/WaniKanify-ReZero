type RuntimeLike = typeof chrome.runtime | undefined

type ChromeEvent = chrome.events.Event<(...args: any[]) => void>

const createEventStub = (): ChromeEvent => {
  const listeners = new Set<(...args: any[]) => void>()
  return {
    addListener: (listener: (...args: any[]) => void) => {
      listeners.add(listener)
    },
    removeListener: (listener: (...args: any[]) => void) => {
      listeners.delete(listener)
    },
    hasListener: (listener: (...args: any[]) => void) => listeners.has(listener),
    hasListeners: () => listeners.size > 0
  } as ChromeEvent
}

const createPortStub = (): chrome.runtime.Port => ({
  name: "wanikanify:safe-port",
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
  // Lazy require to avoid circular import during early script eval
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { log } = require('~src/utils/log') as typeof import('~src/utils/log')
  log.debug("WaniKanify: runtime connect skipped", error)
        return createPortStub()
      }

      throw error
    }
  }

  safeConnect.__wanikanify_safe = true

  runtime.connect = safeConnect
}

