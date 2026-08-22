/** Lightweight route fallback while lazy chunks load. */
export function PageLoader({ label = 'Loading…' }) {
  return (
    <div className="page-loader" role="status" aria-live="polite">
      <span className="page-loader__spinner" aria-hidden="true" />
      <p className="body-sm text-muted">{label}</p>
    </div>
  )
}
