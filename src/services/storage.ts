import { Storage } from "@plasmohq/storage"

type MigrationFn<T> = (data: T) => T

export interface StorageMigration<T> {
  version: number
  migrate: MigrationFn<T>
}

export interface CompressedPayload<T> {
  version: number
  compressed: string
  checksum: string
  updatedAt: string
  metadata?: Record<string, unknown>
}

export interface StorageUsage {
  bytes: number
  quota: number
  percentage: number
}

const gzipSupported = () => typeof CompressionStream !== "undefined"

const textEncoder = new TextEncoder()

const hashString = async (input: string) => {
  const data = textEncoder.encode(input)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("")
}

const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  const len = bytes.byteLength
  for (let i = 0; i < len; i += 1) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

const base64ToUint8Array = (base64: string) => {
  const binary = atob(base64)
  const len = binary.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

const compress = async (input: string): Promise<string> => {
  if (!gzipSupported()) {
    return input
  }

  const stream = new CompressionStream('gzip')
  const writer = stream.writable.getWriter()
  await writer.write(textEncoder.encode(input))
  await writer.close()
  const compressed = await new Response(stream.readable).arrayBuffer()
  return arrayBufferToBase64(compressed)
}

const decompress = async (input: string): Promise<string> => {
  if (!gzipSupported()) {
    return input
  }

  const buffer = base64ToUint8Array(input)
  const stream = new DecompressionStream('gzip')
  const writer = stream.writable.getWriter()
  await writer.write(buffer)
  await writer.close()
  const text = await new Response(stream.readable).text()
  return text
}

export class ExtensionStorageService<T = Record<string, unknown>> {
  private storage: Storage
  private migrations: StorageMigration<T>[] = []
  private quotaBytes: number
  private namespace: string

  constructor(options?: { area?: chrome.storage.AreaName; quotaBytes?: number; namespace?: string }) {
    this.storage = new Storage({ area: options?.area ?? 'local' })
    this.quotaBytes = options?.quotaBytes ?? (options?.area === 'sync' ? 102_400 : 5_242_880)
    this.namespace = options?.namespace ?? 'wanikanify'
  }

  setNamespace(namespace: string) {
    this.namespace = namespace
    this.storage.setNamespace?.(namespace)
  }

  registerMigration(migration: StorageMigration<T>) {
    this.migrations.push(migration)
    this.migrations.sort((a, b) => a.version - b.version)
  }

  private async applyMigrations(data: T, currentVersion: number): Promise<{ data: T; version: number }> {
    let workingData = data
    let version = currentVersion

    for (const migration of this.migrations) {
      if (migration.version > version) {
        workingData = migration.migrate(workingData)
        version = migration.version
      }
    }

    return { data: workingData, version }
  }

  async getRaw<K>(key: string): Promise<K | undefined> {
    return this.storage.get<K>(key)
  }

  async setRaw<K>(key: string, value: K) {
    await this.storage.set(key, value)
  }

  async saveCompressed(key: string, payload: T, version = 1, metadata?: Record<string, unknown>): Promise<void> {
    const serialized = JSON.stringify(payload)
    const compressed = await compress(serialized)
    const checksum = await hashString(serialized)
    const record: CompressedPayload<T> = {
      version,
      compressed,
      checksum,
      updatedAt: new Date().toISOString(),
      metadata
    }
    await this.storage.set(key, record)

    const usage = await this.getUsage()
    if (usage.percentage > 80) {
      console.warn(`WaniKanify: storage usage at ${usage.percentage}% of quota`) // eslint-disable-line no-console
    }
  }

  async loadCompressed(key: string): Promise<{ data: T; metadata?: Record<string, unknown> } | null> {
    const record = await this.storage.get<CompressedPayload<T>>(key)
    if (!record) {
      return null
    }

    const decompressed = await decompress(record.compressed)
    const checksum = await hashString(decompressed)
    if (checksum !== record.checksum) {
      console.warn('WaniKanify: checksum mismatch for', key)
    }

    const parsed: T = JSON.parse(decompressed)
    const migrated = await this.applyMigrations(parsed, record.version)
    return { data: migrated.data, metadata: record.metadata }
  }

  async getUsage(): Promise<StorageUsage> {
    const data = await this.storage.getAll()
    const serialized = JSON.stringify(data)
    const bytes = new Blob([serialized]).size
    return {
      bytes,
      quota: this.quotaBytes,
      percentage: Number(((bytes / this.quotaBytes) * 100).toFixed(2))
    }
  }

  async cleanup(keysToKeep: string[]): Promise<void> {
    const allKeys = Object.keys(await this.storage.getAll())
    const stale = allKeys.filter((key) => !keysToKeep.includes(key))
    if (stale.length) {
      await this.storage.removeMany(stale)
    }
  }

  async resolveSyncConflict<K extends { updatedAt?: string }>(key: string, incoming: K): Promise<void> {
    const existing = await this.storage.get<K>(key)
    if (!existing) {
      await this.storage.set(key, incoming)
      return
    }

    const existingTime = existing.updatedAt ? new Date(existing.updatedAt).getTime() : 0
    const incomingTime = incoming.updatedAt ? new Date(incoming.updatedAt).getTime() : Date.now()

    if (incomingTime >= existingTime) {
      await this.storage.set(key, { ...existing, ...incoming })
    }
  }
}

export const localStorageService = new ExtensionStorageService({ area: 'local' })
export const syncStorageService = new ExtensionStorageService({ area: 'sync' })
