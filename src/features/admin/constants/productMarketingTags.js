/** Admin-controlled ProductTag values (backend ProductTag model enum). */
export const ADMIN_PRODUCT_MARKETING_TAGS = [
  {
    id: 'today-arrival',
    label: "Today's Deal",
    shortLabel: 'Today Deal',
    bulkLabel: "Today's Deal",
    description: 'Shows in the homepage Today’s Deal section when wired on storefront.',
  },
  {
    id: 'jewellery-spotted',
    label: 'Jewellery Spotted',
    shortLabel: 'Spotted',
    bulkLabel: 'Jewellery Spotted',
    description: 'Curated for the Jewellery Spotted homepage gallery.',
  },
  {
    id: 'bestselling-jewelry',
    label: 'Bestselling Jewelry',
    shortLabel: 'Bestseller',
    bulkLabel: 'Bestselling Jewelry',
    description: 'Curated for the Bestselling Jewelry homepage carousel.',
  },
]

export const ADMIN_PRODUCT_MARKETING_TAG_IDS = ADMIN_PRODUCT_MARKETING_TAGS.map((t) => t.id)

export function emptyMarketingTagsState() {
  return Object.fromEntries(ADMIN_PRODUCT_MARKETING_TAG_IDS.map((id) => [id, false]))
}

export function marketingTagsFromProductTags(tags = []) {
  const list = Array.isArray(tags) ? tags : []
  return Object.fromEntries(
    ADMIN_PRODUCT_MARKETING_TAG_IDS.map((id) => [id, list.includes(id)])
  )
}

export function productHasMarketingTag(product, tagId) {
  return Array.isArray(product?.tags) && product.tags.includes(tagId)
}
