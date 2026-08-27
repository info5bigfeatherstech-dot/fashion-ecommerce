import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

/**
 * User-facing 404 for unmatched storefront routes.
 */
export default function NotFound() {
  return (
    <div className="container" style={{ paddingBlock: 'clamp(3rem, 8vw, 5rem)', textAlign: 'center' }}>
      <p className="eyebrow" style={{ marginBottom: '0.75rem' }}>404</p>
      <h1 style={{ marginBottom: '0.75rem' }}>Page not found</h1>
      <p className="body-sm" style={{ color: 'var(--color-neutral)', marginBottom: '1.5rem', maxWidth: 420, marginInline: 'auto' }}>
        The page you’re looking for doesn’t exist or may have moved. Continue shopping from our collections.
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
