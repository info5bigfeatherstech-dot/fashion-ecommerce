import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  AlertTriangle,
  Eye,
  EyeOff,
  GripVertical,
  ImageIcon,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { getCategoryImageUrl, sortAdminCategories } from '@/features/admin/api/categories'
import {
  useAdminCategories,
  useCreateAdminCategory,
  useDeleteAdminCategory,
  useReorderAdminCategories,
  useToggleAdminCategoryVisibility,
  useUpdateAdminCategory,
} from '@/features/admin/hooks'

function isCategoryHidden(cat) {
  return cat?.status === 'inactive' || cat?.isHidden === true
}

function mergeCategoryIntoList(list, category) {
  if (!category) return list
  const id = category._id || category.id
  if (!id) return list
  const next = list.some((c) => (c._id || c.id) === id)
    ? list.map((c) => ((c._id || c.id) === id ? { ...c, ...category } : c))
    : [...list, category]
  return sortAdminCategories(next)
}

function CategoryImagePreview({ src, isNewFile, onClear, onReplace, onUploadClick }) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const isDataUri = src?.startsWith('data:')
  const showVisible = loaded || isDataUri

  useEffect(() => {
    if (!isDataUri) {
      setLoaded(false)
      setError(false)
    } else {
      setError(false)
    }
  }, [src, isDataUri])

  if (!src) {
    return (
      <button type="button" className="admin-cat__upload-zone" onClick={onUploadClick}>
        <ImageIcon size={22} aria-hidden />
        <span>Click to upload image</span>
        <span className="admin-cat__upload-hint">PNG · JPG · WEBP · max 5 MB</span>
      </button>
    )
  }

  return (
    <div className="admin-cat__preview">
      {!showVisible && !error ? <div className="admin-cat__preview-skeleton" aria-hidden /> : null}
      {error ? (
        <div className="admin-cat__preview-error">
          <AlertTriangle size={18} aria-hidden />
          <span>Failed to load image</span>
        </div>
      ) : null}
      <img
        src={src}
        alt="Category preview"
        onLoad={() => {
          setLoaded(true)
          setError(false)
        }}
        onError={() => {
          setError(true)
          setLoaded(false)
        }}
        className={`admin-cat__preview-img ${showVisible ? 'is-visible' : ''}`}
      />
      {isNewFile ? <span className="admin-cat__preview-badge">New</span> : null}
      <button type="button" className="admin-cat__preview-clear" onClick={onClear} title="Remove image">
        <X size={14} aria-hidden />
      </button>
      <button type="button" className="admin-cat__preview-replace" onClick={onReplace}>
        Replace
      </button>
    </div>
  )
}

