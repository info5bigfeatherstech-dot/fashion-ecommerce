const DEFAULT_CATEGORY_IMAGE = ''

export { DEFAULT_CATEGORY_IMAGE }

function getCategoryImageUrl(category) {
  if (typeof category?.image === 'string' && category.image.trim()) {
    return category.image.trim()
  }

  return category?.image?.url || category?.image?.secure_url || DEFAULT_CATEGORY_IMAGE
}

function getCategorySlug(category) {
  if (category?.slug) return String(category.slug).trim()
  if (category?.name) {
    return String(category.name).trim().toLowerCase().replace(/\s+/g, '-')
  }
  return ''
}

function isActiveCategory(category) {
  if (!category) return false
  if (category.isHidden === true) return false
  return String(category.status || 'active').toLowerCase() !== 'inactive'
}

function isTopLevelCategory(category) {
  const parent = category?.parent
  if (!parent) return true
  if (typeof parent === 'object') return !parent._id && !parent.id
  return false
}

export function mapCircleCategory(category) {
  const slug = getCategorySlug(category)

  return {
    id: category?._id || category?.id || slug,
    label: category?.name || category?.label || 'Category',
    href: slug ? `/shop/${slug}` : '/shop',
    image: getCategoryImageUrl(category),
  }
}

export function mapCircleCategories(categories) {
  const list = Array.isArray(categories) ? categories : []

  return list
    .filter(isActiveCategory)
    .filter(isTopLevelCategory)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map(mapCircleCategory)
}

export function mapMovingFastCategories(categories) {
  const list = Array.isArray(categories) ? categories : []
  return list
    .filter(isActiveCategory)
    .filter((category) => Boolean(getCategoryImageUrl(category)))
    .sort(
      (a, b) =>
        (a.movingFastOrder ?? 0) - (b.movingFastOrder ?? 0) ||
        (a.order ?? 0) - (b.order ?? 0) ||
        String(a.name || '').localeCompare(String(b.name || ''))
    )
    .map(mapCircleCategory)
}
