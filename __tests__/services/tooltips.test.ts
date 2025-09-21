import { JSDOM } from "jsdom"

import { toggleTooltipVisibility, TOOLTIP_DISABLED_CLASS } from "~src/services/tooltips"

const setupDom = () =>
  new JSDOM(
    "<!doctype html><html><body><div data-wanikanify-container='true' id='container'></div></body></html>",
    {
      url: "https://example.com"
    }
  )

describe("toggleTooltipVisibility", () => {
  it("adds disabled class when tooltips are turned off", () => {
    const dom = setupDom()
    const { document } = dom.window

    toggleTooltipVisibility(document, false)

    expect(document.documentElement.classList.contains(TOOLTIP_DISABLED_CLASS)).toBe(true)
    expect(
      document.getElementById("container")?.classList.contains(TOOLTIP_DISABLED_CLASS)
    ).toBe(true)
  })

  it("removes disabled class when tooltips are turned on", () => {
    const dom = setupDom()
    const { document } = dom.window
    const root = document.documentElement
    const container = document.getElementById("container")

    root.classList.add(TOOLTIP_DISABLED_CLASS)
    container?.classList.add(TOOLTIP_DISABLED_CLASS)

    toggleTooltipVisibility(document, true)

    expect(root.classList.contains(TOOLTIP_DISABLED_CLASS)).toBe(false)
    expect(container?.classList.contains(TOOLTIP_DISABLED_CLASS)).toBe(false)
  })
})
