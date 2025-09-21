const DISABLED_CLASS = "wanikanify-tooltips-disabled"
const REPLACEMENT_CONTAINER_SELECTOR = "[data-wanikanify-container='true']"

// Singleton tooltip pair + state
let singletonEnglish: HTMLElement | null = null
let singletonReading: HTMLElement | null = null
let activeElement: HTMLElement | null = null
let hideTimeout: number | null = null
let showDelayTimeout: number | null = null // (will be deprecated by immediate show logic)
let rafLock = false
let contentFrozenForElement: HTMLElement | null = null
let mutationObserver: MutationObserver | null = null
let frozenEnglishValue: string | null = null
let frozenReadingValue: string | null = null
let verificationInterval: number | null = null

const toRootElement = (root: Document | Element | null): Element | null => {
  if (!root) {
    return null
  }

  const maybeDocument = root as Document

  if (typeof maybeDocument.documentElement !== "undefined") {
    return maybeDocument.documentElement ?? null
  }

  return root as Element
}

export const TOOLTIP_DISABLED_CLASS = DISABLED_CLASS

export const toggleTooltipVisibility = (
  root: Document | Element | null,
  shouldShow: boolean
): void => {
  const rootElement = toRootElement(root)

  if (!rootElement) {
    return
  }

  const containers = rootElement.querySelectorAll<HTMLElement>(
    REPLACEMENT_CONTAINER_SELECTOR
  )

  if (shouldShow) {
    rootElement.classList.remove(DISABLED_CLASS)
    containers.forEach((element) => element.classList.remove(DISABLED_CLASS))
    return
  }

  rootElement.classList.add(DISABLED_CLASS)
  containers.forEach((element) => element.classList.add(DISABLED_CLASS))
}

// Debug function for testing tooltip positioning
export const debugTooltipPositioning = () => {
  const elements = document.querySelectorAll('.wanikanify-replacement')
  console.log(`Found ${elements.length} replacement elements`)
  elements.forEach((element, index) => {
    console.log(`Element ${index}:`, {
      element,
      rect: element.getBoundingClientRect(),
      original: element.getAttribute('data-wanikanify-original'),
      reading: element.getAttribute('data-wanikanify-reading'),
      classes: Array.from(element.classList)
    })
    positionTooltipsForElement(element as HTMLElement)
  })
}

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  ;(window as any).debugWaniKanifyTooltips = debugTooltipPositioning
}

export const initializeTooltipPositioning = (root: Document | Element | null): void => {
  const rootElement = toRootElement(root)
  
  if (!rootElement) {
    return
  }

  // Add event listeners for dynamic tooltip positioning
  const handleMouseEnter = (event: Event) => {
    const target = event.target as HTMLElement
    if (!target?.classList?.contains('wanikanify-replacement')) return
    activeElement = target
    if (hideTimeout) { clearTimeout(hideTimeout); hideTimeout = null }
    if (showDelayTimeout) { clearTimeout(showDelayTimeout); showDelayTimeout = null }
    // Immediate scheduling without artificial delay
    if (rafLock) return
    rafLock = true
    requestAnimationFrame(() => { rafLock = false; updateAndShowSingletonTooltips(target) })
  }

  const handleMouseLeave = (event: Event) => {
    const target = event.target as HTMLElement
    if (!target?.classList?.contains('wanikanify-replacement')) return
    if (activeElement === target) {
      hideTimeout = window.setTimeout(() => {
        hideSingletonTooltips();
        activeElement = null
        contentFrozenForElement = null
        frozenEnglishValue = null
        frozenReadingValue = null
        disconnectMutationObserver()
        stopVerificationLoop()
      }, 120)
    }
  }

  const repositionIfActive = () => {
    if (!activeElement) return
    requestAnimationFrame(() => {
      if (activeElement) positionTooltipsForElement(activeElement)
    })
  }

  const handleScroll = repositionIfActive
  const handleResize = repositionIfActive
  const handleDocumentScroll = repositionIfActive

  rootElement.addEventListener('mouseenter', handleMouseEnter, { capture: true, passive: true })
  rootElement.addEventListener('mouseleave', handleMouseLeave, { capture: true, passive: true })
  window.addEventListener('scroll', handleScroll, { passive: true })
  document.addEventListener('scroll', handleDocumentScroll, { capture: true, passive: true })
  window.addEventListener('resize', handleResize, { passive: true })
}

const positionTooltipsForElement = (element: HTMLElement): void => {
  updateAndShowSingletonTooltips(element)
}

