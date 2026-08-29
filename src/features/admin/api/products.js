import { API_ENDPOINTS } from '@/api/endpoints'
import { buildVariantCatalogApiPayload } from '@/lib/variantCatalogForm'
import {
  adminDelete,
  adminGet,
  adminGetBlob,
  adminPatch,
  adminPost,
  adminPut,
  downloadBlob,
  unwrapAdmin,
} from './client'

export async function getAdminProductsAll({ signal, page = 1, limit = 50, search = '' } = {}) {
  const params = { page, limit }
  if (String(search || '').trim()) params.search = String(search).trim()
  const payload = await adminGet(API_ENDPOINTS.admin.productsAll, { signal, params })
  return payload
}

export async function getAdminProductsActiveCount({ signal } = {}) {
  const payload = await adminGet(API_ENDPOINTS.admin.productsActive, { signal })
  return unwrapAdmin(payload)
}

export async function getAdminProductsLowStock({ signal, page = 1, limit = 100 } = {}) {
  const payload = await adminGet(API_ENDPOINTS.admin.productsLowStock, {
    signal,
    params: { page, limit },
  })
  return unwrapAdmin(payload)
}

export async function getAdminProductsArchived({ signal, page = 1, limit = 50 } = {}) {
  const payload = await adminGet(API_ENDPOINTS.admin.productsArchived, {
    signal,
    params: { page, limit },
  })
  return payload
}

export {
  getAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
  reorderAdminCategories,
  toggleAdminCategoryVisibility,
  getCategoryImageUrl,
  normalizeAdminCategoriesPayload,
  sortAdminCategories,
} from './categories'

export async function exportAdminProducts() {
  const response = await adminGetBlob(API_ENDPOINTS.admin.productsExport)
  const contentType = String(response.headers['content-type'] || '')
  if (contentType.includes('application/json')) {
    const text = await response.data.text()
    let msg = 'Export failed'
    try {
      msg = JSON.parse(text)?.message || msg
    } catch {
      /* ignore */
    }
    throw new Error(msg)
  }
  const today = new Date().toISOString().slice(0, 10)
  downloadBlob(response.data, `products_export_${today}.xlsx`)
}

export async function createAdminProduct(formData) {
  const axiosClient = (await import('@/api/axiosClient')).default
  const response = await axiosClient.request({
    method: 'POST',
    url: API_ENDPOINTS.admin.productsCreate,
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' },
    useAdminAuth: true,
  })
  return unwrapAdmin(response.data)
}

export async function getAdminProductBySlug(slug, { signal } = {}) {
  const payload = await adminGet(API_ENDPOINTS.admin.productBySlug(slug), { signal })
  const unwrapped = unwrapAdmin(payload)
  return unwrapped?.product || unwrapped?.data || unwrapped
}

export async function updateAdminProduct(slug, formData) {
  const axiosClient = (await import('@/api/axiosClient')).default
  const response = await axiosClient.request({
    method: 'PUT',
    url: API_ENDPOINTS.admin.productBySlug(slug),
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' },
    useAdminAuth: true,
  })
  return unwrapAdmin(response.data)
}

/** Product-level update FormData (edit mode) — mirrors fabFE updateProduct.
 *  Do NOT send variants here. Variant price/images/wholesale are saved via
 *  updateAdminProductVariant (PUT with productCode), otherwise the API can
 *  reject with "Wholesale storefront is active but no eligible wholesale variant…"
 *  and images never upload.
 */
