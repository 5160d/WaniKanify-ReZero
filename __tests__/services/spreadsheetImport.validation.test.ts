import { importSpreadsheet, fetchSpreadsheetCsv } from '~src/services/spreadsheetImport'
import type { SpreadSheet } from '~src/components/settings/SpreadsheetImport/types'

describe('spreadsheetImport - Validation', () => {
  const baseSheet: SpreadSheet = {
    collectionKey: 'test-collection',
    spreadSheetName: 'Sheet1',
    englishColumn: 'English',
    japaneseColumn: 'Japanese',
    readingColumn: '',
    delimiter: ','
  }

  let originalFetch: any

  beforeEach(() => {
    originalFetch = global.fetch
    global.fetch = jest.fn()
  })

  afterEach(() => {
    if ((global.fetch as any)?.mockReset) {
      try { (global.fetch as jest.Mock).mockReset() } catch (_) {}
    }
    global.fetch = originalFetch
  })

  describe('Critical Errors (Import Fails)', () => {
    it('throws error when English column is missing', async () => {
      const csvContent = `Japanese,Reading
猫,ねこ
犬,いぬ`

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: async () => csvContent
      })

      const sheet = { ...baseSheet, englishColumn: 'English' }
      
      await expect(importSpreadsheet(sheet)).rejects.toThrow('Missing required English column "English"')
    })

    it('throws error when Japanese column is missing', async () => {
      const csvContent = `English,Reading
cat,ねこ
dog,いぬ`

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: async () => csvContent
      })

      const sheet = { ...baseSheet, japaneseColumn: 'Japanese' }
      
      await expect(importSpreadsheet(sheet)).rejects.toThrow('Missing required Japanese column "Japanese"')
    })

    it('throws error when both required columns are missing', async () => {
      const csvContent = `Reading,Other
ねこ,value1
いぬ,value2`

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: async () => csvContent
      })

      const sheet = { ...baseSheet, englishColumn: 'English', japaneseColumn: 'Japanese' }
      
      // Should throw for the first missing column it encounters (English)
      await expect(importSpreadsheet(sheet)).rejects.toThrow('Missing required English column "English"')
    })

    it('throws error for HTTP 400 responses (including invalid sheet names)', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400
      })

      const sheet = { ...baseSheet, spreadSheetName: 'NonExistentSheet' }
      
      await expect(fetchSpreadsheetCsv(sheet)).rejects.toThrow('Failed to fetch spreadsheet (HTTP 400)')
    })

    it('throws generic error for other HTTP failures', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 403
      })

      await expect(fetchSpreadsheetCsv(baseSheet)).rejects.toThrow('Failed to fetch spreadsheet (HTTP 403)')
    })
  })

  describe('Warnings (Import Succeeds)', () => {
    it('imports successfully with warning when reading column is invalid', async () => {
      const csvContent = `English,Japanese,SomeOtherColumn
cat,猫,other1
dog,犬,other2`

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: async () => csvContent
      })

      const sheet = { ...baseSheet, readingColumn: 'Reading' } // Column doesn't exist
      
      const { historyEntry } = await importSpreadsheet(sheet)
      
      expect(historyEntry.entryCount).toBe(2)
      expect(historyEntry.errors).toHaveLength(1)
      expect(historyEntry.errors[0].row).toBe(0)
      expect(historyEntry.errors[0].message).toContain('Reading column "Reading" not found')
      
      // Entries should still be imported without reading data
      expect(historyEntry.data.entries).toHaveLength(2)
      expect(historyEntry.data.entries[0].reading).toBeUndefined()
      expect(historyEntry.data.entries[1].reading).toBeUndefined()
    })

    it('imports successfully when reading column is not specified', async () => {
      const csvContent = `English,Japanese
cat,猫
dog,犬`

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: async () => csvContent
      })

      const sheet = { ...baseSheet, readingColumn: '' } // No reading column specified
      
      const { historyEntry } = await importSpreadsheet(sheet)
      
      expect(historyEntry.entryCount).toBe(2)
      expect(historyEntry.errors).toHaveLength(0) // No warnings for unspecified reading column
      expect(historyEntry.data.entries[0].reading).toBeUndefined()
    })

    it('imports successfully when reading column exists and is valid', async () => {
      const csvContent = `English,Japanese,Reading
cat,猫,ねこ
dog,犬,いぬ`

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: async () => csvContent
      })

      const sheet = { ...baseSheet, readingColumn: 'Reading' }
      
      const { historyEntry } = await importSpreadsheet(sheet)
      
      expect(historyEntry.entryCount).toBe(2)
      expect(historyEntry.errors).toHaveLength(0)
      expect(historyEntry.data.entries[0].reading).toBe('ねこ')
      expect(historyEntry.data.entries[1].reading).toBe('いぬ')
    })
  })

  describe('Mixed Scenarios', () => {
    it('combines invalid reading column warning with row-level errors', async () => {
      const csvContent = `English,Japanese,SomeOtherColumn
cat,猫,other1
,犬,other2
dog,,other3`

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: async () => csvContent
      })

      const sheet = { ...baseSheet, readingColumn: 'Reading' } // Invalid reading column
      
      const { historyEntry } = await importSpreadsheet(sheet)
      
      expect(historyEntry.entryCount).toBe(1) // Only first row imported successfully
      expect(historyEntry.errors).toHaveLength(3)
      
      // First error should be the reading column warning
      expect(historyEntry.errors[0].row).toBe(0)
      expect(historyEntry.errors[0].message).toContain('Reading column "Reading" not found')
      
      // Next errors should be row-level validation errors
      expect(historyEntry.errors[1].row).toBe(3) // Row 2 in data (missing English)
      expect(historyEntry.errors[2].row).toBe(4) // Row 3 in data (missing Japanese)
    })
  })
})