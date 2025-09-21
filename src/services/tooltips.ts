const DISABLED_CLASS = "wanikanify-tooltips-disabled"
const REPLACEMENT_CONTAINER_SELECTOR = "[data-wanikanify-container='true']"

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

export const initializeTooltipPositioning = (root: Document | Element | null): void => {
  const rootElement = toRootElement(root)
  
  if (!rootElement) {
    return
  }

  // Add event listeners for dynamic tooltip positioning
  const handleMouseEnter = (event: Event) => {
    const target = event.target as HTMLElement
    if (!target?.classList?.contains('wanikanify-replacement')) {
      return
    }

    requestAnimationFrame(() => {
      positionTooltipsForElement(target)
    })
  }

  const handleScroll = () => {
    // Reposition all visible tooltips on scroll
    const activeTooltips = rootElement.querySelectorAll('.wanikanify-replacement:hover')
    activeTooltips.forEach((element) => {
      requestAnimationFrame(() => {
        positionTooltipsForElement(element as HTMLElement)
      })
    })
  }

  const handleResize = () => {
    // Reposition all tooltips on window resize
    const allTooltips = rootElement.querySelectorAll('.wanikanify-replacement')
    allTooltips.forEach((element) => {
      requestAnimationFrame(() => {
        positionTooltipsForElement(element as HTMLElement)
      })
    })
  }

  rootElement.addEventListener('mouseenter', handleMouseEnter, { capture: true, passive: true })
  window.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('resize', handleResize, { passive: true })
}

const positionTooltipsForElement = (element: HTMLElement): void => {
  try {
    const rect = element.getBoundingClientRect()
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    }

    // Clear previous positioning classes and styles
    element.classList.remove('tooltip-bottom-top', 'tooltip-top-bottom', 'tooltip-align-left', 'tooltip-align-right')
    element.style.removeProperty('--tooltip-x')
    element.style.removeProperty('--tooltip-bottom-y')
    element.style.removeProperty('--tooltip-top-y')
    element.style.removeProperty('--tooltip-transform')

    // Ensure element is visible on screen
    if (rect.width === 0 || rect.height === 0) {
      return
    }

    // Calculate positioning for tooltips using fixed positioning
    const elementCenterX = rect.left + (rect.width / 2)
    const elementTop = rect.top
    const elementBottom = rect.bottom

    // Check if element has original text data (bottom tooltip)
    const hasOriginalText = element.getAttribute('data-wanikanify-original')
    if (hasOriginalText && hasOriginalText.trim()) {
      const tooltipHeight = 35
      const spaceBelow = viewport.height - elementBottom
      
      // Calculate Y position for bottom tooltip
      let tooltipY: number
      if (spaceBelow < tooltipHeight + 10 && elementTop > tooltipHeight + 10) {
        // Position above the element
        tooltipY = elementTop - 10
        element.style.setProperty('--tooltip-bottom-y', `${tooltipY}px`)
        element.classList.add('tooltip-bottom-top')
      } else {
        // Position below the element (default)
        tooltipY = elementBottom + 10
        element.style.setProperty('--tooltip-bottom-y', `${tooltipY}px`)
      }
    }

    // Check if element has reading data (top tooltip)
    const hasReading = element.getAttribute('data-wanikanify-reading')
    if (hasReading && hasReading.trim()) {
      const tooltipHeight = 30
      const spaceAbove = elementTop
      
      // Calculate Y position for top tooltip
      let tooltipY: number
      if (spaceAbove < tooltipHeight + 10 && viewport.height - elementBottom > tooltipHeight + 10) {
        // Position below the element
        tooltipY = elementBottom + 10
        element.style.setProperty('--tooltip-top-y', `${tooltipY}px`)
        element.classList.add('tooltip-top-bottom')
      } else {
        // Position above the element (default)
        tooltipY = elementTop - 10
        element.style.setProperty('--tooltip-top-y', `${tooltipY}px`)
      }
    }

    // Handle horizontal positioning
    const tooltipEstimatedWidth = Math.max(
      hasOriginalText ? Math.min(hasOriginalText.length * 8, 300) : 0,
      hasReading ? Math.min(hasReading.length * 7, 250) : 0
    )
    const tooltipHalfWidth = tooltipEstimatedWidth / 2
    const margin = 10

    let tooltipX: number
    let transform: string

    // Check if centered tooltip would overflow
    if (elementCenterX - tooltipHalfWidth < margin) {
      // Align to left edge
      tooltipX = margin
      transform = 'translateY(0)'
      element.classList.add('tooltip-align-left')
    } else if (elementCenterX + tooltipHalfWidth > viewport.width - margin) {
      // Align to right edge
      tooltipX = viewport.width - margin
      transform = 'translate(-100%, 0)'
      element.classList.add('tooltip-align-right')
    } else {
      // Center on element
      tooltipX = elementCenterX
      transform = 'translate(-50%, 0)'
    }

    element.style.setProperty('--tooltip-x', `${tooltipX}px`)
    element.style.setProperty('--tooltip-transform', transform)

  } catch (error) {
    // Silently handle any positioning errors to avoid breaking text replacement
    console.debug('WaniKanify: tooltip positioning error', error)
  }
}