function CategoryRow({
  cat,
  index,
  isEditing,
  isConfirmDelete,
  isDraggingOver,
  deleteLoading,
  toggleLoading,
  onSelect,
  onEdit,
  onToggleVisibility,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}) {
  const isHidden = isCategoryHidden(cat)
  const catImgUrl = getCategoryImageUrl(cat)
  const catId = cat._id || cat.id

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
      className={[
        'admin-cat__row',
        isDraggingOver ? 'admin-cat__row--drag-over' : '',
        isHidden ? 'admin-cat__row--hidden' : '',
        isEditing ? 'admin-cat__row--editing' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="admin-cat__row-grip" title="Drag to reorder">
        <GripVertical size={16} aria-hidden />
      </div>

      {catImgUrl ? (
        <img
          src={catImgUrl}
          alt=""
          className={`admin-cat__row-thumb ${isHidden ? 'admin-cat__row-thumb--hidden' : ''}`}
          loading="lazy"
        />
      ) : (
        <div className="admin-cat__row-thumb admin-cat__row-thumb--empty">
          <ImageIcon size={14} aria-hidden />
        </div>
      )}

      <button type="button" className="admin-cat__row-select" onClick={() => onSelect(catId)} title="Select category">
        <span className={`admin-cat__row-name ${isHidden ? 'is-hidden' : ''}`}>{cat.name}</span>
        {cat.description ? <span className="admin-cat__row-desc">{cat.description}</span> : null}
      </button>

      <button
        type="button"
        className={`admin-cat__row-icon ${isHidden ? 'is-off' : 'is-on'}`}
        onClick={() => onToggleVisibility(cat)}
        disabled={toggleLoading}
        title={isHidden ? 'Show category' : 'Hide category'}
      >
        {isHidden ? <EyeOff size={15} aria-hidden /> : <Eye size={15} aria-hidden />}
      </button>

      <button
        type="button"
        className={`admin-cat__row-icon ${isEditing ? 'is-active' : ''}`}
        onClick={() => onEdit(cat)}
        title="Edit category"
      >
        <Pencil size={15} aria-hidden />
      </button>

      {isConfirmDelete ? (
        <div className="admin-cat__row-delete-confirm">
          <button
            type="button"
            className="admin-cat__row-delete-yes"
            onClick={() => onDeleteConfirm(catId)}
            disabled={deleteLoading}
          >
            {deleteLoading ? '…' : 'Delete'}
          </button>
          <button type="button" className="admin-cat__row-delete-no" onClick={onDeleteCancel}>
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="admin-cat__row-icon admin-cat__row-icon--danger"
          onClick={() => onDeleteRequest(catId)}
          title="Delete category"
        >
          <Trash2 size={15} aria-hidden />
        </button>
      )}
    </div>
  )
}

export function AdminCategoryManagerModal({ onSelect, onCreated, onClose, selectOnCreate = true }) {
  const { data: categories = [], isLoading, isError, error, refetch, isFetching } = useAdminCategories({
    refetchOnMount: true,
  })
  const createCategory = useCreateAdminCategory()
  const updateCategory = useUpdateAdminCategory()
  const deleteCategory = useDeleteAdminCategory()
  const reorderCategories = useReorderAdminCategories()
  const toggleVisibility = useToggleAdminCategoryVisibility()

  const [orderedCategories, setOrderedCategories] = useState([])
  const [hasReordered, setHasReordered] = useState(false)
  const [dragOverIndex, setDragOverIndex] = useState(null)

  const dragSourceIndexRef = useRef(null)
  const orderedCatsRef = useRef([])
  const imageInputRef = useRef(null)
  const formTopRef = useRef(null)
  const existingImageUrlRef = useRef('')

  const [editingCat, setEditingCat] = useState(null)
  const [formName, setFormName] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formImageFile, setFormImageFile] = useState(null)
  const [formImageSrc, setFormImageSrc] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [actionError, setActionError] = useState('')

  const isEditMode = editingCat != null

  useEffect(() => {
    orderedCatsRef.current = orderedCategories
  }, [orderedCategories])

  useEffect(() => {
    if (dragSourceIndexRef.current !== null) return
    setOrderedCategories(sortAdminCategories(categories))
  }, [categories])

  // Offer-style: always fetch fresh list when modal opens
  useEffect(() => {
    refetch().catch(() => {})
  }, [refetch])

  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [])

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  useEffect(() => {
    let cancelled = false
    if (formImageFile) {
      const reader = new FileReader()
      reader.onload = (e) => {
        if (!cancelled) setFormImageSrc(String(e.target?.result || ''))
      }
      reader.onerror = () => {
        if (!cancelled) setFormImageSrc(existingImageUrlRef.current)
      }
      reader.readAsDataURL(formImageFile)
    } else {
      setFormImageSrc(existingImageUrlRef.current)
    }
    return () => {
      cancelled = true
    }
  }, [formImageFile])

  const resetForm = useCallback(() => {
    setEditingCat(null)
    setFormName('')
    setFormDesc('')
    setFormImageFile(null)
    existingImageUrlRef.current = ''
    if (imageInputRef.current) imageInputRef.current.value = ''
    setActionError('')
  }, [])

  const openEdit = useCallback((cat) => {
    setEditingCat(cat)
    setFormName(cat.name || '')
    setFormDesc(cat.description || '')
    setFormImageFile(null)
    const existingUrl = getCategoryImageUrl(cat) || ''
    existingImageUrlRef.current = existingUrl
    setFormImageSrc(existingUrl)
    if (imageInputRef.current) imageInputRef.current.value = ''
    setActionError('')
    setTimeout(() => {
      formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }, [])

  const handleImageChange = useCallback((e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setActionError('Please select a valid image (PNG, JPG, WEBP, etc.).')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setActionError('Image must be under 5 MB.')
      return
    }
    setActionError('')
    setFormImageFile(file)
  }, [])

  const clearImage = useCallback(() => {
    setFormImageFile(null)
    if (imageInputRef.current) imageInputRef.current.value = ''
  }, [])

  const handleCreate = async () => {
    const name = formName.trim()
    if (!name) {
      setActionError('Category name is required.')
      return
    }
    setActionError('')
    try {
      const category = await createCategory.mutateAsync({
        name,
        description: formDesc.trim(),
        imageFile: formImageFile || undefined,
      })
      const id = category?._id || category?.id
      toast.success('Category created')
      onCreated?.(category)
      setOrderedCategories((prev) => mergeCategoryIntoList(prev, category))
      const result = await refetch()
      if (result.data?.length) {
        setOrderedCategories(sortAdminCategories(result.data))
      }
      if (selectOnCreate && id) onSelect?.(id)
      if (selectOnCreate) onClose()
      else resetForm()
    } catch (err) {
      setActionError(err?.message || 'Could not create category')
    }
  }

  const handleSaveEdit = async () => {
    const name = formName.trim()
    if (!name) {
      setActionError('Category name is required.')
      return
    }
    const id = editingCat?._id || editingCat?.id
    if (!id) return

    setActionError('')
    try {
      const category = await updateCategory.mutateAsync({
        id,
        name,
        description: formDesc.trim(),
        imageFile: formImageFile || undefined,
      })
      toast.success('Category updated')
      onCreated?.(category)
      setOrderedCategories((prev) => mergeCategoryIntoList(prev, category))
      const result = await refetch()
      if (result.data?.length) {
        setOrderedCategories(sortAdminCategories(result.data))
      }
      resetForm()
    } catch (err) {
      setActionError(err?.message || 'Could not update category')
    }
  }

  const handleDelete = async (id) => {
    setActionError('')
    try {
      await deleteCategory.mutateAsync(id)
      toast.success('Category archived')
      setConfirmDeleteId(null)
      if ((editingCat?._id || editingCat?.id) === id) resetForm()
      setOrderedCategories((prev) => prev.filter((c) => (c._id || c.id) !== id))
      onCreated?.()
      await refetch()
    } catch (err) {
      setActionError(err?.message || 'Could not delete category')
    }
  }

  const handleToggleVisibility = useCallback(
    async (cat) => {
      const id = cat._id || cat.id
      const wasHidden = isCategoryHidden(cat)
      setOrderedCategories((prev) =>
        prev.map((c) =>
          (c._id || c.id) === id
            ? {
                ...c,
                status: wasHidden ? 'active' : 'inactive',
                isHidden: !wasHidden,
              }
            : c
        )
      )
      setActionError('')
      try {
        await toggleVisibility.mutateAsync({ id, isHidden: !wasHidden })
        toast.message(wasHidden ? 'Category is now visible' : 'Category hidden')
        await refetch()
      } catch (err) {
        setActionError(err?.message || 'Could not update visibility')
        await refetch()
      }
    },
    [toggleVisibility, refetch]
  )

  const handleSelect = useCallback(
    (catId) => {
      onSelect?.(catId)
      onClose()
    },
    [onSelect, onClose]
  )

  const handleDragStart = useCallback((e, index) => {
    dragSourceIndexRef.current = index
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(index))
    e.currentTarget.style.opacity = '0.45'
  }, [])

  const handleDragEnd = useCallback((e) => {
    dragSourceIndexRef.current = null
    setDragOverIndex(null)
    if (e.currentTarget) e.currentTarget.style.opacity = ''
  }, [])

  const handleDragOver = useCallback((e, targetIndex) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    const sourceIndex = dragSourceIndexRef.current
    setDragOverIndex(targetIndex)
    if (sourceIndex === null || sourceIndex === targetIndex) return

    const current = [...orderedCatsRef.current]
    const [moved] = current.splice(sourceIndex, 1)
    current.splice(targetIndex, 0, moved)
    dragSourceIndexRef.current = targetIndex
    setOrderedCategories(current)
    setHasReordered(true)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    dragSourceIndexRef.current = null
    setDragOverIndex(null)
  }, [])

  const handleSaveOrder = async () => {
    setActionError('')
    try {
      await reorderCategories.mutateAsync(orderedCategories)
      toast.success('Category order saved')
      setHasReordered(false)
      const result = await refetch()
      if (result.data?.length) {
        setOrderedCategories(sortAdminCategories(result.data))
      }
    } catch (err) {
      setActionError(err?.message || 'Failed to save order')
      setOrderedCategories(sortAdminCategories(categories))
      setHasReordered(false)
    }
  }

  const busy =
    createCategory.isPending ||
    updateCategory.isPending ||
    deleteCategory.isPending ||
    reorderCategories.isPending ||
    toggleVisibility.isPending

  const listEmpty = !isLoading && !isFetching && orderedCategories.length === 0
  const loadError = isError ? error?.message || 'Could not load categories' : ''
  const showInitialLoading = isLoading && orderedCategories.length === 0

  const modal = (
    <div
      className="admin-cat__overlay"
      onClick={() => {
        if (!busy) onClose()
      }}
      role="presentation"
    >
      <div
        className="admin-cat__dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-cat-title"
      >
        <header className="admin-cat__header">
          <div>
            <h2 id="admin-cat-title" className="admin-cat__title">
              Manage Categories
            </h2>
            <p className="admin-cat__subtitle">Create, edit, reorder or hide categories</p>
          </div>
          <button type="button" className="admin-cat__close" onClick={onClose} disabled={busy} aria-label="Close">
            <X size={18} aria-hidden />
          </button>
        </header>

        <div
          className="admin-cat__body"
          data-lenis-prevent
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          {(actionError || loadError) && (
            <div className="admin-cat__error" role="alert">
              <AlertTriangle size={16} aria-hidden />
              <span>{actionError || loadError}</span>
              {loadError ? (
                <button type="button" className="admin-cat__retry" onClick={() => refetch()} disabled={isFetching}>
                  Retry
                </button>
              ) : null}
            </div>
          )}

          {showInitialLoading ? (
            <div className="admin-cat__loading">
              <RefreshCw size={18} className="admin-cat__spin" aria-hidden />
              Loading categories…
            </div>
          ) : null}

          <div ref={formTopRef} className="admin-cat__form">
            <div className="admin-cat__form-head">
              <h3 className="admin-cat__form-title">
                {isEditMode ? (
                  <>
                    Editing: <span>{editingCat.name}</span>
                  </>
                ) : (
                  'New category'
                )}
              </h3>
              {isEditMode ? (
                <button type="button" className="admin-cat__form-cancel-edit" onClick={resetForm} disabled={busy}>
                  Cancel edit
                </button>
              ) : null}
            </div>

            <label className="admin-cat__field">
              <span className="admin-cat__field-label">Category name</span>
              <input
                type="text"
                value={formName}
                onChange={(e) => {
                  setFormName(e.target.value)
                  setActionError('')
                }}
                placeholder="Category name (e.g. Electronics)"
                disabled={busy}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    if (isEditMode) handleSaveEdit()
                    else handleCreate()
                  }
                }}
              />
            </label>

            <label className="admin-cat__field">
              <span className="admin-cat__field-label">Description (optional)</span>
              <textarea
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="Short description for admin reference"
                rows={2}
                disabled={busy}
              />
            </label>

            <div className="admin-cat__field">
              <span className="admin-cat__field-label">Category image</span>
              <CategoryImagePreview
                src={formImageSrc}
                isNewFile={Boolean(formImageFile)}
                onClear={clearImage}
                onReplace={() => imageInputRef.current?.click()}
                onUploadClick={() => imageInputRef.current?.click()}
              />
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleImageChange}
              />
            </div>

            {isEditMode ? (
              <div className="admin-cat__form-actions">
                <Button type="button" variant="primary" fullWidth disabled={busy || !formName.trim()} onClick={handleSaveEdit}>
                  <Save size={16} aria-hidden />
                  {updateCategory.isPending ? 'Saving…' : 'Save changes'}
                </Button>
                <Button type="button" variant="ghost" disabled={busy} onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="primary"
                fullWidth
                disabled={busy || !formName.trim()}
                onClick={handleCreate}
              >
                <Plus size={16} aria-hidden />
                {createCategory.isPending ? 'Creating…' : selectOnCreate ? 'Create & select' : 'Create category'}
              </Button>
            )}
          </div>

          <div className="admin-cat__divider">
            <span>or select existing</span>
          </div>

          <div className="admin-cat__toolbar">
            <p className="admin-cat__toolbar-hint">Drag to reorder · toggle visibility · edit or delete</p>
            <div className="admin-cat__toolbar-actions">
              {isFetching && !isLoading ? (
                <span className="admin-cat__refreshing">
                  <RefreshCw size={14} className="admin-cat__spin" aria-hidden />
                </span>
              ) : null}
              {hasReordered ? (
                <Button type="button" variant="primary" size="sm" disabled={reorderCategories.isPending} onClick={handleSaveOrder}>
                  <Save size={14} aria-hidden />
                  {reorderCategories.isPending ? 'Saving…' : 'Save order'}
                </Button>
              ) : null}
            </div>
          </div>

          <div className="admin-cat__list">
            {listEmpty ? (
              <div className="admin-cat__empty">
                <ImageIcon size={28} aria-hidden />
                <p>No categories yet</p>
                <span>Create one above to get started</span>
              </div>
            ) : (
              orderedCategories.map((cat, index) => (
                <CategoryRow
                  key={cat._id || cat.id}
                  cat={cat}
                  index={index}
                  isEditing={(editingCat?._id || editingCat?.id) === (cat._id || cat.id)}
                  isConfirmDelete={confirmDeleteId === (cat._id || cat.id)}
                  isDraggingOver={dragOverIndex === index}
                  deleteLoading={deleteCategory.isPending}
                  toggleLoading={toggleVisibility.isPending}
                  onSelect={handleSelect}
                  onEdit={openEdit}
                  onToggleVisibility={handleToggleVisibility}
                  onDeleteRequest={setConfirmDeleteId}
                  onDeleteConfirm={handleDelete}
                  onDeleteCancel={() => setConfirmDeleteId(null)}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                />
              ))
            )}
          </div>

          {orderedCategories.length > 0 ? (
            <div className="admin-cat__legend">
              <span>
                <Eye size={12} aria-hidden className="admin-cat__legend-icon admin-cat__legend-icon--on" />
                Visible
              </span>
              <span className="admin-cat__legend-sep">|</span>
              <span>
                <EyeOff size={12} aria-hidden className="admin-cat__legend-icon" />
                Hidden
              </span>
              <span className="admin-cat__legend-sep">|</span>
              <span>
                <GripVertical size={12} aria-hidden className="admin-cat__legend-icon" />
                Drag to reorder
              </span>
            </div>
          ) : null}
        </div>

        <footer className="admin-cat__footer">
          <Button type="button" variant="ghost" fullWidth disabled={busy} onClick={onClose}>
            Close
          </Button>
        </footer>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
