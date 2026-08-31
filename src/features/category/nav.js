import { formatCategoryTitle } from '@/lib/utils'

/**
 * Storefront nav helpers — map public API categories into header/footer links.
 * Categories are already filtered (active, top-level) by mapCircleCategories.
 */

export function slugFromShopHref(href) {
  const match = String(href || '').match(/\/shop\/([^/?#]+)/i)
  return match?.[1] ? decodeURIComponent(match[1]) : ''
}

/**
 * @param {Array<{ id?: string, label: string, href: string }>} categories
 * @returns {Array<{ label: string, slug: string, href?: string, megaMenu: boolean }>}
 */
export function buildHeaderNavItems(categories = []) {
  const home = { label: 'Home', slug: 'home', megaMenu: false }
  const seen = new Set(['home'])
  const items = []

  for (const category of Array.isArray(categories) ? categories : []) {
    const label = String(category?.label || '').trim()
    const href = String(category?.href || '').trim()
    if (!label || !href.startsWith('/shop/')) continue

    const slug = slugFromShopHref(href)
    if (!slug || seen.has(slug)) continue

    seen.add(slug)
    items.push({
      label,
      slug,
      href,
      megaMenu: false,
    })
  }

  items.push({
    label: 'Gifting',
    slug: 'gifting',
    href: '/gifting',
    megaMenu: false,
  })

  return [home, ...items]
}

/**
 * @param {Array<{ label: string, href: string }>} categories
 * @returns {Array<{ label: string, href: string }>}
 */
export function buildFooterShopLinks(categories = []) {
  const seen = new Set()
  const links = []

  for (const category of Array.isArray(categories) ? categories : []) {
    const label = String(category?.label || '').trim()
    const href = String(category?.href || '').trim()
    if (!label || !href.startsWith('/shop/')) continue

    const key = href.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    links.push({ label, href })
  }

  return links
}

/**
 * Resolve a shop page title from API categories when CATEGORY_TREE has no entry.
 */
export function findCategoryLabel(categories = [], slug) {
  if (!slug) return null
  const needle = String(slug).toLowerCase()
  const match = (Array.isArray(categories) ? categories : []).find((item) => {
    const itemSlug = slugFromShopHref(item?.href)
    return itemSlug.toLowerCase() === needle
  })
  return match?.label ? formatCategoryTitle(match.label) : formatCategoryTitle(slug)
}
