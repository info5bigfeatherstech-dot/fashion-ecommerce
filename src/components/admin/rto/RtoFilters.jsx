import { useState, useEffect } from 'react'
import {
  Search,
  RotateCw,
  Download,
  Filter,
  ArrowUpDown,
  X,
  FileSpreadsheet,
  FileJson,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  RTO_STATUS_OPTIONS,
  RTO_SECTION_OPTIONS,
  RTO_SORT_OPTIONS,
} from '@/types/rto'

export function RtoFilters({
  search,
  status,
  section,
  sortBy,
  sortOrder,
  summaryCounts,
  onSearchChange,
  onStatusChange,
  onSectionChange,
  onSortChange,
  onResetFilters,
  onAutoSync,
  isSyncing,
  onExportReport,
}) {
  const [searchInput, setSearchInput] = useState(search || '')
  const [exportMenuOpen, setExportMenuOpen] = useState(false)

  // Sync internal search input with incoming prop
  useEffect(() => {
    setSearchInput(search || '')
  }, [search])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    onSearchChange(searchInput.trim())
  }

  const handleClearSearch = () => {
    setSearchInput('')
    onSearchChange('')
  }

  const hasActiveFilters =
    Boolean(search) ||
    (status && status !== 'all') ||
    (section && section !== 'all') ||
    sortBy !== 'createdAt' ||
    sortOrder !== 'desc'

  const statusTabs = [
    { key: 'all', label: 'All', count: summaryCounts?.total },
    { key: 'pending', label: 'Pending', count: summaryCounts?.pending },
    { key: 'refunded', label: 'Refunded', count: summaryCounts?.refunded },
    { key: 'closed', label: 'Closed', count: summaryCounts?.closed },
    { key: 'refund_failed', label: 'Failed', count: summaryCounts?.refund_failed },
    { key: 'refund_rejected', label: 'Rejected', count: summaryCounts?.refund_rejected },
  ]

  return (
    <div className="rto-filters-container">
      {/* Quick Status Summary Tabs */}
      <div className="rto-status-tabs">
        {statusTabs.map((tab) => {
          const isActive = (status || 'all') === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              className={`rto-status-tab${isActive ? ' is-active' : ''}`}
              onClick={() => onStatusChange(tab.key)}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count !== null && (
                <span className="rto-status-tab__badge">
                  {Number(tab.count || 0).toLocaleString()}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Main Filter & Action Bar */}
      <div className="rto-filter-bar">
        <form onSubmit={handleSearchSubmit} className="rto-search-form">
          <div className="rto-search-input-wrap">
            <Search className="rto-search-icon" size={16} />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search Order ID / Customer / Phone..."
              className="rto-search-input"
            />
            {searchInput && (
              <button
                type="button"
                className="rto-search-clear"
                onClick={handleClearSearch}
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <Button type="submit" variant="secondary" size="sm">
            Search
          </Button>
        </form>

        <div className="rto-select-group">
          {/* Section Filter */}
          <div className="rto-select-wrapper">
            <Filter size={14} className="rto-select-icon" />
            <select
              value={section || 'all'}
              onChange={(e) => onSectionChange(e.target.value)}
              className="rto-filter-select"
              title="Filter by RTO section"
            >
              {RTO_SECTION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="rto-select-wrapper">
            <ArrowUpDown size={14} className="rto-select-icon" />
            <select
              value={`${sortBy || 'createdAt'}_${sortOrder || 'desc'}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('_')
                onSortChange(sb, so)
              }}
              className="rto-filter-select"
              title="Sort orders"
            >
              {RTO_SORT_OPTIONS.map((opt) => (
                <optgroup key={opt.value} label={opt.label}>
                  <option value={`${opt.value}_desc`}>{opt.label} (High/Newest first)</option>
                  <option value={`${opt.value}_asc`}>{opt.label} (Low/Oldest first)</option>
                </optgroup>
              ))}
            </select>
          </div>

          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              className="rto-reset-btn"
            >
              Reset
            </Button>
          )}
        </div>

        {/* Global Action Buttons */}
        <div className="rto-actions-group">
          {/* Auto-sync button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAutoSync}
            disabled={isSyncing}
            className="rto-sync-btn"
          >
            <RotateCw size={14} className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? 'Syncing...' : 'Auto-Sync Statuses'}
          </Button>

          {/* Export Report Dropdown */}
          <div className="rto-export-dropdown-wrap">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              className="rto-export-btn"
            >
              <Download size={14} />
              Export Report
            </Button>

            {exportMenuOpen && (
              <>
                <div
                  className="rto-dropdown-backdrop"
                  onClick={() => setExportMenuOpen(false)}
                />
                <div className="rto-dropdown-menu">
                  <button
                    type="button"
                    className="rto-dropdown-item"
                    onClick={() => {
                      setExportMenuOpen(false)
                      onExportReport('csv')
                    }}
                  >
                    <FileSpreadsheet size={15} className="text-emerald-600" />
                    <span>Export as CSV</span>
                  </button>
                  <button
                    type="button"
                    className="rto-dropdown-item"
                    onClick={() => {
                      setExportMenuOpen(false)
                      onExportReport('json')
                    }}
                  >
                    <FileJson size={15} className="text-blue-600" />
                    <span>Export as JSON</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