function ensureSingletons() {
  if (!singletonEnglish) {
    singletonEnglish = document.createElement('div')
    singletonEnglish.className = 'wanikanify-tooltip wanikanify-tooltip-after'
    Object.assign(singletonEnglish.style, { position: 'fixed', opacity: '0', pointerEvents: 'none', zIndex: '2147483647' })
    document.body.appendChild(singletonEnglish)
  }
  if (!singletonReading) {
    singletonReading = document.createElement('div')
    singletonReading.className = 'wanikanify-tooltip wanikanify-tooltip-before'
    Object.assign(singletonReading.style, { position: 'fixed', opacity: '0', pointerEvents: 'none', zIndex: '2147483646' })
    document.body.appendChild(singletonReading)
  }
}

function updateAndShowSingletonTooltips(element: HTMLElement) {
  ensureSingletons()
  if (!singletonEnglish || !singletonReading) return
  const englishAttr = element.getAttribute('data-wanikanify-original')?.trim() || ''
  const readingAttr = element.getAttribute('data-wanikanify-reading')?.trim() || ''
  const isSameHover = contentFrozenForElement === element
  const previousEnglish = singletonEnglish.textContent
  const previousReading = singletonReading.textContent
  const elementTextNow = element.textContent
  const debugSnapshot = {
    elementText: elementTextNow,
    englishAttr: englishAttr,
    readingAttr: readingAttr,
    prevEnglish: previousEnglish,
    prevReading: previousReading,
    isSameHover
  }
  console.log('WaniKanify Tooltip Update Begin:', debugSnapshot)
  if (!englishAttr && !readingAttr) { hideSingletonTooltips(); return }
  if (!isSameHover) {
    singletonEnglish.textContent = englishAttr
    singletonReading.textContent = readingAttr
    contentFrozenForElement = element
    frozenEnglishValue = englishAttr
    frozenReadingValue = readingAttr
    observeBothTooltips()
    startVerificationLoop()
  } else {
    // Verify integrity on reposition cycles
    if (frozenEnglishValue !== null && singletonEnglish.textContent !== frozenEnglishValue) {
      console.warn('WaniKanify English tooltip mismatch detected, restoring', { expected: frozenEnglishValue, actual: singletonEnglish.textContent })
      singletonEnglish.textContent = frozenEnglishValue
    }
    if (frozenReadingValue !== null && singletonReading.textContent !== frozenReadingValue) {
      console.warn('WaniKanify Reading tooltip mismatch detected, restoring', { expected: frozenReadingValue, actual: singletonReading.textContent })
      singletonReading.textContent = frozenReadingValue
    }
  }

  // Pre-measure
  const prep = (el: HTMLElement) => { el.style.left = '-9999px'; el.style.top = '-9999px'; el.style.opacity = '0'; el.style.willChange = 'transform, left, top'; }
  if (englishAttr) prep(singletonEnglish)
  if (readingAttr) prep(singletonReading)

  const rect = element.getBoundingClientRect()
  const vw = window.innerWidth, vh = window.innerHeight
  const gap = 8, margin = 8
  const engRect = englishAttr ? singletonEnglish.getBoundingClientRect() : null
  const readRect = readingAttr ? singletonReading.getBoundingClientRect() : null
  const clampX = (x: number, w: number) => Math.min(Math.max(x, margin), vw - w - margin)

  let layout: 'preferred' | 'stack-below' | 'stack-above' = 'preferred'
  const fitsPreferred = () => {
    if (readRect && rect.top - gap - readRect.height - margin < margin) return false
    if (engRect && rect.bottom + gap + engRect.height + margin > vh) return false
    return true
  }
  if (!fitsPreferred() && engRect && readRect) {
    const totalBelow = rect.bottom + gap + readRect.height + gap + engRect.height + margin
    if (totalBelow <= vh) layout = 'stack-below'
    else {
      const totalAbove = rect.top - gap - readRect.height - gap - engRect.height - margin
      if (totalAbove >= margin) layout = 'stack-above'
      else { singletonReading.style.opacity = '0'; layout = 'stack-below' }
    }
  }

  if (layout === 'preferred') {
    if (readingAttr && readRect) {
      const leftR = clampX(rect.left + rect.width / 2 - readRect.width / 2, readRect.width)
      const topR = Math.max(margin, rect.top - gap - readRect.height)
      singletonReading.style.left = `${leftR}px`; singletonReading.style.top = `${topR}px`; singletonReading.style.opacity = '1'
    } else singletonReading.style.opacity = '0'
    if (englishAttr && engRect) {
      const leftE = clampX(rect.left + rect.width / 2 - engRect.width / 2, engRect.width)
      const topE = Math.min(rect.bottom + gap, vh - engRect.height - margin)
      singletonEnglish.style.left = `${leftE}px`; singletonEnglish.style.top = `${topE}px`; singletonEnglish.style.opacity = '1'
    } else singletonEnglish.style.opacity = '0'
  } else if (layout === 'stack-below') {
    let currentTop = rect.bottom + gap
    if (readingAttr && readRect && singletonReading.style.opacity !== '0') {
      const leftR = clampX(rect.left + rect.width / 2 - readRect.width / 2, readRect.width)
      singletonReading.style.left = `${leftR}px`; singletonReading.style.top = `${currentTop}px`; singletonReading.style.opacity = '1'
      currentTop += readRect.height + gap
    } else singletonReading.style.opacity = '0'
    if (englishAttr && engRect) {
      const leftE = clampX(rect.left + rect.width / 2 - engRect.width / 2, engRect.width)
      singletonEnglish.style.left = `${leftE}px`; singletonEnglish.style.top = `${currentTop}px`; singletonEnglish.style.opacity = '1'
    } else singletonEnglish.style.opacity = '0'
  } else { // stack-above
    let currentBottom = rect.top - gap
    if (englishAttr && engRect) {
      const topE = Math.max(margin, currentBottom - engRect.height)
      const leftE = clampX(rect.left + rect.width / 2 - engRect.width / 2, engRect.width)
      singletonEnglish.style.left = `${leftE}px`; singletonEnglish.style.top = `${topE}px`; singletonEnglish.style.opacity = '1'
      currentBottom = topE - gap
    } else singletonEnglish.style.opacity = '0'
    if (readingAttr && readRect) {
      const topR = Math.max(margin, currentBottom - readRect.height)
      const leftR = clampX(rect.left + rect.width / 2 - readRect.width / 2, readRect.width)
      singletonReading.style.left = `${leftR}px`; singletonReading.style.top = `${topR}px`; singletonReading.style.opacity = '1'
    } else singletonReading.style.opacity = '0'
  }
  console.log('WaniKanify Singleton Layout:', { layout, english: englishAttr, reading: readingAttr, engOpacity: singletonEnglish.style.opacity, readOpacity: singletonReading.style.opacity })
}

