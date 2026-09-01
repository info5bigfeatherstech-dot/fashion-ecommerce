import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatPrice(amount, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
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
