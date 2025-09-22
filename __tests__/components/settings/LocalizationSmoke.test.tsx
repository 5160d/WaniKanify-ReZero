/** @jest-environment jsdom */
import React from 'react'
import { render, screen } from '@testing-library/react'
import { SettingsPreview } from '~src/components/settings/Preview'
import { SpreadsheetImportTable } from '~src/components/settings/SpreadsheetImport'
import SettingsTools from '~src/components/settings/SettingsTools'
import { SitesFilteringTable } from '~src/components/settings/SitesFiltering'
import { WaniSettingsFormImpl } from '~src/components/settings/types'

// Minimal factory for form; reuse existing defaults
const createForm = (): WaniSettingsFormImpl => {
  const form = new WaniSettingsFormImpl()
  form.setFromWaniSettings({
    version: 1,
    apiToken: 'dummy-token-1234-1234-1234-123456789012',
    autoRun: false,
    audio: { enabled: false, mode: 'hover', volume: 1 },
    showReplacementTooltips: true,
    numbersReplacement: true,
    performanceTelemetry: false,
    srsGroups: { apprentice: true, guru: true, master: true, enlightened: true, burned: true },
    customVocabulary: new Map(),
    vocabularyBlacklist: new Set(),
    sitesFiltering: [],
    spreadsheetImport: [],
    siteOverrides: {}
  })
  return form
}

describe('localization smoke', () => {
  test('renders localized headings & buttons (preview/import/tools/sites)', () => {
    const form = createForm()

    render(<SettingsPreview settingsForm={form} />)
    render(<SpreadsheetImportTable value={[]} onChange={() => {}} />)
    render(<SettingsTools
      settingsForm={form}
      onImportSettings={() => {}}
      onValidationReset={() => {}}
      onResetDefaults={() => {}}
      onSyncFromCloud={async () => {}}
    />)
    render(<SitesFilteringTable value={[]} onChange={() => {}} />)

    // Spot check localized visible text (values from messages.json)
    const localizedExpectations = [
      'Live Preview',
      'Imported Vocabulary',
      'Settings Tools',
      'Filtered Websites',
      'Add', // sites filtering + import table
    ]
    localizedExpectations.forEach(txt => {
      expect(screen.getAllByText(txt).length).toBeGreaterThanOrEqual(1)
    })

    // Ensure no raw i18n key identifiers appear in DOM (basic leak guard)
    const containerHtml = document.body.innerHTML
    const forbiddenKeyFragments = [
      'import_state_not_imported',
      'settings_tools_button_export',
      'sites_filtering_tooltip_pattern_types'
    ]
    forbiddenKeyFragments.forEach(frag => {
      expect(containerHtml.includes(frag)).toBe(false)
    })
  })
})
