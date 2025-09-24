import { HotZoneTracker } from "~src/utils/hotZones"

describe("HotZoneTracker", () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(0)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  function makeEl(): Element {
    return document.createElement("div")
  }

  it("marks a zone hot after a mutation burst and cools down after cooldownMs", () => {
    const tracker = new HotZoneTracker({
      thresholds: { burstCount: 3, windowMs: 100, cooldownMs: 200 },
      now: () => Date.now(),
      zoneRootResolver: (el) => el
    })

    const a = makeEl()

    // 3 rapid mutations within window -> becomes hot
    tracker.mark([{ target: a } as unknown as MutationRecord])
    jest.advanceTimersByTime(10)
    tracker.mark([{ target: a } as unknown as MutationRecord])
    jest.advanceTimersByTime(10)
    tracker.mark([{ target: a } as unknown as MutationRecord])

    expect(tracker.isHot(a)).toBe(true)

    // After cooldown, not hot
    jest.advanceTimersByTime(200)
    expect(tracker.isHot(a)).toBe(false)
  })

  it("does not go hot if events are spaced outside the window", () => {
    const tracker = new HotZoneTracker({
      thresholds: { burstCount: 3, windowMs: 50, cooldownMs: 100 },
      now: () => Date.now(),
      zoneRootResolver: (el) => el
    })

    const b = makeEl()

    tracker.mark([{ target: b } as unknown as MutationRecord])
    jest.advanceTimersByTime(60)
    tracker.mark([{ target: b } as unknown as MutationRecord])
    jest.advanceTimersByTime(60)
    tracker.mark([{ target: b } as unknown as MutationRecord])

    expect(tracker.isHot(b)).toBe(false)
  })

  it("inherits hot state via ancestor traversal", () => {
    const tracker = new HotZoneTracker({
      thresholds: { burstCount: 2, windowMs: 100, cooldownMs: 100 },
      now: () => Date.now(),
      zoneRootResolver: (el) => el
    })

    const root = document.createElement("div")
    const child = document.createElement("span")
    root.appendChild(child)

    tracker.mark([{ target: root } as unknown as MutationRecord])
    tracker.mark([{ target: root } as unknown as MutationRecord])

    expect(tracker.isHot(child)).toBe(true)
  })
})
