import '@testing-library/jest-dom'

const g = globalThis as any

if (!g.chrome) {
  g.chrome = {
    runtime: {
      sendMessage: jest.fn(),
      onMessage: {
        addListener: jest.fn()
      }
    },
    storage: {
      local: {
        get: jest.fn((keys, callback) => callback?.({})),
        set: jest.fn((items, callback) => callback?.())
      },
      sync: {
        get: jest.fn((keys, callback) => callback?.({})),
        set: jest.fn((items, callback) => callback?.())
      },
      onChanged: {
        addListener: jest.fn()
      }
    }
  }
}

// Ensure chrome.action exists for background controller tests
if (!g.chrome.action) {
  g.chrome.action = {
    setPopup: jest.fn(),
    onClicked: { addListener: jest.fn() }
  }
}

// Allow opting into live WaniKani API tests by setting WK_LIVE=1 (else mock fetch)
if (!process.env.WK_LIVE) {
  g.fetch = jest.fn()
}

jest.mock('@plasmohq/storage', () => {
  class MockStorage {
    private store = new Map<string, any>()

    constructor() {}

    async get<T>(key: string): Promise<T | undefined> {
      return this.store.get(key)
    }

    async set(key: string, value: unknown): Promise<void> {
      this.store.set(key, value)
    }

    async getAll(): Promise<Record<string, unknown>> {
      return Object.fromEntries(this.store.entries())
    }

    async removeMany(keys: string[]): Promise<void> {
      keys.forEach((key) => this.store.delete(key))
    }

    async setNamespace(): Promise<void> {
      return
    }
  }

  return { Storage: MockStorage }
})

// Optional: suppress noisy ReactDOMTestUtils.act deprecation warnings in tests until fully migrated.
// Set SUPPRESS_ACT_WARNING=1 to enable silencing; keeps signal available when unset.
if (process.env.SUPPRESS_ACT_WARNING === '1') {
  const originalError = console.error
  console.error = (...args: any[]) => {
    const msg = args[0]
    if (typeof msg === 'string' && msg.includes('ReactDOMTestUtils.act is deprecated')) {
      return
    }
    originalError(...args)
  }
}
