const CREATE_DRAFT_KEY = 'fabuniqo_admin_product_create_draft'
const DRAFT_VERSION = 1

function isDataUrl(value) {
  return typeof value === 'string' && value.startsWith('data:')
}

function stripImageForStorage(img) {
  if (!img || typeof img !== 'object') return img
  const { file: _file, ...rest } = img
  return rest
}

function cloneForStorage(formData) {
  const raw = JSON.parse(JSON.stringify({
    ...formData,
    images: (formData.images || []).map(stripImageForStorage),
    variants: (formData.variants || []).map((v) => ({
      ...v,
      images: (v.images || []).map(stripImageForStorage),
    })),
  }))
  return raw
}

export function isCreateDraftMeaningful(formData) {
  if (!formData || typeof formData !== 'object') return false
  if (String(formData.name || '').trim()) return true
  if (String(formData.title || '').trim()) return true
  if (String(formData.ProductCode || '').trim()) return true
  if (String(formData.description || '').trim()) return true
  if (String(formData.price?.base || '').trim()) return true
  if (String(formData.price?.sale || '').trim()) return true
  if ((formData.images || []).length) return true
  if ((formData.variants || []).length) return true
  if ((formData.attributes || []).length) return true
  if (String(formData.category || '').trim()) return true
  return false
}

export function clearCreateProductDraft() {
  try {
    sessionStorage.removeItem(CREATE_DRAFT_KEY)
  } catch {
    /* private mode / blocked storage */
  }
}

export function writeCreateProductDraft(formData) {
  try {
    if (!isCreateDraftMeaningful(formData)) {
      clearCreateProductDraft()
      return { ok: true, strippedImages: false }
    }
    const payload = {
      v: DRAFT_VERSION,
      savedAt: Date.now(),
      form: cloneForStorage(formData),
    }
    const json = JSON.stringify(payload)
    try {
      sessionStorage.setItem(CREATE_DRAFT_KEY, json)
      return { ok: true, strippedImages: false }
    } catch (err) {
      const quota = err?.name === 'QuotaExceededError' || err?.code === 22
      if (!quota) throw err
      const slim = {
        v: DRAFT_VERSION,
        savedAt: Date.now(),
        form: {
          ...payload.form,
          images: [],
          variants: (payload.form.variants || []).map((v) => ({ ...v, images: [] })),
        },
      }
      sessionStorage.setItem(CREATE_DRAFT_KEY, JSON.stringify(slim))
      return { ok: true, strippedImages: true }
    }
  } catch {
    return { ok: false, strippedImages: false }
  }
}

export function readCreateProductDraft() {
  try {
    const raw = sessionStorage.getItem(CREATE_DRAFT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || parsed.v !== DRAFT_VERSION || !parsed.form || typeof parsed.form !== 'object') {
      clearCreateProductDraft()
      return null
    }
    if (!isCreateDraftMeaningful(parsed.form)) {
      clearCreateProductDraft()
      return null
    }
    return parsed.form
  } catch {
    clearCreateProductDraft()
    return null
  }
}

async function fileFromDataUrl(dataUrl, name = 'image.png') {
  const res = await fetch(dataUrl)
  const blob = await res.blob()
  const type = blob.type || 'image/png'
  return new File([blob], name, { type })
}

async function rehydrateImage(img) {
  if (!img || typeof img !== 'object') return img
  if (img.file instanceof File) return img
  if (!isDataUrl(img.url)) return img
  try {
    const file = await fileFromDataUrl(img.url, img.name || 'image.png')
    return { ...img, file }
  } catch {
    return img
  }
}

export async function rehydrateCreateDraft(form) {
  if (!form) return form
  try {
    const images = await Promise.all((form.images || []).map(rehydrateImage))
    const variants = await Promise.all(
      (form.variants || []).map(async (v) => ({
        ...v,
        images: await Promise.all((v.images || []).map(rehydrateImage)),
      }))
    )
    return { ...form, images, variants }
  } catch {
    return form
  }
}
