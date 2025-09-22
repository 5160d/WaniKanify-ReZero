/** @jest-environment jsdom */
import React from 'react'
import { render } from '@testing-library/react'
import { SaveButton } from '~src/components/settings/SaveButton'
import type { SaveStatus } from '~src/components/settings/SaveButton/types'

// Mock i18n to detect missing-key warnings via logger.
jest.mock('~src/utils/log', () => {
  const original = jest.requireActual('~src/utils/log')
  return {
    __esModule: true,
    ...original,
    log: {
      ...original.log,
      warn: jest.fn(original.log.warn)
    }
  }
})

describe('SaveButton localization safety', () => {
  test('does not invoke t() with empty key on initial idle render', () => {
    const status: SaveStatus = { status: 'idle', message: '' }
    const { log } = require('~src/utils/log')
    render(<SaveButton status={status} hasErrors={false} isDirty={false} />)
    // No warn for missing key with empty string
    const warns = (log.warn as jest.Mock).mock.calls.map(c => c.join(' '))
    const hasEmptyMissing = warns.some(line => line.includes('[i18n] Missing key:') && /:\s*$/.test(line))
    expect(hasEmptyMissing).toBe(false)
  })
})
