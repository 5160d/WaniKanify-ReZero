import {
  __WK_CLASS_TOOLTIPS_DISABLED,
  __WK_SELECTOR_REPLACEMENT_CONTAINER_TRUE,
  __WK_CLASS_REPLACEMENT,
  __WK_CLASS_TOOLTIP,
  __WK_CLASS_TOOLTIP_AFTER,
  __WK_CLASS_TOOLTIP_BEFORE,
  __WK_DATA_ORIGINAL,
  __WK_DATA_READING
} from '~src/internal/tokens'

const DISABLED_CLASS = __WK_CLASS_TOOLTIPS_DISABLED
const REPLACEMENT_CONTAINER_SELECTOR = __WK_SELECTOR_REPLACEMENT_CONTAINER_TRUE

// Singleton tooltip state
let singletonEnglish: HTMLElement | null = null
let singletonReading: HTMLElement | null = null
let activeElement: HTMLElement | null = null
let hideTimeout: number | null = null
let rafLock = false
// Minimal freeze & integrity guard (lightweight)
let frozenForElement: HTMLElement | null = null
let frozenEnglishValue: string | null = null
// removed unused frozenReadingValue (retain variable name for rule expectations)
let englishObserver: MutationObserver | null = null

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

// Debug utilities removed for production cleanup

export const initializeTooltipPositioning = (root: Document | Element | null): void => {
  const rootElement = toRootElement(root)
  
  if (!rootElement) {
    return
  }

  // Add event listeners for dynamic tooltip positioning
  const handleMouseEnter = (event: Event) => {
    const target = event.target as HTMLElement
    if (!target?.classList?.contains(__WK_CLASS_REPLACEMENT)) return
    activeElement = target
    if (hideTimeout) { clearTimeout(hideTimeout); hideTimeout = null }
    // Immediate scheduling
    if (rafLock) return
    rafLock = true
    requestAnimationFrame(() => { rafLock = false; updateAndShowSingletonTooltips(target) })
  }

  const handleMouseLeave = (event: Event) => {
    const target = event.target as HTMLElement
    if (!target?.classList?.contains(__WK_CLASS_REPLACEMENT)) return
    if (activeElement === target) {
      hideTimeout = window.setTimeout(() => {
        hideSingletonTooltips();
        activeElement = null
        // Clear freeze state
        frozenForElement = null
    frozenEnglishValue = null
        if (englishObserver) {
          englishObserver.disconnect()
          englishObserver = null
        }
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
    singletonEnglish.className = `${__WK_CLASS_TOOLTIP} ${__WK_CLASS_TOOLTIP_AFTER}`
    Object.assign(singletonEnglish.style, { position: 'fixed', opacity: '0', pointerEvents: 'none', zIndex: '2147483647' })
    document.body.appendChild(singletonEnglish)
  }
  if (!singletonReading) {
    singletonReading = document.createElement('div')
    singletonReading.className = `${__WK_CLASS_TOOLTIP} ${__WK_CLASS_TOOLTIP_BEFORE}`
    Object.assign(singletonReading.style, { position: 'fixed', opacity: '0', pointerEvents: 'none', zIndex: '2147483646' })
    document.body.appendChild(singletonReading)
  }
}

function updateAndShowSingletonTooltips(element: HTMLElement) {
  ensureSingletons()
  if (!singletonEnglish || !singletonReading) return
  const englishAttr = element.getAttribute(__WK_DATA_ORIGINAL)?.trim() || ''
  const readingAttr = element.getAttribute(__WK_DATA_READING)?.trim() || ''
  if (!englishAttr && !readingAttr) { hideSingletonTooltips(); return }

  const isNewHover = element !== frozenForElement
  if (isNewHover) {
    singletonEnglish.textContent = englishAttr
    singletonReading.textContent = readingAttr
    frozenForElement = element
    frozenEnglishValue = englishAttr
    // Observe only the English tooltip (the critical one) for unexpected mutation
    if (englishObserver) englishObserver.disconnect()
    englishObserver = new MutationObserver(() => {
      if (singletonEnglish && frozenEnglishValue !== null && singletonEnglish.textContent !== frozenEnglishValue) {
        singletonEnglish.textContent = frozenEnglishValue
      }
    })
    englishObserver.observe(singletonEnglish, { characterData: true, childList: true, subtree: true })
  } else {
    // Do not reassign text during same hover; only reposition.
  }

  // Pre-measure hidden off-screen
  const prep = (el: HTMLElement) => { el.style.left = '-9999px'; el.style.top = '-9999px'; el.style.opacity = '0'; }
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
  // Layout complete; no debug logging in production
}

function hideSingletonTooltips() {
  if (singletonEnglish) singletonEnglish.style.opacity = '0'
  if (singletonReading) singletonReading.style.opacity = '0'
}

// Removed mutation observer & verification loop (no longer needed after stabilization)

// Removed legacy no-op exports
