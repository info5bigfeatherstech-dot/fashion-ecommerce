import { API_ENDPOINTS } from '@/api/endpoints'
import { ApiError } from '@/api/errors'
import { adminDelete, adminGet, adminPatch, adminPost, unwrapAdmin } from './client'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024

async function adminMultipartRequest(method, url, formData) {
  const axiosClient = (await import('@/api/axiosClient')).default
  try {
    const response = await axiosClient.request({
      method,
      url,
      data: formData,
      headers: { 'Content-Type': 'multipart/form-data' },
      useAdminAuth: true,
    })
    return unwrapAdmin(response.data)
  } catch (error) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      'Category request failed'
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

export function validateCategoryImageFile(file) {
  if (!(file instanceof File)) {
    throw new ApiError({ message: 'Invalid image file', status: 400, code: 'INVALID_IMAGE' })
  }
  if (!file.type.startsWith('image/')) {
    throw new ApiError({
      message: 'Please select a valid image (PNG, JPG, WEBP, etc.)',
      status: 400,
      code: 'INVALID_IMAGE_TYPE',
    })
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new ApiError({
      message: 'Image must be under 5 MB',
      status: 400,
      code: 'IMAGE_TOO_LARGE',
    })
  }
}

function buildCategoryFormData({
  name,
  description,
  parent,
  order,
  status,
  imageFile,
} = {}) {
  const fd = new FormData()
  if (name != null && String(name).trim()) fd.append('name', String(name).trim())
  if (description != null) fd.append('description', String(description))
  if (parent) fd.append('parent', String(parent))
  if (order != null && order !== '') fd.append('order', String(order))
  if (status) fd.append('status', String(status))
  if (imageFile instanceof File) {
    validateCategoryImageFile(imageFile)
    fd.append('image', imageFile)
  }
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
} = {}) {
  const trimmed = String(name || '').trim()
  if (!trimmed) {
    throw new ApiError({ message: 'Category name is required', status: 400, code: 'NAME_REQUIRED' })
  }

  const fd = buildCategoryFormData({ name: trimmed, description, parent, status, order, imageFile })
  const data = await adminMultipartRequest('POST', API_ENDPOINTS.admin.categories, fd)
  return unwrapCategoryRecord(data)
}

export async function updateAdminCategory(
  id,
  { name, description, parent, order, status, imageFile } = {}
) {
  if (!id) {
    throw new ApiError({ message: 'Category id is required', status: 400, code: 'ID_REQUIRED' })
  }

  const fd = buildCategoryFormData({ name, description, parent, order, status, imageFile })
  const data = await adminMultipartRequest('PUT', API_ENDPOINTS.admin.categoryById(id), fd)
  return unwrapCategoryRecord(data)
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
