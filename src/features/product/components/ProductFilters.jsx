import { useNavigate } from 'react-router-dom'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import { Button } from '@/components/ui/Button'
import {
  PRICE_RANGES,
  BADGE_OPTIONS,
  SIZE_OPTIONS,
  COLOR_OPTIONS,
  TOP_CATEGORIES,
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
  badge,
  size,
  color,
  onSale,
  onPriceChange,
  onBadgeChange,
  onSizeChange,
  onColorChange,
  onSaleChange,
  onClear,
}) {
  const navigate = useNavigate()
  const subcategories = categoryInfo?.children || []
  const typeValue = subcategory || 'all'

  return (
    <aside className="plp-sidebar" aria-label="Product filters">
      <div className="plp-sidebar__head">
        <h2 className="plp-sidebar__title">Filters</h2>
        <button type="button" className="plp-sidebar__clear" onClick={onClear}>
          Clear all
        </button>
      </div>

      {/* ── Category ── */}
      <div className="filter-field">
        <label className="filter-field__label" htmlFor="filter-category">Category</label>
        <div className="filter-field__desktop">
          <Select
            value={category || TOP_CATEGORIES[0].slug}
            onValueChange={(value) => navigate(`/shop/${value}`)}
          >
            <SelectTrigger id="filter-category" aria-label="Category">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {TOP_CATEGORIES.map((item) => (
                <SelectItem key={item.slug} value={item.slug}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <ChipGroup>
          {TOP_CATEGORIES.map((item) => (
            <FilterChip
              key={item.slug}
              active={(category || TOP_CATEGORIES[0].slug) === item.slug}
              onClick={() => navigate(`/shop/${item.slug}`)}
            >
              {item.label}
            </FilterChip>
          ))}
        </ChipGroup>
      </div>

      {/* ── Type ── */}
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

      {/* ── Price ── */}
      <div className="filter-field">
        <label className="filter-field__label" htmlFor="filter-price">Price</label>
        <div className="filter-field__desktop">
          <Select value={priceKey} onValueChange={onPriceChange}>
            <SelectTrigger id="filter-price" aria-label="Price">
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
              active={priceKey === range.key}
              onClick={() => onPriceChange(range.key)}
            >
              {range.label}
            </FilterChip>
          ))}
        </ChipGroup>
      </div>

      {/* ── Status ── */}
      <div className="filter-field">
        <label className="filter-field__label" htmlFor="filter-status">Status</label>
        <div className="filter-field__desktop">
          <Select value={badge || 'all'} onValueChange={(value) => onBadgeChange(value === 'all' ? '' : value)}>
            <SelectTrigger id="filter-status" aria-label="Status">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              {BADGE_OPTIONS.map((option) => (
                <SelectItem key={option.value || 'all'} value={option.value || 'all'}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <ChipGroup>
          {BADGE_OPTIONS.map((option) => (
            <FilterChip
              key={option.value || 'all'}
              active={(badge || '') === option.value}
              onClick={() => onBadgeChange(option.value)}
            >
              {option.label}
            </FilterChip>
          ))}
        </ChipGroup>
      </div>

      {/* ── Size ── */}
      <div className="filter-field">
        <label className="filter-field__label">Size</label>
        <div className="filter-field__desktop">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm" className="select-trigger">
                {size || 'All sizes'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Size</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {SIZE_OPTIONS.map((option) => (
                <DropdownMenuCheckboxItem
                  key={option}
                  checked={size === option}
                  onCheckedChange={(checked) => onSizeChange(checked ? option : '')}
                >
                  {option}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <ChipGroup>
          <FilterChip
            active={!size}
            onClick={() => onSizeChange('')}
          >
            All
          </FilterChip>
          {SIZE_OPTIONS.map((option) => (
            <FilterChip
              key={option}
              active={size === option}
              onClick={() => onSizeChange(size === option ? '' : option)}
            >
              {option}
            </FilterChip>
          ))}
        </ChipGroup>
      </div>

      {/* ── Color ── */}
      <div className="filter-field">
        <label className="filter-field__label" htmlFor="filter-color">Color</label>
        <div className="filter-field__desktop">
          <Select value={color || 'all'} onValueChange={(value) => onColorChange(value === 'all' ? '' : value)}>
            <SelectTrigger id="filter-color" aria-label="Color">
              <SelectValue placeholder="All colors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All colors</SelectItem>
              {COLOR_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <ChipGroup>
          <FilterChip
            active={!color}
            onClick={() => onColorChange('')}
          >
            All
          </FilterChip>
          {COLOR_OPTIONS.map((option) => (
            <FilterChip
              key={option}
              active={color === option}
              onClick={() => onColorChange(color === option ? '' : option)}
            >
              {option}
            </FilterChip>
          ))}
        </ChipGroup>
      </div>

      {/* ── On Sale ── */}
      <div className="filter-field">
        <label className="filter-check">
          <input
            type="checkbox"
            checked={onSale}
            onChange={(e) => onSaleChange(e.target.checked)}
          />
          <span>On sale</span>
        </label>
      </div>
    </aside>
  )
}
