import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatPrice(amount, currency = 'INR') {
  const num = Number(amount)
  if (isNaN(num)) return '₹0'
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num)
  } catch {
    return `₹${num}`
  }
}

export function formatDiscount(original, current) {
  if (!original || original <= current) return null
  return Math.round(((original - current) / original) * 100)
}

export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
}

/** First name for nav labels — from firstName or the first word of name. */
export function getUserFirstName(user) {
  if (!user) return ''
  const first = String(user.firstName || '').trim()
  if (first) return first
  const name = String(user.name || '').trim()
  if (!name) return ''
  return name.split(/\s+/)[0] || ''
}

export function getBadgeClass(badge) {
  const map = {
    new: 'badge--new',
    bestseller: 'badge--bestseller',
    limited: 'badge--limited',
    sale: 'badge--sale',
  }
  return map[badge] || 'badge--neutral'
}

export function getBadgeLabel(badge) {
  const map = {
    new: 'New',
    bestseller: 'Bestseller',
    limited: 'Limited',
    sale: 'Sale',
  }
  return map[badge] || badge
}

export function formatCategoryTitle(str) {
  if (!str) return ''
  const s = String(str).trim()

  const knownTitles = {
    'bracelets-bangles': 'Bracelets & Bangles',
    'bracelets and bangles': 'Bracelets & Bangles',
    'bangles': 'Bracelets & Bangles',
    'necklace-pendants': 'Necklace & Pendants',
    'necklace and pendants': 'Necklace & Pendants',
    'necklaces-pendants': 'Necklaces & Pendants',
    'necklace': 'Necklace & Pendants',
    'earrings-studs': 'Earrings & Studs',
    'earrings and studs': 'Earrings & Studs',
    'earings': 'Earrings & Studs',
    'mangalsutras': 'Mangalsutras',
    'rings': 'Rings',
    'sets': 'Sets',
    'gifting': 'Gifting',
    'new-arrivals': 'New Arrivals',
    'sale': 'Sale',
  }

  const lower = s.toLowerCase()
  if (knownTitles[lower]) return knownTitles[lower]

  return s
    .replace(/[-_]+/g, ' ')
    .split(' ')
    .map((word) => {
      if (word.toLowerCase() === 'and' || word === '&') return '&'
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join(' ')
}

/**
 * Block non-numeric keys in phone number inputs (disallows a-z, A-Z, symbols).
 * Allows control keys (Backspace, Tab, Delete, Arrows, Ctrl/Cmd shortcuts).
 */
export function restrictToNumbersKeyDown(e) {
  if (
    e.key === 'Backspace' ||
    e.key === 'Delete' ||
    e.key === 'Tab' ||
    e.key === 'Escape' ||
    e.key === 'Enter' ||
    e.key === 'ArrowLeft' ||
    e.key === 'ArrowRight' ||
    e.key === 'ArrowUp' ||
    e.key === 'ArrowDown' ||
    e.key === 'Home' ||
    e.key === 'End' ||
    e.ctrlKey ||
    e.metaKey
  ) {
    return
  }
  if (!/^\d$/.test(e.key)) {
    e.preventDefault()
    return
  }
  const target = e.target
  if (target && typeof target.value === 'string') {
    const selectedLen = (target.selectionEnd || 0) - (target.selectionStart || 0)
    if (target.value.replace(/\D/g, '').length >= 10 && selectedLen === 0) {
      e.preventDefault()
    }
  }
}