export function buildUpdateProductFormData(pd) {
  const fd = new FormData()
  if (pd.name) fd.append('name', pd.name)
  if (pd.title) fd.append('title', pd.title)
  if (pd.description) fd.append('description', pd.description)
  if (pd.category) fd.append('category', pd.category)
  if (pd.brand) fd.append('brand', pd.brand)
  if (pd.isFeatured !== undefined) fd.append('isFeatured', String(Boolean(pd.isFeatured)))
  if (pd.status) fd.append('status', pd.status)
  if (pd.hsnCode) fd.append('hsnCode', pd.hsnCode)
  if (pd.taxRate !== undefined && pd.taxRate !== '') fd.append('gstRate', String(pd.taxRate))
  if (pd.isFragile !== undefined) fd.append('isFragile', String(Boolean(pd.isFragile)))

  fd.append('shipping', JSON.stringify({
    ...(pd.shipping || {}),
    weight: pd.shipping?.weight || 0,
    dimensions: pd.shipping?.dimensions || { length: 0, width: 0, height: 0 },
  }))
  fd.append('soldInfo', JSON.stringify(pd.soldInfo || { enabled: false, count: 0 }))
  fd.append('fomo', JSON.stringify(pd.fomo || { enabled: false }))
  // Always send attributes (even []) so clearing the last attribute persists
  fd.append('attributes', JSON.stringify(pd.attributes || []))

  return fd
}

export async function archiveAdminProduct(slug) {
  const payload = await adminDelete(API_ENDPOINTS.admin.productBySlug(slug))
  return unwrapAdmin(payload)
}

export async function restoreAdminProduct(slug) {
  const payload = await adminPatch(API_ENDPOINTS.admin.productRestore(slug))
  const unwrapped = unwrapAdmin(payload)
  // Prefer explicit product from restore response so the UI can re-insert it.
  const product = unwrapped?.product || payload?.product || null
  return product ? { ...(typeof unwrapped === 'object' ? unwrapped : {}), product } : unwrapped
}

export async function hardDeleteAdminProduct(slug) {
  const payload = await adminDelete(API_ENDPOINTS.admin.productHardDelete(slug))
  return unwrapAdmin(payload)
}

export async function toggleAdminProductFeatured(slug, isFeatured) {
  const payload = await adminPut(API_ENDPOINTS.admin.productBySlug(slug), { isFeatured })
  return unwrapAdmin(payload)
}

export async function bulkUpdateAdminProductStatus({ slugs, channel, status }) {
  const channelStatus = channel === 'wholesale' ? { wholesale: status } : { ecomm: status }
  const payload = await adminPatch(API_ENDPOINTS.admin.productsBulkStatus, {
    slugs,
    channelStatus,
  })
  return unwrapAdmin(payload)
}

export async function bulkUpdateAdminProductFlags({ slugs, flagType, value }) {
  const payload = await adminPut(API_ENDPOINTS.admin.productsUpdateFlags, {
    slugs,
    flagType,
    value,
  })
  return unwrapAdmin(payload)
}

export async function downloadAdminBulkUploadTemplate() {
  const response = await adminGetBlob(API_ENDPOINTS.admin.productsBulkTemplate)
  downloadBlob(response.data, 'bulk_upload_template.xlsx')
}

export async function previewAdminBulkCsv(formData) {
  const axiosClient = (await import('@/api/axiosClient')).default
  const response = await axiosClient.request({
    method: 'POST',
    url: API_ENDPOINTS.admin.productsPreviewCsv,
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' },
    useAdminAuth: true,
  })
  return unwrapAdmin(response.data)
}

export async function importAdminBulkCsv(formData) {
  const axiosClient = (await import('@/api/axiosClient')).default
  const response = await axiosClient.request({
    method: 'POST',
    url: API_ENDPOINTS.admin.productsImportCsv,
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' },
    useAdminAuth: true,
  })
  return unwrapAdmin(response.data)
}

export async function importAdminBulkWithZip(formData) {
  const axiosClient = (await import('@/api/axiosClient')).default
  const response = await axiosClient.request({
    method: 'POST',
    url: API_ENDPOINTS.admin.productsBulkNew,
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' },
    useAdminAuth: true,
    timeout: 300000,
  })
  return unwrapAdmin(response.data)
}

