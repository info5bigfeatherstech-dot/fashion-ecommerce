import { useCallback, useRef, useState } from 'react'
import { Link2, Package, Download, FileSpreadsheet, Archive } from 'lucide-react'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import {
  downloadAdminBulkUploadTemplate,
  importAdminBulkCsv,
  importAdminBulkWithZip,
  previewAdminBulkCsv,
} from '@/features/admin/api/products'

const STEPS_URL = ['Choose mode', 'Upload Excel', 'Preview', 'Done']
const STEPS_ZIP = ['Choose mode', 'Upload Excel', 'Preview', 'Upload ZIP', 'Done']

function fmt(n) {
  return Number(n || 0).toLocaleString()
}

function normalizePreview(raw) {
  const data = raw?.data || raw || {}
  const summary = data.summary || data
  const products = data.products || summary.products || []
  const invalidCount =
    summary.invalidCount ??
    products.filter((p) => (p.errors?.length ?? 0) > 0 || p.status === 'failed').length
  const validCount =
    summary.validCount ??
    products.filter((p) => (p.errors?.length ?? 0) === 0 && p.status !== 'failed').length

  return {
    products,
    totalProducts: summary.totalProducts ?? products.length,
    validCount,
    invalidCount,
    importBlocked: Boolean(summary.importBlocked ?? invalidCount > 0),
    hasImageUrls: Boolean(summary.hasImageUrls ?? products.some((p) => p.imageUrlCount > 0)),
  }
}

function DropZone({ accept, label, hint, icon: Icon, file, onFile, disabled }) {
  const inputRef = useRef(null)
  const [drag, setDrag] = useState(false)

  const handleFile = useCallback(
    (f) => {
      if (f && !disabled) onFile(f)
    },
    [disabled, onFile]
  )

  return (
    <div
      className={`bulk-upload-dropzone${drag ? ' is-drag' : ''}${file ? ' has-file' : ''}${disabled ? ' is-disabled' : ''}`}
      onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault()
        if (!disabled) setDrag(true)
      }}
      onDragLeave={(e) => {
        e.preventDefault()
        setDrag(false)
      }}
      onDrop={(e) => {
        e.preventDefault()
        setDrag(false)
        handleFile(e.dataTransfer.files?.[0])
      }}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          if (!disabled) inputRef.current?.click()
        }
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        disabled={disabled}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {file ? (
        <>
          <span className="bulk-upload-dropzone__emoji" aria-hidden>✅</span>
          <p className="bulk-upload-dropzone__filename">
            {file.name}{' '}
            <span className="bulk-upload-dropzone__size">
              ({(file.size / 1024 / 1024).toFixed(1)} MB)
            </span>
          </p>
        </>
      ) : (
        <>
          <span className="bulk-upload-dropzone__icon" aria-hidden>
            {Icon ? <Icon size={28} strokeWidth={1.5} /> : '📄'}
          </span>
          <p className="bulk-upload-dropzone__label">{label}</p>
          <p className="bulk-upload-dropzone__hint">{hint}</p>
        </>
      )}
    </div>
  )
}

function ProgressBar({ pct, tone = 'indigo' }) {
  return (
    <div className="bulk-upload-progress">
      <div className={`bulk-upload-progress__bar bulk-upload-progress__bar--${tone}`} style={{ width: `${Math.min(100, pct)}%` }} />
    </div>
  )
}

