/**
 * Shared WhatsApp share helpers for admin Leads / Carts / Wishlists.
 * Matches Customers tab behaviour: wa.me + prefilled message.
 */

const STORE_URL = 'https://fabuniqo.com/'

const RANDOM_WHATSAPP_MESSAGES = [
  (name) =>
    `Hello ${name || 'there'}!  Thank you for checking out our store. How can we assist you with your shopping today?`,
  (name) =>
    `Hi ${name || 'there'}!  We noticed your interest in our collection. Let us know if you need any recommendations or details!`,
  (name) =>
    `Hello ${name || 'there'}!  We have special offers running on our top styles today. Feel free to reply if you'd like to explore!`,
  (name) =>
    `Hi ${name || 'there'}!  Thanks for visiting us. If you have any questions about sizing, orders, or delivery, we are here to help!`,
  (name) =>
    `Hello ${name || 'there'}! Hope you're having a wonderful day. Let us know if we can help you find anything special today!`,
]

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

export function buildWhatsAppShareUrl(userLike) {
  const name = userLike?.name || ''
  const rawPhone = getCustomerPhone(userLike)
  const cleanPhone = formatWhatsAppPhone(rawPhone)
  if (!cleanPhone) return null

  const cleanName = name && name !== 'Customer' && name !== 'Unnamed' && name !== 'Guest User'
    ? String(name).trim()
    : ''
  const template =
    RANDOM_WHATSAPP_MESSAGES[Math.floor(Math.random() * RANDOM_WHATSAPP_MESSAGES.length)]
  const message = template(cleanName) + '\n\n' + STORE_URL
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
}

export function openWhatsAppShare(userLike) {
  const url = buildWhatsAppShareUrl(userLike)
  if (!url) return { ok: false, reason: 'no_phone' }
  window.open(url, '_blank', 'noopener,noreferrer')
  return { ok: true }
}
