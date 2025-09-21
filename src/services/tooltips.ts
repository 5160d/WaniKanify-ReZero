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
