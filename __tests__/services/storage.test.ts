import { ExtensionStorageService } from '~src/services/storage'

describe('ExtensionStorageService', () => {
  it('persists and retrieves compressed payloads', async () => {
    const service = new ExtensionStorageService<{ message: string }>({ area: 'local' })

    await service.saveCompressed('test-key', { message: 'hello' }, 1)
    const result = await service.loadCompressed('test-key')

    expect(result?.data.message).toBe('hello')
  })
})
