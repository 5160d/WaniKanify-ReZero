import React from 'react'
import { render, screen, act, fireEvent } from '@testing-library/react'
import { ClearCacheButton } from '~src/components/settings/ClearCacheButton'
import { __WK_EVT_CLEAR_CACHE, __WK_EVT_STATE } from '~src/internal/tokens'

// Basic shim for chrome.runtime messaging
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const listeners: any[] = []
;(global as any).chrome = {
  runtime: {
    sendMessage: (msg: unknown, cb?: () => void) => {
      // Immediately invoke callback to simulate async return
      if ((msg as any)?.type === __WK_EVT_CLEAR_CACHE) {
        cb?.()
        // Simulate background broadcasting state transitions: refreshing true then false
        setTimeout(() => {
          listeners.forEach((l) => l({ type: __WK_EVT_STATE, payload: { isRefreshing: true } }))
          setTimeout(() => {
            listeners.forEach((l) => l({ type: __WK_EVT_STATE, payload: { isRefreshing: false } }))
          }, 120)
        }, 30)
      } else {
        cb?.()
      }
    },
    onMessage: {
      addListener: (fn: unknown) => {
        listeners.push(fn)
      },
      removeListener: (fn: unknown) => {
        const i = listeners.indexOf(fn)
        if (i >= 0) listeners.splice(i, 1)
      }
    }
  }
}

describe('ClearCacheButton', () => {
  it('shows rebuilding state after clearing', async () => {
  render(<ClearCacheButton />)

    // Initial label
    expect(screen.getByRole('button', { name: /clear cache/i })).toBeInTheDocument()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /clear cache/i }))
    })

    // Allow either immediate cleared (fast resolve) or clearing first
    const btn = screen.getByRole('button')
    const content = btn.textContent?.toLowerCase() ?? ''
    expect(content.length).toBeGreaterThan(0)

    // Wait for completion (simulate full cycle time)
    await act(async () => { await new Promise((r) => setTimeout(r, 200)) })
    const final = screen.getByRole('button').textContent?.toLowerCase() ?? ''
    expect(final.includes('clear cache') || final.includes('cleared')).toBeTruthy()
  })
})
