/**
 * Single shared promise for the Checkout route module.
 * Router lazy() and UI prefetchers must use this so the browser
 * module cache is hit instead of starting a second load.
 */
let checkoutRoutePromise = null

export function prefetchCheckoutRoute() {
  if (!checkoutRoutePromise) {
    checkoutRoutePromise = import('@/routes/Checkout')
  }
  return checkoutRoutePromise
}