function StepBar({ steps, currentIdx }) {
  return (
    <div className="bulk-upload-steps">
      {steps.map((label, i) => {
        const done = i < currentIdx
        const active = i === currentIdx
        return (
          <div key={label} className="bulk-upload-steps__item">
            <div className={`bulk-upload-steps__node${done ? ' is-done' : ''}${active ? ' is-active' : ''}`}>
              {done ? '✓' : i + 1}
            </div>
            <span className={`bulk-upload-steps__label${done ? ' is-done' : ''}${active ? ' is-active' : ''}`}>
              {label}
            </span>
            {i < steps.length - 1 && (
              <div className={`bulk-upload-steps__line${done ? ' is-done' : ''}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export function AdminBulkUploadModal({ open, onOpenChange, onComplete }) {
  const [step, setStep] = useState('mode')
  const [imageMode, setImageMode] = useState(null)
  const [csvFile, setCsvFile] = useState(null)
  const [zipFile, setZipFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [previewError, setPreviewError] = useState(null)
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const [progressPct, setProgressPct] = useState(0)
  const [templateDownloading, setTemplateDownloading] = useState(false)

  const reset = () => {
    setStep('mode')
    setImageMode(null)
    setCsvFile(null)
    setZipFile(null)
    setPreview(null)
    setPreviewError(null)
    setResult(null)
    setBusy(false)
    setProgressPct(0)
  }

  const handleClose = (next) => {
    if (!next) reset()
    onOpenChange(next)
  }

  const selectMode = (mode) => {
    setImageMode(mode)
    setCsvFile(null)
    setZipFile(null)
    setPreview(null)
    setPreviewError(null)
    setStep('upload')
  }

  const handleDownloadTemplate = async () => {
    if (templateDownloading) return
    setTemplateDownloading(true)
    try {
      await downloadAdminBulkUploadTemplate()
      toast.success('Template downloaded')
    } catch (err) {
      toast.error(err?.message || 'Could not download template')
    } finally {
      setTemplateDownloading(false)
    }
  }

  const simulateProgress = () => {
    setProgressPct(0)
    const start = performance.now()
    const tick = (now) => {
      const elapsed = now - start
      const progress = 1 - Math.exp(-elapsed / 90000)
      setProgressPct(Math.round(Math.min(95, progress * 95)))
      if (elapsed < 120000) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }

  const handlePreview = async () => {
    if (!csvFile) {
      toast.error('Please select a CSV/Excel file first')
      return
    }
    setBusy(true)
    setPreviewError(null)
    simulateProgress()
    try {
      const fd = new FormData()
      fd.append('csv', csvFile)
      const raw = await previewAdminBulkCsv(fd)
      const normalized = normalizePreview(raw)
      setPreview(normalized)
      setStep('preview')
      setProgressPct(100)
    } catch (err) {
      setPreviewError(err?.message || 'Preview failed')
      toast.error(err?.message || 'Preview failed')
    } finally {
      setBusy(false)
    }
  }

  const handleImport = async () => {
    if (!csvFile) {
      toast.error('Please select a CSV/Excel file first')
      return
    }
    if (imageMode === 'zip' && !zipFile) {
      toast.error('Please select both Excel and ZIP files')
      return
    }
    setBusy(true)
    setStep('importing')
    simulateProgress()
    try {
      const fd = new FormData()
      fd.append('csv', csvFile)
      if (imageMode === 'zip' && zipFile) fd.append('imagesZip', zipFile)
      const raw = imageMode === 'zip'
        ? await importAdminBulkWithZip(fd)
        : await importAdminBulkCsv(fd)
      setProgressPct(100)
      setResult(raw)
      setStep('result')
      const inserted = raw?.insertedProducts ?? raw?.summary?.insertedProducts ?? 0
      const updated = raw?.updatedProducts ?? raw?.summary?.updatedProducts ?? 0
      const saved = inserted + updated
      const failed = raw?.failedCount ?? raw?.summary?.failedCount ?? 0
      if (failed === 0 && !raw?.aborted) {
        toast.success(`Import complete — ${fmt(saved)} product${saved !== 1 ? 's' : ''} saved`)
        onComplete?.()
      } else {
        toast.error(`${fmt(failed)} row(s) had errors. Check the result summary.`)
      }
    } catch (err) {
      setStep(imageMode === 'zip' && preview ? 'zip' : 'preview')
      toast.error(err?.message || 'Import failed')
    } finally {
      setBusy(false)
    }
  }

  const steps = imageMode === 'zip' ? STEPS_ZIP : STEPS_URL
  const stepIndexMap = {
    mode: 0,
    upload: 1,
    preview: 2,
    zip: 3,
    importing: imageMode === 'zip' ? 4 : 3,
    result: imageMode === 'zip' ? 4 : 3,
  }
  const currentStepIdx = stepIndexMap[step] ?? 0
  const tone = imageMode === 'zip' ? 'violet' : 'indigo'

  const footer = (
    <div className="bulk-upload-footer">
      <button type="button" className="bulk-upload-footer__cancel" onClick={() => handleClose(false)}>
        {step === 'result' ? 'Close' : 'Cancel'}
      </button>
      <div className="bulk-upload-footer__actions">
        {step === 'upload' && (
          <Button variant="ghost" size="sm" onClick={() => setStep('mode')}>← Back</Button>
        )}
        {step === 'preview' && imageMode === 'zip' && (
          <Button variant="ghost" size="sm" onClick={() => setStep('upload')}>← Back</Button>
        )}
        {step === 'zip' && (
          <Button variant="ghost" size="sm" onClick={() => setStep('preview')}>← Back</Button>
        )}

        {step === 'upload' && (
          <Button
            variant="primary"
            size="sm"
            disabled={!csvFile || busy}
            onClick={handlePreview}
            className={imageMode === 'zip' ? 'bulk-upload-btn--violet' : 'bulk-upload-btn--indigo'}
          >
            {busy ? 'Parsing…' : 'Preview →'}
          </Button>
        )}

        {step === 'preview' && imageMode === 'url' && (
          <Button
            variant="primary"
            size="sm"
            disabled={busy || !preview?.validCount || preview?.importBlocked || preview?.invalidCount > 0}
            onClick={handleImport}
            className="bulk-upload-btn--indigo"
          >
            {preview?.invalidCount > 0
              ? 'Fix errors to import'
              : `Import ${preview?.validCount || 0} product${preview?.validCount !== 1 ? 's' : ''} →`}
          </Button>
        )}

        {step === 'preview' && imageMode === 'zip' && (
          <Button
            variant="primary"
            size="sm"
            disabled={!preview?.validCount || preview?.importBlocked || preview?.invalidCount > 0 || busy}
            onClick={() => setStep('zip')}
            className="bulk-upload-btn--violet"
          >
            {preview?.invalidCount > 0 ? 'Fix errors first' : 'Upload ZIP →'}
          </Button>
        )}

        {step === 'zip' && (
          <Button
            variant="primary"
            size="sm"
            disabled={!csvFile || !zipFile || busy}
            onClick={handleImport}
            className="bulk-upload-btn--violet"
          >
            {busy ? 'Importing…' : `Import ${preview?.validCount || 0} product${preview?.validCount !== 1 ? 's' : ''} →`}
          </Button>
        )}
      </div>
    </div>
  )

  return (
    <Modal
      open={open}
      onOpenChange={handleClose}
      title="Bulk Product Upload"
      subtitle="Import products from Excel or CSV"
      className="modal-content--bulk-upload"
      footer={footer}
    >
      {step !== 'mode' && (
        <StepBar steps={steps} currentIdx={currentStepIdx} />
      )}

      <div className="bulk-upload-body">
        {step === 'mode' && (
          <div className="bulk-upload-mode">
            <div className="bulk-upload-template-banner">
              <div className="bulk-upload-template-banner__text">
                <h4>Need a template with dynamic dropdown values?</h4>
                <p>
                  Get a pre-formatted Excel template with dropdown lists for categories, status,
                  gstRate, isFragile, and more.
                </p>
              </div>
              <Button
                type="button"
                variant="primary"
                size="sm"
                className="bulk-upload-template-banner__btn"
                onClick={handleDownloadTemplate}
                disabled={templateDownloading}
              >
                {templateDownloading ? (
                  'Downloading…'
                ) : (
                  <>
                    <Download size={14} aria-hidden />
                    Download Excel Template
                  </>
                )}
              </Button>
            </div>

            <p className="bulk-upload-mode__prompt">How are you providing product images?</p>

            <div className="bulk-upload-mode__cards">
              <button type="button" className="bulk-upload-mode-card bulk-upload-mode-card--url" onClick={() => selectMode('url')}>
                <span className="bulk-upload-mode-card__icon bulk-upload-mode-card__icon--url" aria-hidden>
                  <Link2 size={28} strokeWidth={1.75} />
                </span>
                <strong className="bulk-upload-mode-card__title">Image URLs in Excel</strong>
                <p className="bulk-upload-mode-card__desc">
                  Your spreadsheet already has image URLs in the{' '}
                  <code>images</code> column. Upload just the Excel file — we fetch and upload images automatically.
                </p>
                <span className="bulk-upload-mode-card__cta">1 file upload →</span>
              </button>

              <button type="button" className="bulk-upload-mode-card bulk-upload-mode-card--zip" onClick={() => selectMode('zip')}>
                <span className="bulk-upload-mode-card__icon bulk-upload-mode-card__icon--zip" aria-hidden>
                  <Package size={28} strokeWidth={1.75} />
                </span>
                <strong className="bulk-upload-mode-card__title">Upload images separately</strong>
                <p className="bulk-upload-mode-card__desc">
                  Images are in a ZIP file. Each folder inside the ZIP is named after the product&apos;s{' '}
                  <strong>Product Code number</strong>. Drop the images inside their Product Code folder.
                </p>
                <span className="bulk-upload-mode-card__cta bulk-upload-mode-card__cta--zip">Excel + ZIP →</span>
              </button>
            </div>

            <div className="bulk-upload-requirements">
              <strong>Required columns:</strong>{' '}
              name, title, category, basePrice, Product Code — everything else is optional.
              Multi-variant products: repeat the product name on multiple rows, one row per variant.
              Per-row title, description, weight, length, width, height apply to that variant (product row 1 sets product defaults).
            </div>
          </div>
        )}

        {step === 'upload' && imageMode === 'url' && (
          <div className="bulk-upload-panel">
            <p className="bulk-upload-mode-hint bulk-upload-mode-hint--url">
              <Link2 size={14} aria-hidden />
              <span>
                <strong>Mode: Image URLs in Excel</strong> — Make sure your Excel has an{' '}
                <code>images</code> column with comma-separated URLs per row.
              </span>
            </p>
            <DropZone
              accept=".csv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              label="Drop your CSV / Excel file"
              hint="CSV or Excel — max 10 MB"
              icon={FileSpreadsheet}
              file={csvFile}
              onFile={setCsvFile}
              disabled={busy}
            />
            {previewError && <p className="bulk-upload-error">{previewError}</p>}
            {busy && (
              <div className="bulk-upload-progress-wrap">
                <div className="bulk-upload-progress-meta">
                  <span>Parsing file…</span>
                  <span>{progressPct}%</span>
                </div>
                <ProgressBar pct={progressPct} tone={tone} />
              </div>
            )}
          </div>
        )}

        {step === 'upload' && imageMode === 'zip' && (
          <div className="bulk-upload-panel">
            <p className="bulk-upload-mode-hint bulk-upload-mode-hint--zip">
              <Package size={14} aria-hidden />
              <span>
                <strong>Mode: Separate ZIP images</strong> — Upload your Excel first to preview products,
                then you&apos;ll upload the ZIP file.
              </span>
            </p>
            <DropZone
              accept=".csv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              label="Drop your CSV / Excel file"
              hint="CSV or Excel — max 10 MB"
              icon={FileSpreadsheet}
              file={csvFile}
              onFile={setCsvFile}
              disabled={busy}
            />
            {previewError && <p className="bulk-upload-error">{previewError}</p>}
            {busy && (
              <div className="bulk-upload-progress-wrap">
                <div className="bulk-upload-progress-meta">
                  <span>Parsing file…</span>
                  <span>{progressPct}%</span>
                </div>
                <ProgressBar pct={progressPct} tone={tone} />
              </div>
            )}
          </div>
        )}

        {step === 'preview' && preview && (
          <div className="bulk-upload-panel">
            <div className="bulk-upload-preview-stats">
              {[
                { label: 'Total products', value: preview.totalProducts, tone: 'default' },
                { label: 'Valid', value: preview.validCount, tone: 'success' },
                { label: 'Has errors', value: preview.invalidCount, tone: 'error' },
              ].map(({ label, value, tone: t }) => (
                <div key={label} className="bulk-upload-preview-stat">
                  <div className={`bulk-upload-preview-stat__value bulk-upload-preview-stat__value--${t}`}>
                    {fmt(value)}
                  </div>
                  <div className="bulk-upload-preview-stat__label">{label}</div>
                </div>
              ))}
            </div>

            {imageMode === 'url' && preview.hasImageUrls && (
              <p className="bulk-upload-notice bulk-upload-notice--success">
                Image URLs detected — they&apos;ll be downloaded and uploaded on import.
              </p>
            )}
            {imageMode === 'url' && !preview.hasImageUrls && (
              <p className="bulk-upload-notice bulk-upload-notice--warn">
                No image URLs found. Products will be imported without images.
              </p>
            )}

            <div className="bulk-upload-table-wrap">
              <table className="bulk-upload-table">
                <thead>
                  <tr>
                    {['Product', 'Category', 'Variants', 'Product Codes', 'Qty', 'Images', 'Status'].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.products.length > 0 ? (
                    preview.products.slice(0, 50).map((p, i) => (
                      <tr key={i} className={p.errors?.length ? 'has-error' : ''}>
                        <td>{p.name || '—'}</td>
                        <td>{p.category || '—'}</td>
                        <td className="is-center">{p.variantCount ?? p.variants ?? '—'}</td>
                        <td>{p.productCodes || p.productCode || '—'}</td>
                        <td className="is-center">{p.quantity ?? '—'}</td>
                        <td className="is-center">
                          {imageMode === 'url' ? (p.imageUrlCount ?? '—') : '(ZIP)'}
                        </td>
                        <td>
                          {p.errors?.length ? (
                            <span className="bulk-upload-status bulk-upload-status--error">Errors</span>
                          ) : (
                            <span className="bulk-upload-status bulk-upload-status--ok">Valid</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="bulk-upload-table__empty">No products in preview.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {step === 'zip' && (
          <div className="bulk-upload-panel">
            <p className="bulk-upload-mode-hint bulk-upload-mode-hint--zip">
              <Archive size={14} aria-hidden />
              <span>
                <strong>Upload your images ZIP</strong> — Folders must match Product Code numbers from your Excel.
              </span>
            </p>
            <DropZone
              accept=".zip,application/zip"
              label="Drop your images ZIP file"
              hint="ZIP file — max 200 MB"
              icon={Archive}
              file={zipFile}
              onFile={setZipFile}
              disabled={busy}
            />
          </div>
        )}

        {step === 'importing' && (
          <div className="bulk-upload-panel bulk-upload-panel--center">
            <p className="bulk-upload-importing-title">Importing products…</p>
            <p className="bulk-upload-importing-sub">This may take a minute for large files.</p>
            <ProgressBar pct={progressPct} tone={tone} />
            <p className="bulk-upload-progress-meta is-center">{progressPct}%</p>
          </div>
        )}

        {step === 'result' && result && (
          <div className="bulk-upload-panel">
            <div className="bulk-upload-preview-stats">
              {[
                { label: 'Inserted', value: result.insertedProducts ?? result.summary?.insertedProducts ?? 0, tone: 'success' },
                { label: 'Updated', value: result.updatedProducts ?? result.summary?.updatedProducts ?? 0, tone: 'default' },
                { label: 'Failed', value: result.failedCount ?? result.summary?.failedCount ?? 0, tone: 'error' },
              ].map(({ label, value, tone: t }) => (
                <div key={label} className="bulk-upload-preview-stat">
                  <div className={`bulk-upload-preview-stat__value bulk-upload-preview-stat__value--${t}`}>
                    {fmt(value)}
                  </div>
                  <div className="bulk-upload-preview-stat__label">{label}</div>
                </div>
              ))}
            </div>
            {result.message && <p className="bulk-upload-notice">{result.message}</p>}
          </div>
        )}
      </div>
    </Modal>
  )
}
