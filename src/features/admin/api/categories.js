import { API_ENDPOINTS } from '@/api/endpoints'
import { ApiError } from '@/api/errors'
import { adminDelete, adminGet, adminPatch, adminPost, unwrapAdmin } from './client'

/** Card / tile image limit */
const MAX_TILE_IMAGE_BYTES = 5 * 1024 * 1024
/** Banner background limit (wide designs are often larger) */
const MAX_BANNER_IMAGE_BYTES = 10 * 1024 * 1024

async function adminMultipartRequest(method, url, formData) {
  const axiosClient = (await import('@/api/axiosClient')).default
  try {
    if (typeof FormData !== 'undefined' && formData instanceof FormData) {
      const keys = []
      for (const [key, value] of formData.entries()) {
        if (value && typeof value === 'object' && 'size' in value) {
          keys.push(`${key}:file(${value.name || 'blob'},${value.size}b,${value.type || ''})`)
        } else {
          keys.push(`${key}:text`)
        }
      }
      console.info('[category.api] multipart payload', { method, url, keys })
    }

    const response = await axiosClient.request({
      method,
      url,
      data: formData,
      // Do NOT set Content-Type manually — browser/axios must add multipart boundary.
      headers: {},
      useAdminAuth: true,
    })
    return unwrapAdmin(response.data)
  } catch (error) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      'Category request failed'
    console.error('[category.api] multipart failed', {
      message,
      status: error?.response?.status,
      data: error?.response?.data,
    })
    throw new ApiError({
      message,
      status: error?.response?.status || 500,
      code: 'CATEGORY_REQUEST_FAILED',
      details: error?.response?.data,
      cause: error,
    })
  }
}

/** Flatten nested category trees; dedupe by id (offer admin returns flat, some routes use tree). */
function flattenCategoryTree(items, acc = [], seen = new Set()) {
  for (const item of Array.isArray(items) ? items : []) {
    if (!item || typeof item !== 'object') continue
    const id = item._id ?? item.id
    if (id != null && seen.has(String(id))) continue
    if (id != null) seen.add(String(id))
    const { children, ...rest } = item
    acc.push(rest)
    if (Array.isArray(children) && children.length > 0) {
      flattenCategoryTree(children, acc, seen)
    }
  }
  return acc
}

/**
 * Normalize admin category list responses (offer-compatible).
 * Handles: { categories }, { data: { categories } }, { data: [...] }, raw arrays, nested trees.
 */
export function normalizeAdminCategoriesPayload(payload) {
  if (!payload) return []
  if (Array.isArray(payload)) return flattenCategoryTree(payload)

  if (Array.isArray(payload.categories)) {
    return flattenCategoryTree(payload.categories)
  }

  const data = payload.data
  if (Array.isArray(data)) return flattenCategoryTree(data)
  if (data && typeof data === 'object' && Array.isArray(data.categories)) {
    return flattenCategoryTree(data.categories)
  }

  return []
}

export function sortAdminCategories(categories = []) {
  return [...categories].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0) || String(a.name || '').localeCompare(String(b.name || ''))
  )
}

export function getCategoryImageUrl(category) {
  if (!category?.image) return null
  if (typeof category.image === 'string' && category.image.trim()) return category.image.trim()
  return category.image?.url || category.image?.secure_url || null
}

export function getCategoryBannerImageUrl(category) {
  if (!category?.bannerImage) return null
  if (typeof category.bannerImage === 'string' && category.bannerImage.trim()) {
    return category.bannerImage.trim()
  }
  return category.bannerImage?.url || category.bannerImage?.secure_url || null
}

export function validateCategoryImageFile(file, { maxBytes = MAX_TILE_IMAGE_BYTES, label = 'Image' } = {}) {
  if (!isUploadableImage(file)) {
    throw new ApiError({ message: `Invalid ${label.toLowerCase()} file`, status: 400, code: 'INVALID_IMAGE' })
  }
  if (file.type && !String(file.type).startsWith('image/')) {
    throw new ApiError({
      message: 'Please select a valid image (PNG, JPG, WEBP, etc.)',
      status: 400,
      code: 'INVALID_IMAGE_TYPE',
    })
  }
  const limit = Number(maxBytes) > 0 ? Number(maxBytes) : MAX_TILE_IMAGE_BYTES
  if (file.size > limit) {
    const mb = Math.round((limit / (1024 * 1024)) * 10) / 10
    throw new ApiError({
      message: `${label} must be under ${mb} MB`,
      status: 400,
      code: 'IMAGE_TOO_LARGE',
    })
  }
}

