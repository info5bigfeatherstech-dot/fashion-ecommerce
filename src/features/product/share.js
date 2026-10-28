/**
 * Canonical PDP share URL — path only, no query/hash (utm, size pickers, etc.).
 */
export function getProductSharePath(slug) {
  const clean = String(slug || '')
    .trim()
    .replace(/^\/+/, '')
    .split(/[?#]/)[0]
  if (!clean) return ''
  return `/product/${encodeURI(clean)}`
}

export function getProductShareUrl(slug) {
  const path = getProductSharePath(slug)
  if (!path) return ''
  if (typeof window === 'undefined' || !window.location?.origin) return path
  return `${window.location.origin}${path}`
}

export function getProductShareText(title, url) {
  const name = String(title || '').trim()
  const link = String(url || '').trim()
  if (name && link) return `${name}\n${link}`
  return name || link
}

export function openShareWindow(href) {
  const url = String(href || '').trim()
  if (!url || typeof window === 'undefined') return
  window.open(url, '_blank', 'noopener,noreferrer')
}

export function buildWhatsAppShareHref(text) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`
}

export function buildFacebookShareHref(url) {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
}

export function buildSmsShareHref(text) {
  return `sms:?&body=${encodeURIComponent(text)}`
}

export function buildTelegramShareHref(url, text) {
  const link = String(url || '').trim()
  const caption = String(text || '').trim()
  const params = new URLSearchParams()
  if (link) params.set('url', link)
  if (caption) params.set('text', caption)
  return `https://t.me/share/url?${params.toString()}`
}
