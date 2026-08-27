import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

/**
 * Production-friendly route error UI (replaces React Router default dump).
 */
export function RouteErrorBoundary() {
  const error = useRouteError()

  const is404 = isRouteErrorResponse(error) && error.status === 404
  const title = is404 ? 'Page not found' : 'Something went wrong'
  const detail = is404
    ? 'This link may be outdated or the page was moved.'
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
      <p className="body-sm" style={{ color: 'var(--color-neutral)', marginBottom: '1.5rem', maxWidth: 420, marginInline: 'auto' }}>
        {detail}
      </p>
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Button asChild variant="primary">
          <Link to="/">Go home</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link to="/shop">Shop all</Link>
        </Button>
      </div>
    </div>
  )
}
