import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import ReflectCard from '@/components/effects/ReflectCard'
import { CATEGORY_STRIP } from '@/config/site'

const PAGE_SIZE = 7

function chunk(items, size) {
  const pages = []
  for (let i = 0; i < items.length; i += size) {
    pages.push(items.slice(i, i + size))
  }
  return pages
}

export function CategoryStripSection() {
  const trackRef = useRef(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)
  const pages = useMemo(() => chunk(CATEGORY_STRIP, PAGE_SIZE), [])

  const updateArrows = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    const maxScroll = el.scrollWidth - el.clientWidth
    setCanPrev(el.scrollLeft > 8)
    setCanNext(el.scrollLeft < maxScroll - 8)
  }, [])

  useEffect(() => {
    updateArrows()
    window.addEventListener('resize', updateArrows)
    return () => window.removeEventListener('resize', updateArrows)
  }, [updateArrows])

  const scrollPage = (dir) => {
    const el = trackRef.current
    if (!el) return
    el.scrollBy({ left: dir * el.clientWidth, behavior: 'smooth' })
  }

  return (
    <section className="section container">
      <div className="section-header">
        <div>
          <p className="heading-sm text-accent">Jewelry Categories</p>
          <h2 className="display-md">Browse Our Artificial Jewelry</h2>
        </div>
      </div>

      <div className="category-strip-wrap">
        <button
          type="button"
          className="category-strip__btn category-strip__btn--prev"
          onClick={() => scrollPage(-1)}
          disabled={!canPrev}
          aria-label="Previous categories"
        >
          <ChevronLeft size={22} />
        </button>

        <div
          className="category-strip"
          ref={trackRef}
          onScroll={updateArrows}
        >
          {pages.map((page, pageIndex) => (
            <div key={pageIndex} className="category-strip__page">
              {page.map((cat) => (
                <Link
                  key={`${cat.slug}-${cat.label}`}
                  to={`/shop/${cat.slug}`}
                  className="category-strip__item"
                >
                  <ReflectCard className="category-strip__card">
                    <div className="category-strip__media">
                      <img src={cat.image} alt={cat.label} />
                    </div>
                    <div className="category-strip__content">
                      <span className="category-strip__label">{cat.label}</span>
                      <p className="category-strip__desc">
                        {cat.description || 'Artificial jewelry styles for every occasion.'}
                      </p>
                    </div>
                  </ReflectCard>
                </Link>
              ))}
            </div>
          ))}
        </div>

        <button
          type="button"
          className="category-strip__btn category-strip__btn--next"
          onClick={() => scrollPage(1)}
          disabled={!canNext}
          aria-label="Next categories"
        >
          <ChevronRight size={22} />
        </button>
      </div>
    </section>
  )
}
