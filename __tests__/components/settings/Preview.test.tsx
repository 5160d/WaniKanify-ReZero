/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react'
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

// Using findBy* queries will internally handle act; no manual flush needed.

describe('SettingsPreview', () => {
  it('renders preview with Japanese replacement and data attributes', async () => {
    const form = buildForm()
    let container: HTMLElement
    render(<SettingsPreview settingsForm={form} />)
    // Use findBy to wait for the span to appear
    const span = await screen.findByText('狐')
    expect(span).toBeInTheDocument()
    const replacement = span.closest('span.wanikanify-replacement') as HTMLElement | null
    expect(replacement).not.toBeNull()
    expect(replacement?.getAttribute('data-wanikanify-original')).toBe('fox')
    expect(replacement?.getAttribute('data-wanikanify-reading')).toBe('きつね')
  })
})
