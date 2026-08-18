import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { searchProducts } from '../api'

export function SearchBar({ className, iconRight = false, autoFocus = false }) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()
  const wrapperRef = useRef(null)
  const inputRef = useRef(null)

  const { data: results = [] } = useQuery({
    queryKey: ['search', query],
    queryFn: () => searchProducts(query),
    enabled: query.length >= 2,
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
          placeholder="Search products..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          aria-label="Search products"
        />
      </form>
      {isOpen && query.length >= 2 && results.length > 0 && (
        <Autosuggest results={results} onSelect={() => setIsOpen(false)} />
      )}
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
          <img src={product.images[0]} alt="" className="search-suggest__thumb" />
          <div>
            <p className="body-sm" style={{ fontWeight: 'var(--weight-medium)' }}>{product.name}</p>
            <p className="body-sm text-muted">{product.category}</p>
          </div>
        </button>
      ))}
    </div>
  )
}
