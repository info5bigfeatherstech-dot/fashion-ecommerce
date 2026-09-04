import { useMemo, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ChevronRight, ArrowLeft, Layers, Sparkles } from 'lucide-react'
import { Reveal, ScrollRevealText } from '@/components/motion/ScrollRevealText'
import { useApiCategories } from '@/features/category/hooks'
import { slugFromShopHref } from '@/features/category/nav'
import { useProductsByCategory } from '@/features/product/hooks'
import { ProductCard } from '@/features/product/components/ProductCard'
import { formatPrice } from '@/lib/utils'

const PRODUCTS_PER_CATEGORY_ROW = 4

function CategoryProductRow({ category }) {
  const slug = category.slug || slugFromShopHref(category.href) || category.id
  const shopHref = `/shop/${slug}`
  const { data, isLoading } = useProductsByCategory(slug, {
    page: 1,
    limit: PRODUCTS_PER_CATEGORY_ROW,
  })
  const products = data?.products || []

  if (!isLoading && products.length === 0) return null

  return (
    <section className="product-all-row" aria-labelledby={`product-all-${slug}`}>
      <div className="product-all-row__head">
        <h2 id={`product-all-${slug}`} className="product-all-row__title">
          <Link
            to={shopHref}
            className="product-all-row__title-btn"
            aria-label={`View all ${category.label} products`}
          >
            {category.label}
          </Link>
        </h2>
        <Link
          to={shopHref}
          className="product-all-row__view-all"
          aria-label={`View all ${category.label}`}
        >
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

function CategorySingleView({ category, onBackToAll }) {
  const slug = category.slug || slugFromShopHref(category.href) || category.id
  const { data, isLoading } = useProductsByCategory(slug, {
    page: 1,
    limit: 60,
  })
  const products = data?.products || []

  return (
    <div className="product-all-single-view" aria-labelledby="product-all-category-heading">
      <div className="product-all-single-view__header">
        <div className="product-all-single-view__title-wrap">
          {category.image ? (
            <div className="product-all-single-view__avatar">
              <img src={category.image} alt={category.label} />
            </div>
          ) : null}
          <div>
            <p className="product-all-page__eyebrow">
              <span className="product-all-page__eyebrow-rule" aria-hidden="true" />
              Category Collection
            </p>
            <h1 id="product-all-category-heading" className="display-md product-all-single-view__title">
              {category.label}
            </h1>
            <p className="product-all-single-view__count">
              {isLoading
                ? 'Loading collection…'
                : `${products.length} product${products.length === 1 ? '' : 's'} available`}
            </p>
          </div>
        </div>

        <button
          type="button"
          className="product-all-single-view__back-btn"
          onClick={onBackToAll}
          aria-label="Back to all categories"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          <span>All Categories</span>
        </button>
      </div>

      {isLoading ? (
        <div className="grid-4 product-all-grid--loading" aria-hidden="true">
          {Array.from({ length: 8 }, (_, i) => (
            <div
              key={i}
              className="product-all-row__skeleton"
              style={{ aspectRatio: '3/4', borderRadius: 'var(--radius-md, 8px)' }}
            />
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid-4 product-all-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="product-all-empty">
          <Sparkles className="product-all-empty__icon" size={36} aria-hidden="true" />
          <h2 className="product-all-empty__title">No products found in {category.label}</h2>
          <p className="product-all-empty__text">
            We are restocking new styles in this category. Explore our other collections in the meantime.
          </p>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={onBackToAll}
          >
            Explore Other Categories
          </button>
        </div>
      )}
    </div>
  )
}

export default function ProductAll() {
  const { data: categories = [], isLoading, isError } = useApiCategories()
  const [searchParams, setSearchParams] = useSearchParams()
  const pillsRef = useRef(null)

  const selectedCategorySlug = searchParams.get('category') || null

  const selectedCategory = useMemo(() => {
    if (!selectedCategorySlug) return null
    return (
      categories.find((c) => {
        const slug = c.slug || slugFromShopHref(c.href) || c.id
        return String(slug).toLowerCase() === String(selectedCategorySlug).toLowerCase()
      }) || null
    )
  }, [categories, selectedCategorySlug])

  const handleSelectCategory = (slug) => {
    const nextParams = new URLSearchParams(searchParams)
    if (slug) {
      nextParams.set('category', slug)
    } else {
      nextParams.delete('category')
    }
    setSearchParams(nextParams)

    // Smooth scroll to top of section
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="product-all-page">
      <div className="container">
        <section className="product-all-page__hero">
          <div className="product-all-page__hero-inner">
            <Reveal>
              <p className="product-all-page__eyebrow">
                <span className="product-all-page__eyebrow-rule" aria-hidden="true" />
                Collections
              </p>
            </Reveal>
            <ScrollRevealText as="h1" className="display-md product-all-page__title">
              {selectedCategory ? (
                <>
                  Collection:{' '}
                  <span className="heading-accent heading-accent--gold">
                    {selectedCategory.label}
                  </span>
                </>
              ) : (
                <>
                  Shop <span className="heading-accent heading-accent--gold">All Products</span>
                </>
              )}
            </ScrollRevealText>
            <Reveal delay={0.08}>
              <p className="product-all-page__lead">
                {selectedCategory
                  ? `Explore our complete range of ${selectedCategory.label.toLowerCase()} handcrafted for everyday elegance and celebrations.`
                  : 'Browse every category — select a category name to explore all its products, or browse below.'}
              </p>
            </Reveal>
          </div>
        </section>
      </div>

      <section className="product-all-page__sections" aria-label="Products by category">
        <div className="container">
          {isLoading ? (
            <p className="product-all-page__status">Loading categories and products…</p>
          ) : null}

          {isError && !categories.length ? (
            <p className="product-all-page__status product-all-page__status--error">
              Unable to load categories right now. Please try again.
            </p>
          ) : null}

          {!isLoading && selectedCategory ? (
            <CategorySingleView
              category={selectedCategory}
              onBackToAll={() => handleSelectCategory(null)}
            />
          ) : null}

          {!isLoading && !selectedCategory && categories.length > 0
            ? categories.map((category) => (
              <CategoryProductRow
                key={category.id}
                category={category}
              />
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
