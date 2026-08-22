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
  }
  return map[badge] || 'badge--neutral'
}

export function getBadgeLabel(badge) {
  const map = {
    new: 'New',
    bestseller: 'Bestseller',
    limited: 'Limited',
  }
  return map[badge] || badge
}
