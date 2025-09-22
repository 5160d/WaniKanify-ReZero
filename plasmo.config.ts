import type { PlasmoCSConfig } from "plasmo"

// Ensure locales directory is treated as static asset root.
// According to Plasmo docs, accepted locale directories include /locales.
// Authoritative locale catalog now stored under /locales (Plasmo copies this to _locales in the packaged build).
export default {
  // Copy any static assets - by placing our messages under /locales we align with Plasmo expectations.
} as const
