import { ensureSafeRuntimeConnect } from "~src/utils/runtimeConnect"

const createRuntime = (implementation: () => chrome.runtime.Port) => {
  const connect = jest.fn(implementation) as unknown as typeof chrome.runtime.connect & { __wanikanify_safe?: boolean }

  return {
    connect
  } as unknown as typeof chrome.runtime
}

describe("ensureSafeRuntimeConnect", () => {
  it("returns original port when connect succeeds", () => {
    const port = { name: "original" } as chrome.runtime.Port
    const runtime = createRuntime(() => port)

    ensureSafeRuntimeConnect(runtime)

    const result = runtime.connect({ name: "test" })

    expect(result).toBe(port)
  })

  it("returns stub port when context invalidated", () => {
    const error = new Error("Extension context invalidated.")
    const runtime = createRuntime(() => {
      throw error
    })

    ensureSafeRuntimeConnect(runtime)

    const result = runtime.connect({ name: "test" })

    expect(result).toBeDefined()
    expect(result.name).toBe("wanikanify:safe-port")
    expect(() => result.postMessage({})).not.toThrow()
  })

  it("does not wrap connect multiple times", () => {
    const runtime = createRuntime(() => ({ name: "port" } as chrome.runtime.Port))

    ensureSafeRuntimeConnect(runtime)
    const firstConnect = runtime.connect
    ensureSafeRuntimeConnect(runtime)

    expect(runtime.connect).toBe(firstConnect)
  })
})