/** File/Blob duck-type — more reliable than `instanceof File` across browsers. */
function isUploadableImage(value) {
  if (!value || typeof value !== 'object') return false
  if (typeof value.size !== 'number' || value.size <= 0) return false
  // Prefer image/* ; allow empty type (some OS pickers) if name looks like an image
  const type = String(value.type || '')
  if (type && !type.startsWith('image/')) return false
  if (!type) {
    const name = String(value.name || '').toLowerCase()
    if (!/\.(jpe?g|png|webp|gif|avif|bmp|heic|heif|tiff?|svg)$/i.test(name)) return false
  }
  return true
}

function appendImageField(fd, fieldName, file) {
  if (!isUploadableImage(file)) return false
  const isBanner = fieldName === 'bannerImage'
  validateCategoryImageFile(file, {
    maxBytes: isBanner ? MAX_BANNER_IMAGE_BYTES : MAX_TILE_IMAGE_BYTES,
    label: isBanner ? 'Banner image' : 'Category image',
  })
  const filename = String(file.name || `${fieldName}.jpg`).trim() || `${fieldName}.jpg`
  fd.append(fieldName, file, filename)
  return true
}

function buildCategoryFormData({
  name,
  description,
  parent,
  order,
  status,
  imageFile,
  bannerImageFile,
  clearImage,
  clearBannerImage,
} = {}) {
  const fd = new FormData()
  if (name != null && String(name).trim()) fd.append('name', String(name).trim())
  if (description != null) fd.append('description', String(description))
  if (parent) fd.append('parent', String(parent))
  if (order != null && order !== '') fd.append('order', String(order))
  if (status) fd.append('status', String(status))

  const hasImage = appendImageField(fd, 'image', imageFile)
  const hasBanner = appendImageField(fd, 'bannerImage', bannerImageFile)

  // Only clear when not also uploading a replacement for that slot
  if (clearImage && !hasImage) fd.append('clearImage', 'true')
  if (clearBannerImage && !hasBanner) fd.append('clearBannerImage', 'true')
  return fd
}

function unwrapCategoryRecord(payload) {
  return payload?.category || payload
}

export async function getAdminCategories({ signal } = {}) {
  const payload = await adminGet(API_ENDPOINTS.admin.categories, { signal })
  const unwrapped = unwrapAdmin(payload)
  let categories = normalizeAdminCategoriesPayload(payload)
  if (!categories.length) {
    categories = normalizeAdminCategoriesPayload(unwrapped)
  }
  return {
    ...(typeof unwrapped === 'object' && unwrapped && !Array.isArray(unwrapped) ? unwrapped : {}),
    categories: sortAdminCategories(categories),
  }
}

export async function createAdminCategory({
  name,
  description = '',
  parent = '',
  status = 'active',
  order,
  imageFile,
  bannerImageFile,
} = {}) {
  const trimmed = String(name || '').trim()
  if (!trimmed) {
    throw new ApiError({ message: 'Category name is required', status: 400, code: 'NAME_REQUIRED' })
  }

  const fd = buildCategoryFormData({
    name: trimmed,
    description,
    parent,
    status,
    order,
    imageFile,
    bannerImageFile,
  })
  const data = await adminMultipartRequest('POST', API_ENDPOINTS.admin.categories, fd)
  return unwrapCategoryRecord(data)
}

export async function updateAdminCategory(
  id,
  {
    name,
    description,
    parent,
    order,
    status,
    imageFile,
    bannerImageFile,
    clearImage,
    clearBannerImage,
  } = {}
) {
  if (!id) {
    throw new ApiError({ message: 'Category id is required', status: 400, code: 'ID_REQUIRED' })
  }

  const expectingBanner = isUploadableImage(bannerImageFile)
  const expectingImage = isUploadableImage(imageFile)

  const fd = buildCategoryFormData({
    name,
    description,
    parent,
    order,
    status,
    imageFile,
    bannerImageFile,
    clearImage,
    clearBannerImage,
  })
  const data = await adminMultipartRequest('PUT', API_ENDPOINTS.admin.categoryById(id), fd)
  const category = unwrapCategoryRecord(data)

  if (expectingBanner && !getCategoryBannerImageUrl(category)) {
    throw new ApiError({
      message:
        'Banner image did not save. Please try again (file must be under 5 MB: PNG/JPG/WEBP).',
      status: 502,
      code: 'BANNER_UPLOAD_NOT_PERSISTED',
      details: category,
    })
  }
  if (expectingImage && !getCategoryImageUrl(category)) {
    throw new ApiError({
      message: 'Category image did not save. Please try again.',
      status: 502,
      code: 'IMAGE_UPLOAD_NOT_PERSISTED',
      details: category,
    })
  }

  return category
}

