/** @jest-environment jsdom */
import { render } from '@testing-library/react'
import React from 'react'

import SettingsPreview from '~src/components/settings/Preview'
import { WaniSettingsFormImpl } from '~src/components/settings/types'
import { DEFAULT_SETTINGS } from '~src/components/settings/constants'

const buildForm = () => {
  const form = new WaniSettingsFormImpl()
  form.setFromWaniSettings(DEFAULT_SETTINGS)
  form.customVocabulary = 'fox:狐:きつね'
  return form
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('SettingsPreview', () => {
  it('renders preview text with replacement styling', async () => {
    const form = buildForm()
    const { container } = render(<SettingsPreview settingsForm={form} />)
    await flush()
    await flush()

    expect(container.textContent).toContain('fox')
  })
})
