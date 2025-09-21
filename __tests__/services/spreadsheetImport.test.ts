import { importSpreadsheet, getSpreadsheetData, deleteHistoryEntry, getImportHistory, getAggregatedImportedVocabulary } from '~src/services/spreadsheetImport'
import type { SpreadSheet } from '~src/components/settings/SpreadsheetImport/types'

describe('spreadsheetImport', () => {
  const sampleSheet: SpreadSheet = {
    collectionKey: 'test-collection',
    spreadSheetName: 'Sheet1',
    englishColumn: 'English',
    japaneseColumn: 'Japanese',
    readingColumn: 'Reading',
    delimiter: ','
  }

  const csvContent = `English,Japanese,Reading
cat,猫,ねこ
dog,犬,いぬ`

  beforeEach(() => {
    const fetchMock = global.fetch as jest.Mock
    fetchMock.mockResolvedValue({
      ok: true,
      text: async () => csvContent
    })
  })

  afterEach(async () => {
    const fetchMock = global.fetch as jest.Mock
    fetchMock.mockReset()

    const history = await getImportHistory()
    for (const entry of history) {
      await deleteHistoryEntry(entry.id)
    }
  })

  it('imports spreadsheet and stores vocabulary entries', async () => {
    const { historyEntry } = await importSpreadsheet(sampleSheet)

    expect(historyEntry.entryCount).toBe(2)
    expect(historyEntry.errors).toHaveLength(0)

    const data = await getSpreadsheetData()
    const key = `${sampleSheet.collectionKey}::${sampleSheet.spreadSheetName}`
    expect(data[key].entries).toHaveLength(2)
    expect(data[key].entries[0].japanese).toBe(String.fromCharCode(0x732b))

    const aggregated = await getAggregatedImportedVocabulary()
    expect(aggregated).toHaveLength(2)
    expect(aggregated[0].source).toBe('imported')
  })

  it('removes imported vocabulary when history entry is deleted', async () => {
    const { historyEntry } = await importSpreadsheet(sampleSheet)
    const key = `${sampleSheet.collectionKey}::${sampleSheet.spreadSheetName}`

    let data = await getSpreadsheetData()
    expect(data[key]).toBeDefined()

    await deleteHistoryEntry(historyEntry.id)

    data = await getSpreadsheetData()
    expect(data[key]).toBeUndefined()

    const history = await getImportHistory()
    expect(history).toHaveLength(0)
  })
})