/** Permanently remove an inactive category from the database. Active categories must be hidden first. */
export async function hardDeleteAdminCategory(id) {
  if (!id) {
    throw new ApiError({ message: 'Category id is required', status: 400, code: 'ID_REQUIRED' })
  }

  try {
    await adminDelete(API_ENDPOINTS.admin.categoryHardDelete(id))
    return id
  } catch (error) {
    const message =
      error?.message ||
      error?.response?.data?.message ||
      'Failed to permanently delete category'
    throw new ApiError({
      message,
      status: error?.status || error?.response?.status || 500,
      code: 'CATEGORY_HARD_DELETE_FAILED',
      details: error?.details || error?.response?.data,
      cause: error,
    })
  }
}

/** @deprecated Offer admin uses soft archive; fashion admin uses {@link hardDeleteAdminCategory}. */
export async function deleteAdminCategory(id) {
  return hardDeleteAdminCategory(id)
}

export async function reorderAdminCategories(orderedCategories = []) {
  const categories = (Array.isArray(orderedCategories) ? orderedCategories : [])
    .map((cat, index) => ({
      id: cat?._id || cat?.id,
      order: index,
    }))
    .filter((item) => item.id)

  if (!categories.length) {
    throw new ApiError({ message: 'No categories to reorder', status: 400, code: 'EMPTY_REORDER' })
  }

  try {
    const payload = await adminPost(API_ENDPOINTS.admin.categoryReorder, { categories })
    const unwrapped = unwrapAdmin(payload)
    let list = normalizeAdminCategoriesPayload(unwrapped)
    if (!list.length) list = normalizeAdminCategoriesPayload(payload)
    return sortAdminCategories(list)
  } catch (error) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      'Failed to reorder categories'
    throw new ApiError({
      message,
      status: error?.response?.status || 500,
      code: 'CATEGORY_REORDER_FAILED',
      details: error?.response?.data,
      cause: error,
    })
  }
}

export const MOVING_FAST_CATEGORY_MAX = 4

export async function toggleAdminCategoryMovingFast(id, showInMovingFast) {
  if (!id) {
    throw new ApiError({ message: 'Category id is required', status: 400, code: 'ID_REQUIRED' })
  }
  if (typeof showInMovingFast !== 'boolean') {
    throw new ApiError({
      message: 'showInMovingFast must be a boolean',
      status: 400,
      code: 'INVALID_VALUE',
    })
  }

  try {
    const payload = await adminPatch(API_ENDPOINTS.admin.categoryToggleMovingFast(id), {
      showInMovingFast: Boolean(showInMovingFast),
    })
    const unwrapped = unwrapAdmin(payload)
    return unwrapCategoryRecord(unwrapped)
  } catch (error) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      'Failed to update Moving Fast category'
    throw new ApiError({
      message,
      status: error?.response?.status || 500,
      code: 'CATEGORY_MOVING_FAST_FAILED',
      details: error?.response?.data,
      cause: error,
    })
  }
}

export async function toggleAdminCategoryVisibility(id, isHidden) {
  if (!id) {
    throw new ApiError({ message: 'Category id is required', status: 400, code: 'ID_REQUIRED' })
  }

  try {
    const payload = await adminPatch(API_ENDPOINTS.admin.categoryToggleVisibility(id), { isHidden: Boolean(isHidden) })
    const unwrapped = unwrapAdmin(payload)
    return unwrapCategoryRecord(unwrapped)
  } catch (error) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      'Failed to update category visibility'
    throw new ApiError({
      message,
      status: error?.response?.status || 500,
      code: 'CATEGORY_VISIBILITY_FAILED',
      details: error?.response?.data,
      cause: error,
    })
  }
}