function hideSingletonTooltips() {
  if (singletonEnglish) singletonEnglish.style.opacity = '0'
  if (singletonReading) singletonReading.style.opacity = '0'
}

function observeBothTooltips() {
  disconnectMutationObserver()
  if (!singletonEnglish || !singletonReading) return
  mutationObserver = new MutationObserver(() => {
    if (singletonEnglish && frozenEnglishValue !== null && singletonEnglish.textContent !== frozenEnglishValue) {
      console.warn('WaniKanify MutationObserver restoring english', { expected: frozenEnglishValue, actual: singletonEnglish.textContent })
      singletonEnglish.textContent = frozenEnglishValue
    }
    if (singletonReading && frozenReadingValue !== null && singletonReading.textContent !== frozenReadingValue) {
      console.warn('WaniKanify MutationObserver restoring reading', { expected: frozenReadingValue, actual: singletonReading.textContent })
      singletonReading.textContent = frozenReadingValue
    }
  })
  mutationObserver.observe(singletonEnglish, { characterData: true, childList: true, subtree: true })
  mutationObserver.observe(singletonReading, { characterData: true, childList: true, subtree: true })
}

function startVerificationLoop() {
  if (verificationInterval) return
  verificationInterval = window.setInterval(() => {
    if (!activeElement) { stopVerificationLoop(); return }
    if (singletonEnglish && frozenEnglishValue !== null && singletonEnglish.textContent !== frozenEnglishValue) {
      console.warn('WaniKanify Interval restore english', { expected: frozenEnglishValue, actual: singletonEnglish.textContent })
      singletonEnglish.textContent = frozenEnglishValue
    }
    if (singletonReading && frozenReadingValue !== null && singletonReading.textContent !== frozenReadingValue) {
      console.warn('WaniKanify Interval restore reading', { expected: frozenReadingValue, actual: singletonReading.textContent })
      singletonReading.textContent = frozenReadingValue
    }
  }, 120)
}

function stopVerificationLoop() {
  if (verificationInterval) {
    clearInterval(verificationInterval)
    verificationInterval = null
  }
}

function disconnectMutationObserver() {
  if (mutationObserver) {
    mutationObserver.disconnect()
    mutationObserver = null
  }
}

// Legacy function retained for compatibility (no-op under singleton system)
const createOrUpdateTooltip = () => null

// Legacy single-tooltip positioning removed; unified logic above handles both tooltips together.
const positionTooltip = () => { /* no-op (singleton handles positioning) */ }

const showTooltipsForElement = () => { /* no-op */ }
const hideTooltipsForElement = () => { /* no-op */ }

const cleanupTooltipsForElement = () => { /* no-op */ }
