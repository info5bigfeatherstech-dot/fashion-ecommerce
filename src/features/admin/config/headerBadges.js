/**
 * Registry of storefront header badges managed in Settings → Header badges.
 * Add a new entry here (+ API/hooks) when more badges ship — list UI scales automatically.
 */

export const HEADER_BADGE_IDS = Object.freeze({
  SALE_LIVE: 'sale-live',
  FESTIVE_OFFER: 'festive-offer',
})

/** @type {ReadonlyArray<HeaderBadgeDefinition>} */
export const HEADER_BADGES = Object.freeze([
  {
    id: HEADER_BADGE_IDS.SALE_LIVE,
    /** Same display name as Products → marketing tag “On Sale”. */
    name: 'On Sale',
    shortName: 'On Sale',
    description:
      'Header badge for sale collections. Tag products with On Sale on the Products page. Label below is what shoppers see in the header.',
    productTagLabel: 'On Sale',
    productTagSlug: 'on-sale',
    shopPath: '/shop/sale',
    defaultLabel: 'Sale is live',
    placeholder: 'e.g. Sale is live',
    defaultEnabled: true,
  },
  {
    id: HEADER_BADGE_IDS.FESTIVE_OFFER,
    /** Same display name as Products → marketing tag “Festive offer”. */
    name: 'Festive offer',
    shortName: 'Festive',
    description:
      'Header badge for festive collections. Tag products with Festive offer on the Products page. Label below is what shoppers see in the header.',
    productTagLabel: 'Festive offer',
    productTagSlug: 'festive-offer',
    shopPath: '/shop/festive',
    defaultLabel: 'Festive Offers',
    placeholder: 'e.g. Navratri Special',
    defaultEnabled: false,
  },
])

/**
 * @typedef {{
 *   id: string
 *   name: string
 *   shortName: string
 *   description: string
 *   productTagLabel: string
 *   productTagSlug: string
 *   shopPath: string
 *   defaultLabel: string
 *   placeholder: string
 *   defaultEnabled: boolean
 * }} HeaderBadgeDefinition
 */

/** @param {string} badgeId */
export function getHeaderBadgeDef(badgeId) {
  const id = String(badgeId || '').trim()
  return HEADER_BADGES.find((b) => b.id === id) || null
}

export const HEADER_BADGES_LIST_PATH = '/admin/settings/header-badge'

/** @param {string} badgeId */
export function getHeaderBadgeEditPath(badgeId) {
  return `${HEADER_BADGES_LIST_PATH}/${encodeURIComponent(String(badgeId || '').trim())}`
}
