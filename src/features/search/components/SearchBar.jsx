import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Search, Sparkles } from 'lucide-react'
import { searchProducts } from '../api'
import { searchKeys } from '../queryKeys'
import { formatPrice } from '@/lib/utils'

export function SearchBar({ className, iconRight = false, autoFocus = false }) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()
  const wrapperRef = useRef(null)
  const inputRef = useRef(null)

  const { data: results = [] } = useQuery({
    queryKey: searchKeys.query(query, { limit: 6 }),
    queryFn: ({ signal }) => searchProducts(query, { signal, limit: 6 }),
    enabled: query.trim().length >= 2,
  })

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (query.trim()) {
      navigate(`/shop?q=${encodeURIComponent(query.trim())}`)
      setIsOpen(false)
    }
  }

  return (
    <div className={`search-bar ${iconRight ? 'search-bar--icon-right' : ''} ${className || ''}`} ref={wrapperRef}>
      <form onSubmit={handleSubmit}>
        <Search size={16} className="search-bar__icon" />
        <input
          ref={inputRef}
          type="search"
          className="search-bar__input"
          placeholder="Search Products..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          aria-label="Search Products"
        />
      </form>
      {isOpen && query.trim().length >= 2 && results.length > 0 && (
        <Autosuggest results={results} onSelect={() => setIsOpen(false)} />
      )}
    </div>
  )
}

function SuggestThumb({ src, alt }) {
  const [hasError, setHasError] = useState(false)

  if (src && !hasError) {
    return (
      <img
        src={src}
        alt={alt || ''}
        className="search-suggest__thumb"
        onError={() => setHasError(true)}
        loading="lazy"
      />
    )
  }

  return (
    <div className="search-suggest__thumb search-suggest__thumb--empty" aria-hidden="true">
      <Sparkles size={16} className="search-suggest__empty-icon" />
    </div>
  )
}

export function Autosuggest({ results, onSelect }) {
  const navigate = useNavigate()

  return (
    <div className="search-suggest" role="listbox">
      {results.map((product) => (
        <button
          key={product.id}
          className="search-suggest__item"
          role="option"
          onClick={() => {
            navigate(`/product/${product.slug}`)
            onSelect()
          }}
        >
          <SuggestThumb src={product.images?.[0]} alt={product.name} />
          <div className="search-suggest__info">
            <p className="body-sm search-suggest__name" style={{ fontWeight: 'var(--weight-medium)' }}>
              {product.name}
            </p>
            <div className="search-suggest__meta">
              <span className="search-suggest__category">
                {product.categoryLabel || product.category}
              </span>
              {product.price != null && !Number.isNaN(Number(product.price)) && (
                <>
                  <span className="search-suggest__dot" aria-hidden="true">·</span>
                  <span className="search-suggest__price">
                    {formatPrice(product.price)}
                  </span>
                </>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}
