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

g.fetch = jest.fn()

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
