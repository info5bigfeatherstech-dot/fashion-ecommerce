import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

function isChunkLoadError(error) {
  const msg = String(error?.message || error || '')
  return (
    /Failed to fetch dynamically imported module/i.test(msg)
    || /Importing a module script failed/i.test(msg)
    || /Loading chunk [\d]+ failed/i.test(msg)
    || error?.name === 'ChunkLoadError'
  )
}

/**
 * Production-friendly route error UI (replaces React Router default dump).
 */
export function RouteErrorBoundary() {
  const error = useRouteError()

  const is404 = isRouteErrorResponse(error) && error.status === 404
  const chunkFail = !is404 && isChunkLoadError(error)
  const title = is404
    ? 'Page not found'
    : chunkFail
      ? 'Page needs a refresh'
      : 'Something went wrong'
  const detail = is404
    ? 'This link may be outdated or the page was moved.'
    : chunkFail
      ? 'A newer version of the site may have loaded. Refresh once and try again.'
      : 'Please try again, or head back to the shop while we sort this out.'

  if (import.meta.env.DEV && error && !is404) {
    console.error('[RouteErrorBoundary]', error)
  }

  return (
    <div className="container" style={{ paddingBlock: 'clamp(3rem, 8vw, 5rem)', textAlign: 'center' }}>
      <p className="eyebrow" style={{ marginBottom: '0.75rem' }}>
        {is404 ? '404' : 'Error'}
      </p>
      <h1 style={{ marginBottom: '0.75rem' }}>{title}</h1>
      <p
        className="body-sm"
        style={{
          color: 'var(--color-neutral)',
          marginBottom: '1.5rem',
          maxWidth: 420,
          marginInline: 'auto',
        }}
      >
        {detail}
      </p>
      {error && !is404 && import.meta.env.DEV && (
        <pre
          style={{
            maxWidth: 680,
            margin: '0 auto 1.5rem',
            padding: '12px 16px',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: 8,
            color: '#b91c1c',
            textAlign: 'left',
            fontSize: '12px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {error?.message || String(error)}
          {error?.stack ? `\n\n${error.stack}` : ''}
        </pre>
      )}
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        {chunkFail ? (
          <Button type="button" variant="primary" onClick={() => window.location.reload()}>
            Refresh page
          </Button>
        ) : null}
        <Button asChild variant={chunkFail ? 'secondary' : 'primary'}>
          <Link to="/">Go home</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link to="/shop">Shop all</Link>
        </Button>
      </div>
    </div>
  )
}
