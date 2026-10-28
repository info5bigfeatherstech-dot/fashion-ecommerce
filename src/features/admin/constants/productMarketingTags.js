/** Admin-controlled ProductTag values (backend ProductTag model enum). */
export const ADMIN_PRODUCT_MARKETING_TAGS = [
  {
    id: 'on-sale',
    label: 'On Sale',
    shortLabel: 'On Sale',
    bulkLabel: 'On Sale',
    chipClass: 'admin-product-tags__chip--on-sale',
    description:
      'Shows under the header On Sale badge (/shop/sale). Add On-sale price on every variant first. Badge name is set in Settings → Header badges.',
  },
  {
    id: 'today-arrival',
    label: "Today's Deal",
    shortLabel: 'Today Deal',
    bulkLabel: "Today's Deal",
    chipClass: 'admin-product-tags__chip--today-arrival',
    description: 'Shows in the homepage Today’s Deal section.',
  },
  {
    id: 'jewellery-spotted',
    label: 'Jewellery Spotted',
    shortLabel: 'Spotted',
    bulkLabel: 'Jewellery Spotted',
    chipClass: 'admin-product-tags__chip--jewellery-spotted',
    description: 'Shows in the Jewellery Spotted homepage gallery.',
  },
  {
    id: 'bestselling-jewelry',
    label: 'Bestselling Jewelry',
    shortLabel: 'Bestseller',
    bulkLabel: 'Bestselling Jewelry',
    chipClass: 'admin-product-tags__chip--bestselling-jewelry',
    description: 'Shows in the Bestselling Jewelry homepage carousel.',
  },
  {
    id: 'festive-offer',
    label: 'Festive offer',
    shortLabel: 'Festive',
    bulkLabel: 'Festive offer',
    chipClass: 'admin-product-tags__chip--festive-offer',
    description:
      'Shows under the header Festive offer badge (/shop/festive). Badge name is set in Settings → Header badges.',
  },
]

export const ADMIN_PRODUCT_MARKETING_TAG_IDS = ADMIN_PRODUCT_MARKETING_TAGS.map((t) => t.id)

export function emptyMarketingTagsState() {
  return Object.fromEntries(ADMIN_PRODUCT_MARKETING_TAG_IDS.map((id) => [id, false]))
}

export function marketingTagsFromProductTags(tags = []) {
  try {
    const list = Array.isArray(tags) ? tags : []
    return Object.fromEntries(
      ADMIN_PRODUCT_MARKETING_TAG_IDS.map((id) => [id, list.includes(id)])
    )
  } catch {
    return emptyMarketingTagsState()
  }
}

export function productHasMarketingTag(product, tagId) {
  try {
    return Array.isArray(product?.tags) && product.tags.includes(tagId)
  } catch {
    return false
  }
}
