/**
 * Shared WhatsApp share helpers for admin Customers / Leads / Carts / Wishlists.
 * Messages are context-aware (cart vs wishlist), not random generic copy.
 */

import { getAdminUserDetail } from '@/features/admin/api/analytics'

const STORE_URL = 'https://fabuniqo.com/'
const BRAND_LINE = 'FABUNIQO — Fashion Uniquely Yours'
const MAX_NAMED_ITEMS = 3
const MAX_NAME_LEN = 48

/** @typedef {'cart' | 'wishlist' | 'auto'} WhatsAppShareContext */

export function formatWhatsAppPhone(phone) {
  if (!phone) return ''
  let digits = String(phone).replace(/\D/g, '')
  if (!digits) return ''
  if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1)
  }
  if (digits.length === 10) {
    digits = `91${digits}`
  }
  return digits
}

export function getCustomerPhone(userLike) {
  if (!userLike || typeof userLike !== 'object') return ''
  return (
    userLike.phone
    || userLike.phoneNumber
    || userLike.phone_number
    || ''
  )
}

function cleanDisplayName(name) {
  if (!name) return ''
  const trimmed = String(name).trim()
  if (!trimmed) return ''
  if (['Customer', 'Unnamed', 'Guest User', 'there'].includes(trimmed)) return ''
  return trimmed
}

function truncateLabel(label) {
  const text = String(label || '').trim().replace(/\s+/g, ' ')
  if (!text) return ''
  if (text.length <= MAX_NAME_LEN) return text
  return `${text.slice(0, MAX_NAME_LEN - 1)}…`
}

/**
 * Accepts product name strings or cart/wishlist item objects.
 * @param {unknown} items
 * @returns {string[]}
 */
export function extractProductNames(items) {
  if (!Array.isArray(items)) return []
  const names = []
  const seen = new Set()

  for (const entry of items) {
    let raw = ''
    if (typeof entry === 'string') {
      raw = entry
    } else if (entry && typeof entry === 'object') {
      raw =
        entry.productName
        || entry.name
        || entry.title
        || entry.product?.name
        || entry.productId?.name
        || entry.productId?.title
        || ''
    }
    const label = truncateLabel(raw)
    if (!label) continue
    const key = label.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    names.push(label)
  }

  return names
}

function formatNamedList(names) {
  if (!names.length) return ''
  if (names.length === 1) return `"${names[0]}"`
  if (names.length === 2) return `"${names[0]}" and "${names[1]}"`
  return `"${names[0]}", "${names[1]}" and "${names[2]}"`
}

function withBrandFooter(body) {
  return `${body}\n\n${BRAND_LINE}\n${STORE_URL}`
}

function greeting(name) {
  return name ? `Hi ${name}!` : 'Hi there!'
}

function buildCartMessage(name, productNames, totalCount) {
  const count = Math.max(totalCount || productNames.length, productNames.length)
  const named = productNames.slice(0, MAX_NAMED_ITEMS)
  const extra = Math.max(0, count - named.length)

  if (!named.length) {
    if (count > 0) {
      return withBrandFooter(
        `${greeting(name)} You still have ${count} item${count === 1 ? '' : 's'} waiting in your cart. Ready to complete your order?`
      )
    }
    return withBrandFooter(
      `${greeting(name)} Thanks for shopping with us. Tell us if you need help picking the perfect piece.`
    )
  }

  const list = formatNamedList(named)
  if (count === 1) {
    return withBrandFooter(
      `${greeting(name)} You still have ${list} waiting in your cart. Ready to complete your order?`
    )
  }

  if (extra > 0) {
    return withBrandFooter(
      `${greeting(name)} Your cart has ${list} and ${extra} more item${extra === 1 ? '' : 's'}. Shall we help you complete checkout?`
    )
  }

  return withBrandFooter(
    `${greeting(name)} Your cart has ${list}. Shall we help you complete checkout?`
  )
}

function buildWishlistMessage(name, productNames, totalCount) {
  const count = Math.max(totalCount || productNames.length, productNames.length)
  const named = productNames.slice(0, MAX_NAMED_ITEMS)
  const extra = Math.max(0, count - named.length)

  if (!named.length) {
    if (count > 0) {
      return withBrandFooter(
        `${greeting(name)} You saved ${count} item${count === 1 ? '' : 's'} to your wishlist. Want help finding the right size or style?`
      )
    }
    return withBrandFooter(
      `${greeting(name)} Thanks for your interest in FabUniqo. Reply if you'd like recommendations from our collection.`
    )
  }

  const list = formatNamedList(named)
  if (count === 1) {
    return withBrandFooter(
      `${greeting(name)} You saved ${list} to your wishlist. Want help checking availability or styling tips?`
    )
  }

  if (extra > 0) {
    return withBrandFooter(
      `${greeting(name)} Your wishlist includes ${list} and ${extra} more. Reply if you'd like help choosing or placing an order.`
    )
  }

  return withBrandFooter(
    `${greeting(name)} Your wishlist includes ${list}. Reply if you'd like help choosing or placing an order.`
  )
}

/**
 * @param {{
 *   name?: string,
 *   context?: WhatsAppShareContext,
 *   items?: unknown,
 *   itemCount?: number,
 * }} opts
 */
