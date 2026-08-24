import { API_ENDPOINTS } from '@/api/endpoints'
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

export async function getAdminCategories({ signal } = {}) {
  const payload = await adminGet(API_ENDPOINTS.admin.categories, { signal })
  return unwrapAdmin(payload)
}

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

export async function archiveAdminProduct(slug) {
  const payload = await adminDelete(API_ENDPOINTS.admin.productBySlug(slug))
  return unwrapAdmin(payload)
}

export async function restoreAdminProduct(slug) {
  const payload = await adminPatch(API_ENDPOINTS.admin.productRestore(slug))
  return unwrapAdmin(payload)
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