export function buildProductFormData(values, { isEdit = false } = {}) {
  const fd = new FormData()
  if (values.name) fd.append('name', values.name)
  if (values.title) fd.append('title', values.title)
  if (values.description) fd.append('description', values.description)
  if (values.category) fd.append('category', values.category)
  fd.append('brand', values.brand || 'Generic')
  fd.append('status', values.status || 'draft')
  fd.append('isFeatured', String(Boolean(values.isFeatured)))
  if (values.hsnCode) fd.append('hsnCode', values.hsnCode)
  if (values.taxRate !== '' && values.taxRate != null) fd.append('gstRate', String(values.taxRate))

  const productCode = String(values.ProductCode || '').trim().toUpperCase()
  if (!isEdit && !productCode) {
    throw new Error('Product code is required (format BASE-N, e.g. 3897-1)')
  }

  const base = Number(values.basePrice)
  if (!Number.isFinite(base) || base <= 0) {
    throw new Error('Base price is required and must be greater than 0')
  }
  const saleRaw = values.salePrice !== '' && values.salePrice != null ? Number(values.salePrice) : null

  fd.append('shipping', JSON.stringify({
    weight: Number(values.weight) || 0,
    dimensions: { length: 0, width: 0, height: 0 },
  }))
  fd.append('soldInfo', JSON.stringify({ enabled: false, count: 0 }))
  fd.append('fomo', JSON.stringify({ enabled: false }))

  const primaryVariant = {
    productCode,
    attributes: [],
    price: { base, sale: saleRaw },
    inventory: {
      quantity: Number(values.quantity) || 0,
      lowStockThreshold: Number(values.lowStockThreshold) || 5,
      trackInventory: true,
    },
    isActive: true,
    wholesale: false,
    minimumOrderQuantity: 1,
    channelVisibility: { ecomm: 'active', wholesale: 'draft' },
  }
  fd.append('variants', JSON.stringify([primaryVariant]))

  if (!isEdit && values.imageFile instanceof File) {
    fd.append('variantImages_0', values.imageFile)
  }

  return fd
}

const toNum = (raw) => {
  if (raw === '' || raw === null || raw === undefined) return undefined
  const n = parseFloat(raw)
  return Number.isNaN(n) ? undefined : n
}

const SUFFIXED_PRODUCT_CODE_REGEX = /^([A-Z0-9]+)-(\d+)$/

function buildPriceObj(price, label = 'Base price') {
  const base = toNum(price?.base)
  if (base === undefined) throw new Error(`${label} is required`)
  if (base <= 0) throw new Error(`${label} must be greater than 0`)
  const saleRaw = toNum(price?.sale)
  const sale = price?.sale !== '' && price?.sale != null && saleRaw !== undefined ? saleRaw : null
  const priceObj = { base, sale }

  // wholesaleBase / wholesaleSale must live inside price (backend contract)
  if (price?.wholesaleBase !== undefined && price?.wholesaleBase !== '') {
    priceObj.wholesaleBase = toNum(price.wholesaleBase) || 0
  } else if (typeof price?.wholesaleBase === 'number') {
    priceObj.wholesaleBase = price.wholesaleBase
  }
  if (price?.wholesaleSale !== undefined && price?.wholesaleSale !== '') {
    priceObj.wholesaleSale = toNum(price.wholesaleSale) ?? null
  } else if (price?.wholesaleSale === null) {
    priceObj.wholesaleSale = null
  }

  return priceObj
}

function buildInventoryObj(inv) {
  return {
    quantity: parseInt(inv?.quantity, 10) || 0,
    lowStockThreshold: parseInt(inv?.lowStockThreshold, 10) || 5,
    trackInventory: inv?.trackInventory !== false,
  }
}

