/** @jest-environment jsdom */
import React from 'react'
import { render, fireEvent, screen } from '@testing-library/react'
import SettingsPreview from '~src/components/settings/Preview'
import { WaniSettingsFormImpl } from '~src/components/settings/types'
import { DEFAULT_SETTINGS } from '~src/components/settings/constants'

// Mock speech synthesis
const speakMock = jest.fn()
;(global as any).speechSynthesis = { speak: speakMock }
;(global as any).SpeechSynthesisUtterance = function (this: any, text: string) { this.text = text }

const buildForm = () => {
  const form = new WaniSettingsFormImpl()
  form.setFromWaniSettings(DEFAULT_SETTINGS)
  form.customVocabulary = 'fox:狐:きつね'
  form.audio.enabled = true
  form.audio.mode = 'click'
  form.audio.volume = 0.5
  form.showReplacementTooltips = true
  return form
}

describe('SettingsPreview audio integration', () => {
  afterEach(() => {
    speakMock.mockClear()
  })
  it('invokes speech synthesis on click when audio enabled', async () => {
    const form = buildForm()
    let container: HTMLElement
  render(<SettingsPreview settingsForm={form} />)
  const span = await screen.findByText('狐')
  const replacement = span.closest('.wanikanify-replacement') as HTMLElement | null
  expect(replacement).not.toBeNull()
  fireEvent.click(replacement!)
    expect(speakMock).toHaveBeenCalled()
  })

  it('does not invoke speech synthesis when audio disabled initially', async () => {
    const form = buildForm()
    form.audio.enabled = false
    let container: HTMLElement
  render(<SettingsPreview settingsForm={form} />)
  const span = await screen.findByText('狐')
  const replacement = span.closest('.wanikanify-replacement') as HTMLElement | null
  fireEvent.click(replacement!)
    expect(speakMock).not.toHaveBeenCalled()
  })
})
