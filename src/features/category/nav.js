import { formatCategoryTitle } from '@/lib/utils'

/**
 * Storefront nav helpers — map public API categories into header/footer links.
 * Categories keep admin `order` from mapCircleCategories (never shuffled).
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
 * Resolve Shop-by-Occasion panel → live backend category href.
 * Matches admin category slug/label; falls back to panel.href.
 */
export function resolveOccasionCategoryHref(panel, categories = []) {
  try {
    const list = Array.isArray(categories) ? categories : []
    const matchKey = String(panel?.categoryMatch || '').trim().toLowerCase()
    const fallback = String(panel?.href || '/shop').trim() || '/shop'
    if (!list.length || !matchKey) return fallback

    const normalize = (value) =>
      String(value || '')
        .toLowerCase()
        .replace(/&/g, ' and ')
        .replace(/[^a-z0-9]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()

    const rules = {
      'earrings-studs': {
        slugIncludes: ['earing', 'earring', 'stud'],
        labelIncludes: ['earring', 'earing', 'stud'],
      },
      'necklace-sets': {
        slugIncludes: ['necklace-set', 'necklace-sets', 'necklace_set'],
        labelIncludes: ['necklace set', 'necklace sets'],
        // Prefer "sets" over generic necklace & pendants
        labelPrefer: ['set'],
        slugPrefer: ['set'],
        slugAvoid: ['pendant'],
        labelAvoid: ['pendant'],
      },
      'bracelets-bangles': {
        slugIncludes: ['bracelet', 'bangle'],
        labelIncludes: ['bracelet', 'bangle'],
      },
    }

    const rule = rules[matchKey]
    if (!rule) return fallback

    const scored = []
    for (const cat of list) {
      const slug = normalize(cat?.slug || slugFromShopHref(cat?.href))
      const label = normalize(cat?.label || cat?.name)
      const slugRaw = String(cat?.slug || slugFromShopHref(cat?.href) || '').toLowerCase()
      const labelRaw = String(cat?.label || cat?.name || '').toLowerCase()

      const slugHit = (rule.slugIncludes || []).some((p) => slug.includes(normalize(p)) || slugRaw.includes(p))
      const labelHit = (rule.labelIncludes || []).some((p) => label.includes(normalize(p)) || labelRaw.includes(p))
      if (!slugHit && !labelHit) continue

      if ((rule.slugAvoid || []).some((p) => slugRaw.includes(p) || slug.includes(normalize(p)))) {
        // still allow if clearly a "set" preference hit
        const preferOk =
          (rule.slugPrefer || []).some((p) => slugRaw.includes(p)) ||
          (rule.labelPrefer || []).some((p) => label.includes(normalize(p)))
        if (!preferOk) continue
      }
      if ((rule.labelAvoid || []).some((p) => labelRaw.includes(p)) &&
          !(rule.labelPrefer || []).some((p) => label.includes(normalize(p)))) {
        continue
      }

      let score = 0
      if (slugHit) score += 2
      if (labelHit) score += 2
      if ((rule.slugPrefer || []).some((p) => slugRaw.includes(p))) score += 3
      if ((rule.labelPrefer || []).some((p) => label.includes(normalize(p)))) score += 3

      const href = String(cat?.href || '').startsWith('/shop/')
        ? cat.href
        : slugRaw
          ? `/shop/${slugRaw}`
          : ''
      if (!href) continue
      scored.push({ href, score, order: Number(cat?.order) || 0 })
    }

    if (!scored.length) return fallback
    scored.sort((a, b) => b.score - a.score || a.order - b.order)
    return scored[0].href
  } catch {
    return String(panel?.href || '/shop')
  }
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