function normalizeProductCode(rawCode, label = 'ProductCode') {
  const code = String(rawCode ?? '').trim().toUpperCase()
  if (!code) throw new Error(`${label} is required`)
  const m = code.match(SUFFIXED_PRODUCT_CODE_REGEX)
  if (!m) throw new Error(`${label} must be in BASE-N format (e.g., 3897-1 or 3897-01)`)
  const seq = Number(m[2])
  if (!Number.isInteger(seq) || seq < 1) {
    throw new Error(`${label} suffix must be a whole number ≥ 1`)
  }
  return `${m[1]}-${seq}`
}

export function buildCreateProductFormData(productData) {
  const fd = new FormData()

  if (productData.name) fd.append('name', productData.name)
  if (productData.title) fd.append('title', productData.title)
  if (productData.description) fd.append('description', productData.description)
  if (productData.category) fd.append('category', productData.category)
  if (productData.brand) fd.append('brand', productData.brand)
  fd.append('status', productData.status || 'draft')
  fd.append('isFeatured', String(Boolean(productData.isFeatured)))
  if (productData.hsnCode) fd.append('hsnCode', productData.hsnCode)
  if (productData.taxRate !== undefined && productData.taxRate !== '') {
    fd.append('gstRate', String(productData.taxRate))
  }
  if (productData.isFragile !== undefined) fd.append('isFragile', String(productData.isFragile))

  const shippingData = {
    ...productData.shipping,
    weight: productData.shipping?.weight || 0,
    dimensions: productData.shipping?.dimensions || { length: 0, width: 0, height: 0 },
  }
  fd.append('shipping', JSON.stringify(shippingData))
  fd.append('soldInfo', JSON.stringify(productData.soldInfo || { enabled: false, count: 0 }))
  fd.append('fomo', JSON.stringify(productData.fomo || { enabled: false }))
  if (productData.attributes?.length) fd.append('attributes', JSON.stringify(productData.attributes))

  const productImageFiles = (productData.images || []).filter((img) => img.file instanceof File)
  productImageFiles.forEach((img) => fd.append('images', img.file))

  const priceData = {
    base: productData.price?.base,
    sale: productData.price?.sale,
  }
  if (productData.wholesale) {
    priceData.wholesaleBase = productData.wholesaleBase
    priceData.wholesaleSale = productData.wholesaleSale
  }
  const primaryPrice = buildPriceObj(priceData, 'Main variant base price')

  const extraVariants = []
  const normalizedVariantCodes = []
  for (let i = 0; i < (productData.variants || []).length; i++) {
    const v = productData.variants[i]
    const variantPriceData = { base: v.price?.base, sale: v.price?.sale }
    if (v.wholesale) {
      variantPriceData.wholesaleBase = v.wholesaleBase ?? v.price?.wholesaleBase
      variantPriceData.wholesaleSale = v.wholesaleSale ?? v.price?.wholesaleSale
    }
    const vPrice = buildPriceObj(variantPriceData, `Variant ${i + 1} base price`)
    const wholesaleEligible = v.wholesale && (toNum(v.wholesaleBase ?? v.price?.wholesaleBase) > 0)
    const normalizedVariantProductCode = normalizeProductCode(v.ProductCode, `Variant ${i + 1} ProductCode`)
    normalizedVariantCodes.push(normalizedVariantProductCode)
    extraVariants.push({
      productCode: normalizedVariantProductCode,
      attributes: (v.attributes || []).filter((a) => a.key && a.value),
      price: vPrice,
      inventory: buildInventoryObj(v.inventory),
      isActive: v.isActive !== false,
      wholesale: v.wholesale || false,
      minimumOrderQuantity: v.wholesale ? (parseInt(v.minimumOrderQuantity, 10) || 1) : 1,
      channelVisibility: {
        ecomm: v.channelVisibility?.ecomm || 'active',
        wholesale: wholesaleEligible ? 'active' : 'draft',
      },
      ...buildVariantCatalogApiPayload({
        title: v.title,
        description: v.description,
        shipping: v.shipping,
      }),
    })
  }

  const primaryWholesaleEligible = productData.wholesale && (toNum(productData.wholesaleBase) > 0)
  const normalizedMainProductCode = normalizeProductCode(productData.ProductCode, 'Main ProductCode')

  const primaryVariant = {
    productCode: normalizedMainProductCode,
    attributes: [],
    price: primaryPrice,
    inventory: buildInventoryObj(productData.inventory),
    isActive: true,
    wholesale: productData.wholesale || false,
    minimumOrderQuantity: productData.wholesale ? (parseInt(productData.minimumOrderQuantity, 10) || 1) : 1,
    channelVisibility: {
      ecomm: 'active',
      wholesale: primaryWholesaleEligible ? 'active' : 'draft',
    },
  }

  fd.append('variants', JSON.stringify([primaryVariant, ...extraVariants]))
  productImageFiles.forEach((img) => fd.append('variantImages_0', img.file))
  ;(productData.variants || []).forEach((variant, vIdx) => {
    const realIndex = vIdx + 1
    ;(variant.images || []).forEach((img) => {
      if (img?.file instanceof File) fd.append(`variantImages_${realIndex}`, img.file)
    })
  })

  return fd
}

