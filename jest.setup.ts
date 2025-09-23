import '@testing-library/jest-dom'

const g = globalThis as any

// Polyfill TextEncoder/TextDecoder for older Node versions used in CI where they
// may not be globally available (required by jsdom, whatwg-url, and our hashing util).
try {
  const { TextEncoder, TextDecoder } = require('util')
  if (!g.TextEncoder) g.TextEncoder = TextEncoder
  if (!g.TextDecoder) g.TextDecoder = TextDecoder
} catch {}

// Lightweight structuredClone polyfill sufficient for our Jest rule tests.
// (ESLint rule tester uses structuredClone internally on plain JSON-compatible objects.)
if (typeof g.structuredClone !== 'function') {
  g.structuredClone = (value: any) => {
    // Fallback: handles plain data (objects/arrays/primitives). Not for complex types.
    return value && typeof value === 'object' ? JSON.parse(JSON.stringify(value)) : value
  }
}

// Minimal crypto.subtle.digest (SHA-256) polyfill for Node <19 environments used in CI.
if (!g.crypto) {
  g.crypto = {}
}
if (!g.crypto.subtle) {
  const nodeCrypto = require('crypto')
  g.crypto.subtle = {
    async digest(algorithm: string | { name: string }, data: ArrayBuffer | ArrayBufferView) {
      const algo = (typeof algorithm === 'string' ? algorithm : algorithm.name).toLowerCase().replace(/-/g, '') // e.g. 'sha256'
      const hash = nodeCrypto.createHash(algo)
      const buffer = data instanceof ArrayBuffer ? Buffer.from(data) : Buffer.from(data.buffer, data.byteOffset, data.byteLength)
      hash.update(buffer)
      const digest = hash.digest()
      // Return an ArrayBuffer per Web Crypto subtle spec
      return digest.buffer.slice(digest.byteOffset, digest.byteOffset + digest.byteLength)
    }
  }
}

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
