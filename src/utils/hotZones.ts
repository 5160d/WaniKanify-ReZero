export type HotZoneThresholds = {
  burstCount: number
  windowMs: number
  cooldownMs: number
}

export type TimeProvider = () => number

export type ZoneRootResolver = (el: Element) => Element

type ZoneInfo = { count: number; last: number; clearHotId: number | null }

export class HotZoneTracker {
  private hotRoots: WeakSet<Element> = new WeakSet()
  private hotCounts: WeakMap<Element, ZoneInfo> = new WeakMap()
  private thresholds: HotZoneThresholds
  private now: TimeProvider

  constructor(
    options?: {
      thresholds?: Partial<HotZoneThresholds>
      now?: TimeProvider
      zoneRootResolver?: ZoneRootResolver
    }
  ) {
    this.thresholds = {
      burstCount: options?.thresholds?.burstCount ?? 20,
      windowMs: options?.thresholds?.windowMs ?? 150,
      cooldownMs: options?.thresholds?.cooldownMs ?? 500
    }
    this.now = options?.now ?? (() => performance.now())
    this.zoneRootResolver = options?.zoneRootResolver ?? ((el) => el)
  }

  public zoneRootResolver: ZoneRootResolver

  reset(): void {
    this.hotRoots = new WeakSet()
    this.hotCounts = new WeakMap()
  }

  mark(records: Array<{ target: Node }>): void {
    const now = this.now()
    for (const rec of records) {
      let el: Element | null = null
      if (rec.target instanceof Element) {
        el = rec.target
      } else if ((rec.target as CharacterData)?.parentElement) {
        el = (rec.target as CharacterData).parentElement
      }
      if (!el) continue

      const zone = this.zoneRootResolver(el)
      const current: ZoneInfo = this.hotCounts.get(zone) ?? {
        count: 0,
        last: 0,
        clearHotId: null
      }

      if (now - current.last <= this.thresholds.windowMs) {
        current.count += 1
      } else {
        current.count = 1
      }
      current.last = now

      if (current.count >= this.thresholds.burstCount) {
        this.hotRoots.add(zone)
        if (current.clearHotId !== null) {
          window.clearTimeout(current.clearHotId)
        }
        current.clearHotId = window.setTimeout(() => {
          this.hotRoots.delete(zone)
          const entry = this.hotCounts.get(zone)
          if (entry) {
            entry.count = 0
            entry.clearHotId = null
            entry.last = this.now()
            this.hotCounts.set(zone, entry)
          }
        }, this.thresholds.cooldownMs)
        current.count = 0
      }

      this.hotCounts.set(zone, current)
    }
  }

  isHot(el: Element | null, maxDepth = 10): boolean {
    let node: Element | null = el
    let depth = 0
    while (node && depth <= maxDepth) {
      if (this.hotRoots.has(node)) return true
      node = node.parentElement
      depth += 1
    }
    return false
  }
}

export const DEFAULT_HOTZONE_THRESHOLDS: HotZoneThresholds = {
  burstCount: 20,
  windowMs: 150,
  cooldownMs: 500
}
