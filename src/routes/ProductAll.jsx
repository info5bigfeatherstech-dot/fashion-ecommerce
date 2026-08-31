import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { Reveal, ScrollRevealText } from '@/components/motion/ScrollRevealText'
import { useCircleCategories } from '@/features/category/hooks'
import { slugFromShopHref } from '@/features/category/nav'
import { useProductsByCategory } from '@/features/product/hooks'
import { formatPrice } from '@/lib/utils'

const PRODUCTS_PER_CATEGORY = 4

function CategoryProductRow({ category }) {
  const slug = slugFromShopHref(category.href) || category.id
  const { data, isLoading } = useProductsByCategory(slug, {
    page: 1,
    limit: PRODUCTS_PER_CATEGORY,
  })
  const products = data?.products || []

  if (!isLoading && products.length === 0) return null

  return (
    <section className="product-all-row" aria-labelledby={`product-all-${slug}`}>
      <div className="product-all-row__head">
        <h2 id={`product-all-${slug}`} className="product-all-row__title">
          <Link to={category.href}>{category.label}</Link>
        </h2>
        <Link to={category.href} className="product-all-row__view-all">
          View all <ChevronRight size={14} aria-hidden />
        </Link>
      </div>

      {isLoading ? (
        <div className="product-all-row__track product-all-row__track--loading" aria-hidden="true">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="product-all-row__skeleton" />
          ))}
        </div>
      ) : (
        <ul className="product-all-row__track">
          {products.map((product) => (
            <li key={product.id} className="product-all-row__item">
              <Link
                to={`/product/${product.slug}`}
                className="product-all-row__card"
                aria-label={product.name || product.title}
              >
                <span className="product-all-row__image">
                  {product.image || product.images?.[0] ? (
                    <img
                      src={product.image || product.images?.[0]}
                      alt={product.name || product.title || ''}
                      loading="lazy"
                    />
                  ) : (
                    <span className="product-all-row__image-fallback" />
                  )}
                </span>
                <span className="product-all-row__meta">
                  <span className="product-all-row__name">
                    {product.name || product.title}
                  </span>
                  {product.price != null ? (
                    <span className="product-all-row__price">{formatPrice(product.price)}</span>
                  ) : null}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default function ProductAll() {
  const { data: categories = [], isLoading, isError } = useCircleCategories()

  return (
    <div className="product-all-page">
      <section className="product-all-page__hero">
        <div className="container product-all-page__hero-inner">
          <Reveal>
            <p className="product-all-page__eyebrow">
              <span className="product-all-page__eyebrow-rule" aria-hidden="true" />
              Collections
            </p>
          </Reveal>
          <ScrollRevealText as="h1" className="display-md product-all-page__title">
            Shop <span className="heading-accent heading-accent--gold">All Products</span>
          </ScrollRevealText>
          <Reveal delay={0.08}>
            <p className="product-all-page__lead">
              Browse every category — tap a product or open the full collection.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="product-all-page__sections" aria-label="Products by category">
        <div className="container">
          {isLoading ? (
            <p className="product-all-page__status">Loading categories…</p>
          ) : null}

          {isError && !categories.length ? (
            <p className="product-all-page__status product-all-page__status--error">
              Unable to load categories right now. Please try again.
            </p>
          ) : null}

          {!isLoading && categories.length > 0
            ? categories.map((category) => (
                <CategoryProductRow key={category.id} category={category} />
              ))
            : null}

          {!isLoading && !isError && categories.length === 0 ? (
            <p className="product-all-page__status">No categories available yet.</p>
          ) : null}
        </div>
      </section>
    </div>
  )
}
