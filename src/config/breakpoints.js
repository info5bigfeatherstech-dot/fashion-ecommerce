/**
 * Shared responsive breakpoints — mobile-first.
 * Mirror values in globals.css :root (--bp-*).
 *
 * Mobile:  360–428px (base styles)
 * Tablet:  768–1024px
 * Desktop: 1280px+
 * XL:      1536px+ (max content width cap)
 */
export const BREAKPOINTS = {
  tablet: 768,
  desktop: 1280,
  xl: 1536,
}

export const MEDIA_QUERIES = {
  tablet: `(min-width: ${BREAKPOINTS.tablet}px)`,
  desktop: `(min-width: ${BREAKPOINTS.desktop}px)`,
  xl: `(min-width: ${BREAKPOINTS.xl}px)`,
  mobileOnly: `(max-width: ${BREAKPOINTS.tablet - 1}px)`,
  tabletOnly: `(min-width: ${BREAKPOINTS.tablet}px) and (max-width: ${BREAKPOINTS.desktop - 1}px)`,
  belowDesktop: `(max-width: ${BREAKPOINTS.desktop - 1}px)`,
}
