import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { useCircleCategories } from '@/features/category/hooks'
import { slugFromShopHref } from '@/features/category/nav'
import {
  PRICE_RANGES,
  MAIN_COLOR_OPTIONS,
  PLATING_OPTIONS,
  DISCOUNT_OPTIONS,
} from '../api'

function ChipGroup({ children }) {
  return <div className="filter-chips">{children}</div>
}

function FilterChip({ active, onClick, children }) {
  return (
    <button
      type="button"
      className={`filter-chip ${active ? 'filter-chip--active' : ''}`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

export function ProductFilters({
  category,
  subcategory,
  categoryInfo,
  priceKey,
  color,
  plating,
  discount,
  onPriceChange,
  onColorChange,
  onPlatingChange,
  onDiscountChange,
  onClear,
}) {
  const navigate = useNavigate()
  const { data: apiCategories = [] } = useCircleCategories()
  const subcategories = categoryInfo?.children || []
  const typeValue = subcategory || 'all'

  const categoryOptions = useMemo(() => {
    const fromApi = apiCategories
      .map((item) => {
        const slug = slugFromShopHref(item.href)
        if (!slug) return null
        return { slug, label: item.label }
      })
      .filter(Boolean)

    if (!category) return fromApi
    if (fromApi.some((item) => item.slug === category)) return fromApi

    // Keep current URL category selectable even if API briefly lags
    return [
      {
        slug: category,
        label: categoryInfo?.label || String(category).replace(/-/g, ' '),
      },
      ...fromApi,
    ]
  }, [apiCategories, category, categoryInfo?.label])

  const activeCategory = category || categoryOptions[0]?.slug || ''

  return (
    <aside className="plp-sidebar" aria-label="Product filters">
      <div className="plp-sidebar__head">
        <h2 className="plp-sidebar__title">Filters</h2>
        <button type="button" className="plp-sidebar__clear" onClick={onClear}>
          Clear all
        </button>
      </div>

      {categoryOptions.length > 0 ? (
        <div className="filter-field">
          <label className="filter-field__label" htmlFor="filter-category">Category</label>
          <div className="filter-field__desktop">
            <Select
              value={activeCategory}
              onValueChange={(value) => navigate(`/shop/${value}`)}
            >
              <SelectTrigger id="filter-category" aria-label="Category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((item) => (
                  <SelectItem key={item.slug} value={item.slug}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <ChipGroup>
            {categoryOptions.map((item) => (
              <FilterChip
                key={item.slug}
                active={activeCategory === item.slug}
                onClick={() => navigate(`/shop/${item.slug}`)}
              >
                {item.label}
              </FilterChip>
            ))}
          </ChipGroup>
        </div>
      ) : null}

      {subcategories.length > 0 && (
        <div className="filter-field">
          <label className="filter-field__label" htmlFor="filter-type">Type</label>
          <div className="filter-field__desktop">
            <Select
              value={typeValue}
              onValueChange={(value) => {
                navigate(value === 'all' ? `/shop/${category}` : `/shop/${category}/${value}`)
              }}
            >
              <SelectTrigger id="filter-type" aria-label="Type">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All {categoryInfo?.label}</SelectItem>
                {subcategories.map((child) => (
                  <SelectItem key={child.slug} value={child.slug}>
                    {child.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <ChipGroup>
            <FilterChip
              active={typeValue === 'all'}
              onClick={() => navigate(`/shop/${category}`)}
            >
              All
            </FilterChip>
            {subcategories.map((child) => (
              <FilterChip
                key={child.slug}
                active={typeValue === child.slug}
                onClick={() => navigate(`/shop/${category}/${child.slug}`)}
              >
                {child.label}
              </FilterChip>
            ))}
          </ChipGroup>
        </div>
      )}

      <div className="filter-field">
        <label className="filter-field__label" htmlFor="filter-price">Price Range</label>
        <div className="filter-field__desktop">
          <Select value={priceKey || 'all'} onValueChange={onPriceChange}>
            <SelectTrigger id="filter-price" aria-label="Price Range">
              <SelectValue placeholder="All prices" />
            </SelectTrigger>
            <SelectContent>
              {PRICE_RANGES.map((range) => (
                <SelectItem key={range.key} value={range.key}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <ChipGroup>
          {PRICE_RANGES.map((range) => (
            <FilterChip
              key={range.key}
              active={(priceKey || 'all') === range.key}
              onClick={() => onPriceChange(range.key)}
            >
              {range.label}
            </FilterChip>
          ))}
        </ChipGroup>
      </div>

      <div className="filter-field">
        <label className="filter-field__label" htmlFor="filter-color">Main Color</label>
        <div className="filter-field__desktop">
          <Select
            value={color || 'all'}
            onValueChange={(value) => onColorChange(value === 'all' ? '' : value)}
          >
            <SelectTrigger id="filter-color" aria-label="Main Color">
              <SelectValue placeholder="All colors" />
            </SelectTrigger>
            <SelectContent>
              {MAIN_COLOR_OPTIONS.map((option) => (
                <SelectItem key={option.value || 'all'} value={option.value || 'all'}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <ChipGroup>
          {MAIN_COLOR_OPTIONS.map((option) => (
            <FilterChip
              key={option.value || 'all'}
              active={(color || '') === option.value}
              onClick={() => onColorChange(option.value)}
            >
              {option.label}
            </FilterChip>
          ))}
        </ChipGroup>
      </div>

      <div className="filter-field">
        <label className="filter-field__label" htmlFor="filter-plating">Plating / Metal Color</label>
        <div className="filter-field__desktop">
          <Select
            value={plating || 'all'}
            onValueChange={(value) => onPlatingChange(value === 'all' ? '' : value)}
          >
            <SelectTrigger id="filter-plating" aria-label="Plating / Metal Color">
              <SelectValue placeholder="All plating" />
            </SelectTrigger>
            <SelectContent>
              {PLATING_OPTIONS.map((option) => (
                <SelectItem key={option.value || 'all'} value={option.value || 'all'}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <ChipGroup>
          {PLATING_OPTIONS.map((option) => (
            <FilterChip
              key={option.value || 'all'}
              active={(plating || '') === option.value}
              onClick={() => onPlatingChange(option.value)}
            >
              {option.label}
            </FilterChip>
          ))}
        </ChipGroup>
      </div>

      <div className="filter-field">
        <label className="filter-field__label" htmlFor="filter-discount">Discount</label>
        <div className="filter-field__desktop">
          <Select
            value={discount || 'all'}
            onValueChange={(value) => onDiscountChange(value === 'all' ? '' : value)}
          >
            <SelectTrigger id="filter-discount" aria-label="Discount">
              <SelectValue placeholder="All discounts" />
            </SelectTrigger>
            <SelectContent>
              {DISCOUNT_OPTIONS.map((option) => (
                <SelectItem key={option.value || 'all'} value={option.value || 'all'}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <ChipGroup>
          {DISCOUNT_OPTIONS.map((option) => (
            <FilterChip
              key={option.value || 'all'}
              active={(discount || '') === option.value}
              onClick={() => onDiscountChange(option.value)}
            >
              {option.label}
            </FilterChip>
          ))}
        </ChipGroup>
      </div>
    </aside>
  )
}
