import { Link } from 'react-router-dom'
import { DEALS } from '@/config/site'

export function DealsSection() {
  return (
    <section className="section container">
      <div className="section-header">
        <div>
          <h2 className="display-md">Deals on <span className="heading-accent">Artificial Jewelry</span></h2>
          <p className="section-subheader">
            Limited-time offers on bestsellers, festive sets, and everyday jewelry essentials.
          </p>
        </div>
        <Link to="/shop/sale" className="section-header__link">View All Deals</Link>
      </div>
      <div className="grid-4">
        {DEALS.map((deal) => (
          <Link key={deal.slug} to={`/shop/${deal.slug}`} className="deal-card">
            <p className="deal-card__tag">{deal.tag}</p>
            <h3 className="deal-card__title">{deal.title}</h3>
            <p className="body-sm text-muted">{deal.description}</p>
          </Link>
        ))}
      </div>
      <p className="section-footnote">
        Offers change often — shop while stocks last and save on the pieces you love.
      </p>
    </section>
  )
}
