/** @jest-environment jsdom */
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SpreadsheetImportTable } from '~src/components/settings/SpreadsheetImport'

// Mock the import service
jest.mock('~src/services/spreadsheetImport', () => ({
  importSpreadsheet: jest.fn(),
  getImportHistory: jest.fn().mockResolvedValue([]),
  deleteHistoryEntry: jest.fn(),
  restoreHistoryEntry: jest.fn(),
}))

// Mock chrome runtime
global.chrome = {
  runtime: {
    sendMessage: jest.fn().mockResolvedValue(undefined)
  }
} as unknown as typeof chrome

describe('SpreadsheetImportTable - Warnings Tooltip', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('shows tooltip with warning details when hovering over success message with warnings', async () => {
    const { importSpreadsheet } = await import('~src/services/spreadsheetImport')
    
    // Mock successful import with warnings
    ;(importSpreadsheet as jest.Mock).mockResolvedValue({
      historyEntry: {
        id: 'test-id',
        entryCount: 10,
        errors: [
          { row: 3, message: 'Empty English column' },
          { row: 7, message: 'Invalid Japanese character' }
        ]
      }
    })

    const onChange = jest.fn()
    const testSheet = {
      collectionKey: 'test-key',
      spreadSheetName: 'Test Sheet',
      englishColumn: 'English',
      japaneseColumn: 'Japanese',
      readingColumn: '',
      delimiter: ''
    }

    render(<SpreadsheetImportTable value={[testSheet]} onChange={onChange} />)

    // Find and click import button
    const importButton = screen.getByRole('button', { name: /import/i })
    fireEvent.click(importButton)

    // Wait for success message with warnings
    const successMessage = await screen.findByText(/imported 10 entries with 2 warnings/i)
    expect(successMessage).toBeInTheDocument()

    // Hover over the success message to trigger tooltip
    fireEvent.mouseOver(successMessage)

    // Check for tooltip content
    await waitFor(() => {
      expect(screen.getByText('Import Warnings')).toBeInTheDocument()
    })
    expect(screen.getByText('Row 3: Empty English column')).toBeInTheDocument()
    expect(screen.getByText('Row 7: Invalid Japanese character')).toBeInTheDocument()
  })

  it('does not show tooltip when there are no warnings', async () => {
    const { importSpreadsheet } = await import('~src/services/spreadsheetImport')
    
    // Mock successful import without warnings
    ;(importSpreadsheet as jest.Mock).mockResolvedValue({
      historyEntry: {
        id: 'test-id',
        entryCount: 5,
        errors: []
      }
    })

    const onChange = jest.fn()
    const testSheet = {
      collectionKey: 'test-key',
      spreadSheetName: 'Test Sheet',
      englishColumn: 'English',
      japaneseColumn: 'Japanese',
      readingColumn: '',
      delimiter: ''
    }

    render(<SpreadsheetImportTable value={[testSheet]} onChange={onChange} />)

    // Find and click import button
    const importButton = screen.getByRole('button', { name: /import/i })
    fireEvent.click(importButton)

    // Wait for success message without warnings
    const successMessage = await screen.findByText(/imported 5 entries$/i)
    expect(successMessage).toBeInTheDocument()

    // Hover over the success message
    fireEvent.mouseOver(successMessage)

    // Should not have cursor help style or underline
    expect(successMessage).not.toHaveStyle('cursor: help')
    expect(successMessage).not.toHaveStyle('text-decoration: underline')
  })
})