export function buildWhatsAppMessage({
  name = '',
  context = 'auto',
  items = [],
  itemCount,
} = {}) {
  const cleanName = cleanDisplayName(name)
  const productNames = extractProductNames(items)
  const totalCount =
    Number.isFinite(Number(itemCount)) && Number(itemCount) > 0
      ? Number(itemCount)
      : productNames.length

  if (context === 'wishlist') {
    return buildWishlistMessage(cleanName, productNames, totalCount)
  }

  if (context === 'cart') {
    return buildCartMessage(cleanName, productNames, totalCount)
  }

  // auto: prefer cart wording when items exist, else soft fallback
  if (productNames.length > 0 || totalCount > 0) {
    return buildCartMessage(cleanName, productNames, totalCount)
  }
  return buildCartMessage(cleanName, [], 0)
}

/**
 * @param {object} userLike
 * @param {{
 *   context?: WhatsAppShareContext,
 *   items?: unknown,
 *   itemCount?: number,
 *   message?: string,
 * }} [options]
 */
export function buildWhatsAppShareUrl(userLike, options = {}) {
  const rawPhone = getCustomerPhone(userLike)
  const cleanPhone = formatWhatsAppPhone(rawPhone)
  if (!cleanPhone) return null

  const message =
    options.message
    || buildWhatsAppMessage({
      name: userLike?.name || '',
      context: options.context || 'auto',
      items: options.items,
      itemCount: options.itemCount,
    })

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
}

/**
 * @param {object} userLike
 * @param {{
 *   context?: WhatsAppShareContext,
 *   items?: unknown,
 *   itemCount?: number,
 *   message?: string,
 * }} [options]
 */
export function openWhatsAppShare(userLike, options = {}) {
  const url = buildWhatsAppShareUrl(userLike, options)
  if (!url) return { ok: false, reason: 'no_phone' }
  window.open(url, '_blank', 'noopener,noreferrer')
  return { ok: true }
}

function unwrapUserDetailPayload(payload) {
  if (!payload || typeof payload !== 'object') return { user: null, cart: null, wishlist: null }
  const data = payload.data && typeof payload.data === 'object' ? payload.data : payload
  return {
    user: data.user || null,
    cart: data.cart || null,
    wishlist: data.wishlist || null,
  }
}

function cartItemsFromDetail(cart) {
  if (!cart) return []
  if (Array.isArray(cart.items)) return cart.items
  return []
}

function wishlistItemsFromDetail(wishlist) {
  if (!wishlist) return []
  if (Array.isArray(wishlist.products)) return wishlist.products
  if (Array.isArray(wishlist.items)) return wishlist.items
  return []
}

/**
 * For Customers / Leads rows that only have counts: fetch detail, then open
 * WhatsApp with cart- or wishlist-aware copy.
 *
 * Opens a blank tab synchronously (before await) so popup blockers do not
 * swallow the WhatsApp window after the network round-trip.
 *
 * @param {object} userLike
 * @param {{
 *   context?: WhatsAppShareContext,
 *   userId?: string,
 * }} [options]
 */
export async function openWhatsAppShareWithUserDetail(userLike, options = {}) {
  const phoneUser = {
    ...(userLike || {}),
    phone: getCustomerPhone(userLike),
  }
  if (!formatWhatsAppPhone(getCustomerPhone(phoneUser))) {
    return { ok: false, reason: 'no_phone' }
  }

  const preferredContext = options.context || 'cart'
  const userId = options.userId || userLike?._id || userLike?.id || null

  // Must run in the same user-gesture turn as the click.
  let popup = null
  try {
    popup = window.open('about:blank', '_blank')
  } catch {
    popup = null
  }

  let items = []
  let itemCount = 0
  let context = preferredContext

  if (userId) {
    try {
      const payload = await getAdminUserDetail(userId)
      const { user, cart, wishlist } = unwrapUserDetailPayload(payload)
      if (user?.phone && !phoneUser.phone) {
        phoneUser.phone = user.phone
      }
      if (user?.name && !phoneUser.name) {
        phoneUser.name = user.name
      }

      const cartItems = cartItemsFromDetail(cart)
      const wishItems = wishlistItemsFromDetail(wishlist)
      const cartCount = Number(cart?.itemCount) || cartItems.length
      const wishCount =
        Number(wishlist?.itemCount)
        || wishItems.length
        || (Array.isArray(wishlist?.products) ? wishlist.products.length : 0)

      if (preferredContext === 'wishlist') {
        context = 'wishlist'
        items = wishItems
        itemCount = wishCount
      } else if (preferredContext === 'cart') {
        context = 'cart'
        items = cartItems
        itemCount = cartCount
      } else if (cartCount > 0) {
        context = 'cart'
        items = cartItems
        itemCount = cartCount
      } else if (wishCount > 0) {
        context = 'wishlist'
        items = wishItems
        itemCount = wishCount
      } else {
        context = 'cart'
        items = []
        itemCount = 0
      }
    } catch {
      // Fall through with empty items — still open a branded fallback message.
      context = preferredContext === 'wishlist' ? 'wishlist' : 'cart'
      items = []
      itemCount = 0
    }
  }

  const url = buildWhatsAppShareUrl(phoneUser, { context, items, itemCount })
  if (!url) {
    try { popup?.close() } catch { /* ignore */ }
    return { ok: false, reason: 'no_phone' }
  }

  if (popup && !popup.closed) {
    try {
      popup.opener = null
      popup.location.replace(url)
      return { ok: true }
    } catch {
      try { popup.close() } catch { /* ignore */ }
    }
  }

  window.open(url, '_blank', 'noopener,noreferrer')
  return { ok: true }
}