/** POST /admin/products/:slug/variants — add an extra variant on an existing product. */
export async function addAdminProductVariant(slug, variantData) {
  const rawCode = variantData.ProductCode ?? variantData.productCode
  if (!rawCode && rawCode !== 0) throw new Error('ProductCode is required to add a variant')
  const upper = String(rawCode).trim().toUpperCase()
  const m = upper.match(/^([A-Z0-9]+)-(\d+)$/)
  const seq = m ? Number(m[2]) : NaN
  if (!m || !Number.isInteger(seq) || seq < 1) {
    throw new Error('ProductCode must be BASE-N (e.g., 3897-1 or 3897-01)')
  }
  const canonicalProductCode = `${m[1]}-${seq}`

  const fd = new FormData()
  fd.append('productCode', canonicalProductCode)
  fd.append('price', JSON.stringify(buildPriceObj(variantData.price, 'Variant base price')))

  const cleanAttrs = Array.isArray(variantData.attributes)
    ? variantData.attributes.filter((a) => a.key && a.value).map((a) => ({ key: a.key, value: a.value }))
    : []
  fd.append('attributes', JSON.stringify(cleanAttrs))
  fd.append('inventory', JSON.stringify(buildInventoryObj(variantData.inventory || {})))
  fd.append('isActive', variantData.isActive !== false ? 'true' : 'false')
  fd.append('wholesale', variantData.wholesale ? 'true' : 'false')
  if (variantData.minimumOrderQuantity) {
    fd.append('minimumOrderQuantity', String(variantData.minimumOrderQuantity))
  }
  if (variantData.channelVisibility) {
    fd.append('channelVisibility', JSON.stringify(variantData.channelVisibility))
  }

  const catalogPayload = buildVariantCatalogApiPayload({
    title: variantData.title,
    description: variantData.description,
    shipping: variantData.shipping,
  })
  if (catalogPayload.title) fd.append('title', catalogPayload.title)
  if (catalogPayload.description) fd.append('description', catalogPayload.description)
  if (catalogPayload.shipping) fd.append('shipping', JSON.stringify(catalogPayload.shipping))

  if (variantData.images?.length) {
    variantData.images.forEach((img) => {
      if (img?.file instanceof File) fd.append('variantImages', img.file)
    })
  }

  const axiosClient = (await import('@/api/axiosClient')).default
  const response = await axiosClient.request({
    method: 'POST',
    url: API_ENDPOINTS.admin.productVariants(slug),
    data: fd,
    headers: { 'Content-Type': 'multipart/form-data' },
    useAdminAuth: true,
    timeout: 150000,
  })
  const payload = response.data
  if (payload?.success === false) throw new Error(payload?.message || 'Add variant failed')
  const unwrapped = unwrapAdmin(payload)
  return { product: unwrapped?.product || payload?.product || unwrapped }
}

