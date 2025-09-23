import { JSDOM } from "jsdom"

import { AudioService } from "~src/services/audio"

const createReplacement = (text: string, id: string, documentRef: Document) => {
  const span = documentRef.createElement("span")
  span.className = "wanikanify-replacement"
  span.id = id
  span.textContent = text
  return span
}

const createPlain = (text: string, id: string, documentRef: Document) => {
  const span = documentRef.createElement("span")
  span.id = id
  span.textContent = text
  return span
}

const flushMicrotasks = () => Promise.resolve()

describe("AudioService DOM interactions", () => {
  let service: AudioService | undefined
  let dom: JSDOM | undefined

  beforeEach(() => {
    dom = new JSDOM("<!doctype html><html><body></body></html>", {
      url: "https://example.com"
    })

    const { window } = dom

    global.window = window as unknown as typeof globalThis & Window
    global.document = window.document as unknown as Document
    global.HTMLElement = window.HTMLElement
    global.Node = window.Node
    global.MouseEvent = window.MouseEvent
    global.navigator = window.navigator
    global.getComputedStyle = window.getComputedStyle.bind(window)
    window.setTimeout = setTimeout as unknown as typeof window.setTimeout
    window.clearTimeout = clearTimeout as unknown as typeof window.clearTimeout
    window.setInterval = setInterval as unknown as typeof window.setInterval
    window.clearInterval = clearInterval as unknown as typeof window.clearInterval

    const replacement = createReplacement("語！", "replacement", document)
    const normal = createPlain("ordinary", "normal", document)

    document.body.append(replacement, normal)

    service = new AudioService()
    service.setVocabulary([
      {
        japanese: "語",
        reading: "ご",
        audioUrls: []
      }
    ])
  })

  afterEach(() => {
    if (service) {
      service.updateSettings({ enabled: false, mode: "click", volume: 1 })
    }

    if (dom) {
      dom.window.close()
    }

    document.body.innerHTML = ""
    jest.clearAllMocks()
    jest.useRealTimers()

    delete (global as any).window
    delete (global as any).document
    delete (global as any).HTMLElement
    delete (global as any).Node
    delete (global as any).MouseEvent
    delete (global as any).navigator
    delete (global as any).getComputedStyle

    service = undefined
    dom = undefined
  })

  it("only triggers playback for replaced elements on click", async () => {
    const playWordSpy = jest.spyOn(service as any, "playWord").mockResolvedValue(undefined)

    service!.updateSettings({ enabled: true, mode: "click", volume: 1 })

  const replacement = document.getElementById("replacement")!
  const clickEvent = document.createEvent('MouseEvents')
  clickEvent.initEvent('click', true, true)
  replacement.dispatchEvent(clickEvent)

    await flushMicrotasks()

    expect(playWordSpy).toHaveBeenCalledWith("語")

    playWordSpy.mockClear()

  const normal = document.getElementById("normal")!
  const clickEvent2 = document.createEvent('MouseEvents')
  clickEvent2.initEvent('click', true, true)
  normal.dispatchEvent(clickEvent2)

    await flushMicrotasks()

    expect(playWordSpy).not.toHaveBeenCalled()
  })

  it("only triggers playback for replaced elements on hover", async () => {
    jest.useFakeTimers()
    window.setTimeout = setTimeout as unknown as typeof window.setTimeout
    window.clearTimeout = clearTimeout as unknown as typeof window.clearTimeout

    const playWordSpy = jest.spyOn(service as any, "playWord").mockResolvedValue(undefined)

    service!.updateSettings({ enabled: true, mode: "hover", volume: 1 })

  const replacement = document.getElementById("replacement")!
  const moveEvent = document.createEvent('MouseEvents')
  moveEvent.initEvent('mousemove', true, true)
  replacement.dispatchEvent(moveEvent)

    jest.runAllTimers()
    await flushMicrotasks()

    expect(playWordSpy).toHaveBeenCalledWith("語")

    playWordSpy.mockClear()

  const normal = document.getElementById("normal")!
  const moveEvent2 = document.createEvent('MouseEvents')
  moveEvent2.initEvent('mousemove', true, true)
  normal.dispatchEvent(moveEvent2)

    jest.runOnlyPendingTimers()
    await flushMicrotasks()

    expect(playWordSpy).not.toHaveBeenCalled()
  })
})