/**
 * PUT /admin/products/:slug — update an existing variant by productCode.
 * Mirrors fabFE updateVariantByBarcode (variant fields go on product PUT with productCode).
 */
export async function updateAdminProductVariant({
  slug,
  barcode,
  price,
  inventory,
  attributes,
  isActive,
  images,
  wholesale,
  minimumOrderQuantity,
  channelVisibility,
  variantTitle,
  variantDescription,
  shipping: variantShipping,
}) {
  const fd = new FormData()
  fd.append('productCode', String(barcode))

  if (price !== undefined) {
    fd.append('price', JSON.stringify(buildPriceObj(price, 'Variant base price')))
  }
  if (inventory !== undefined) {
    fd.append('inventory', JSON.stringify(buildInventoryObj(inventory)))
  }
  if (attributes !== undefined) {
    const cleanAttrs = Array.isArray(attributes)
      ? attributes.filter((a) => a.key && a.value).map((a) => ({ key: a.key, value: a.value }))
      : []
    fd.append('attributes', JSON.stringify(cleanAttrs))
  }
  if (isActive !== undefined) fd.append('isActive', String(isActive))
  if (wholesale !== undefined) fd.append('wholesale', String(wholesale))
  if (minimumOrderQuantity !== undefined) {
    fd.append('minimumOrderQuantity', String(minimumOrderQuantity))
  }
  if (channelVisibility !== undefined) {
    fd.append('channelVisibility', JSON.stringify(channelVisibility))
  }

  const catalogPayload = buildVariantCatalogApiPayload({
    title: variantTitle,
    description: variantDescription,
    shipping: variantShipping,
  })
  if (catalogPayload.title) fd.append('variantTitle', catalogPayload.title)
  if (catalogPayload.description) fd.append('variantDescription', catalogPayload.description)
  if (catalogPayload.shipping) fd.append('shipping', JSON.stringify(catalogPayload.shipping))

  if (images !== undefined && images !== null) {
    const existingImages = images.filter((img) => img.url && !(img.file instanceof File))
    const newFiles = images.filter((img) => img.file instanceof File)

    if (existingImages.length > 0) {
      const sorted = [...existingImages].sort((a, b) => {
        if (a.isMain && !b.isMain) return -1
        if (!a.isMain && b.isMain) return 1
        return 0
      })
      const existingPayload = sorted.map((img, i) => ({
        url: img.url,
        publicId: img.publicId || img.public_id || '',
        altText: img.altText || '',
        order: i,
      }))
      fd.append('existingImages', JSON.stringify(existingPayload))
    }

    newFiles.forEach((img) => {
      fd.append('variantImages', img.file)
    })
  }

  const axiosClient = (await import('@/api/axiosClient')).default
  const response = await axiosClient.request({
    method: 'PUT',
    url: API_ENDPOINTS.admin.productBySlug(slug),
    data: fd,
    headers: { 'Content-Type': 'multipart/form-data' },
    useAdminAuth: true,
    timeout: 150000,
  })
  const payload = response.data
  if (payload?.success === false) throw new Error(payload?.message || 'Variant update failed')
  const unwrapped = unwrapAdmin(payload)
  return { product: unwrapped?.product || payload?.product || unwrapped }
}

/** DELETE /admin/products/:slug/variants — remove a variant by productCode. */
export async function deleteAdminProductVariant(slug, barcode) {
  const axiosClient = (await import('@/api/axiosClient')).default
  const response = await axiosClient.request({
    method: 'DELETE',
    url: API_ENDPOINTS.admin.productVariants(slug),
    data: { productCode: barcode },
    useAdminAuth: true,
  })
  const payload = response.data
  if (payload?.success === false) throw new Error(payload?.message || 'Delete variant failed')
  const unwrapped = unwrapAdmin(payload)
  return { product: unwrapped?.product || payload?.product || unwrapped }
}
