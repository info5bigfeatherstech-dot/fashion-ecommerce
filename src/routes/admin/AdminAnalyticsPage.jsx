import { useMemo } from 'react'
import {
  AlertTriangle,
  Download,
  IndianRupee,
  Package,
  TrendingUp,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  AdminEmpty,
  AdminError,
  AdminLoading,
  AdminPageHeader,
  extractListPayload,
} from '@/features/admin/components/AdminUi'
import {
  useAdminProductsActiveCount,
  useAdminProductsAll,
  useAdminProductsLowStock,
} from '@/features/admin/hooks'
import { Button } from '@/components/ui/Button'

const CHART_COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

function toNumber(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function categoryName(category) {
  if (!category) return 'Uncategorized'
  if (typeof category === 'string') return category
  return category.name || category.title || 'Uncategorized'
}

function extractCount(data) {
  if (data == null) return null
  if (typeof data === 'number') return data
  if (typeof data?.total === 'number') return data.total
  if (typeof data?.totalActive === 'number') return data.totalActive
  if (typeof data?.activeCount === 'number') return data.activeCount
  if (typeof data?.count === 'number') return data.count
  if (Array.isArray(data?.products)) return data.products.length
  if (Array.isArray(data)) return data.length
  return null
}

function downloadCsv(filename, rows) {
  const header = Object.keys(rows[0] || {})
  if (!header.length) return
  const lines = [
    header.join(','),
    ...rows.map((row) =>
      header.map((key) => `"${String(row[key] ?? '').replace(/"/g, '""')}"`).join(',')
    ),
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export default function AdminAnalyticsPage() {
  const {
    data: productsData,
    isLoading: productsLoading,
    isError: productsError,
    refetch,
  } = useAdminProductsAll({ page: 1, limit: 100 })
  const { data: activeData } = useAdminProductsActiveCount()
  const { data: lowStockData, isLoading: lowStockLoading } = useAdminProductsLowStock()

  const { items: products, pagination } = useMemo(
    () => extractListPayload(productsData, ['products']),
    [productsData]
  )

  const lowStockList = useMemo(() => {
    if (Array.isArray(lowStockData)) return lowStockData
    return lowStockData?.products || lowStockData?.items || []
  }, [lowStockData])

  const categoryDistribution = useMemo(() => {
    const map = new Map()
    for (const product of products) {
      const name = categoryName(product.category)
      map.set(name, (map.get(name) || 0) + 1)
    }
    return Array.from(map, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  }, [products])

  const topProductsByValue = useMemo(() => {
    return products
      .filter((p) => String(p.status || '').toLowerCase() !== 'archived')
      .map((product) => {
        const totalValue = (product.variants || []).reduce((sum, variant) => {
          const price = toNumber(variant.price?.sale ?? variant.price?.base ?? variant.finalPrice, 0)
          const quantity = toNumber(variant.inventory?.quantity, 0)
          return sum + price * quantity
        }, 0)
        const totalUnits = (product.variants || []).reduce(
          (sum, variant) => sum + toNumber(variant.inventory?.quantity, 0),
          0
        )
        return {
          id: product._id || product.id || product.slug,
          name: product.name || product.title || 'Product',
          value: totalValue,
          units: totalUnits,
        }
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
  }, [products])

  const priceRangeData = useMemo(() => {
    const ranges = {
      '0-500': 0,
      '501-1000': 0,
      '1001-2000': 0,
      '2001-5000': 0,
      '5001+': 0,
    }
    for (const product of products) {
      for (const variant of product.variants || []) {
        const price = toNumber(variant.price?.sale ?? variant.price?.base ?? variant.finalPrice, 0)
        if (price <= 500) ranges['0-500'] += 1
        else if (price <= 1000) ranges['501-1000'] += 1
        else if (price <= 2000) ranges['1001-2000'] += 1
        else if (price <= 5000) ranges['2001-5000'] += 1
        else ranges['5001+'] += 1
      }
    }
    return Object.entries(ranges).map(([range, count]) => ({ range, count }))
  }, [products])

  const lowStockAlerts = useMemo(() => {
    const alerts = []
    for (const product of lowStockList) {
      for (const variant of product.variants || []) {
        const threshold = toNumber(variant.inventory?.lowStockThreshold, 5)
        const quantity = toNumber(variant.inventory?.quantity, 0)
        if (quantity <= threshold) {
          alerts.push({
            id: `${product._id || product.slug}-${variant.sku || quantity}`,
            name: product.name || product.title || 'Product',
            sku: variant.sku || 'N/A',
            stock: quantity,
            reorderLevel: threshold,
            variant:
              (variant.attributes || []).map((a) => a.value).filter(Boolean).join(' / ') || 'Default',
          })
        }
      }
      if (!product.variants?.length) {
        const qty = toNumber(product.stock ?? product.quantity, 0)
        alerts.push({
          id: product._id || product.slug,
          name: product.name || product.title || 'Product',
          sku: product.sku || 'N/A',
          stock: qty,
          reorderLevel: 5,
          variant: 'Default',
        })
      }
    }
    return alerts.sort((a, b) => a.stock - b.stock).slice(0, 10)
  }, [lowStockList])

  const revenuePotential = useMemo(() => {
    return products.reduce((total, product) => {
      return (
        total +
        (product.variants || []).reduce((sum, variant) => {
          const price = toNumber(variant.price?.sale ?? variant.price?.base ?? variant.finalPrice, 0)
          const quantity = toNumber(variant.inventory?.quantity, 0)
          return sum + price * quantity
        }, 0)
      )
    }, 0)
  }, [products])

  const inventoryMetrics = useMemo(() => {
    let totalVariants = 0
    let outOfStock = 0
    let lowStock = 0
    let healthyStock = 0
    for (const product of products) {
      for (const variant of product.variants || []) {
        totalVariants += 1
        const quantity = toNumber(variant.inventory?.quantity, 0)
        const threshold = toNumber(variant.inventory?.lowStockThreshold, 5)
        if (quantity === 0) outOfStock += 1
        else if (quantity <= threshold) lowStock += 1
        else healthyStock += 1
      }
    }
    return {
      totalVariants,
      outOfStock,
      lowStock,
      healthyStock,
      stockHealthPercentage:
        totalVariants > 0 ? ((healthyStock / totalVariants) * 100).toFixed(1) : '0.0',
    }
  }, [products])

  const totalProducts = pagination?.total ?? pagination?.totalItems ?? products.length
  const activeCount =
    extractCount(activeData) ??
    products.filter((p) => String(p.status || '').toLowerCase() === 'active' || p.isActive !== false)
      .length
  const lowStockCount = extractCount(lowStockData) ?? lowStockAlerts.length

  const handleExport = () => {
    if (!topProductsByValue.length) return
    downloadCsv(
      'store-analytics.csv',
      topProductsByValue.map((row) => ({
        name: row.name,
        stockValue: row.value,
        units: row.units,
      }))
    )
  }

  if (productsLoading || lowStockLoading) {
    return <AdminLoading label="Loading analytics…" />
  }

  if (productsError) {
    return <AdminError message="Could not load analytics" onRetry={refetch} />
  }

  return (
    <div className="admin-page">
      <AdminPageHeader eyebrow="Insights" title="Store analytics">
        <Button variant="secondary" size="sm" onClick={handleExport}>
          <Download size={14} />
          Export
        </Button>
      </AdminPageHeader>

      <div className="admin-metric-grid">
        <div className="admin-metric-card admin-metric-card--green">
          <div>
            <p className="admin-metric-card__label">Revenue Potential</p>
            <p className="admin-metric-card__value">
              ₹{Math.round(revenuePotential).toLocaleString('en-IN')}
            </p>
            <p className="admin-metric-card__hint">Based on current inventory × prices</p>
          </div>
          <div className="admin-metric-card__icon" aria-hidden>
            <IndianRupee size={22} />
          </div>
        </div>

        <div className="admin-metric-card admin-metric-card--blue">
          <div>
            <p className="admin-metric-card__label">Inventory Health</p>
            <p className="admin-metric-card__value">{inventoryMetrics.stockHealthPercentage}%</p>
            <p className="admin-metric-card__hint">
              {inventoryMetrics.healthyStock} healthy variants
            </p>
          </div>
          <div className="admin-metric-card__icon" aria-hidden>
            <TrendingUp size={22} />
          </div>
        </div>

        <div className="admin-metric-card admin-metric-card--purple">
          <div>
            <p className="admin-metric-card__label">Total Products</p>
            <p className="admin-metric-card__value">{totalProducts}</p>
            <p className="admin-metric-card__hint">
              {activeCount} active · {inventoryMetrics.totalVariants} variants
            </p>
          </div>
          <div className="admin-metric-card__icon" aria-hidden>
            <Package size={22} />
          </div>
        </div>

        <div className="admin-metric-card admin-metric-card--red">
          <div>
            <p className="admin-metric-card__label">Low Stock Items</p>
            <p className="admin-metric-card__value">{lowStockCount}</p>
            <p className="admin-metric-card__hint admin-metric-card__hint--danger">
              {inventoryMetrics.outOfStock} out of stock
            </p>
          </div>
          <div className="admin-metric-card__icon" aria-hidden>
            <AlertTriangle size={22} />
          </div>
        </div>
      </div>

      <div className="admin-analytics-grid">
        <div className="admin-card">
          <h2 className="admin-card__title">Category Distribution</h2>
          <div className="admin-chart">
            {categoryDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={90}
                    dataKey="value"
                  >
                    {categoryDistribution.map((entry, index) => (
                      <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} products`, 'Count']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <AdminEmpty message="No category data available" />
            )}
          </div>
        </div>

        <div className="admin-card">
          <h2 className="admin-card__title">Top 10 Products by Stock Value</h2>
          <div className="admin-chart admin-chart--tall">
            {topProductsByValue.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topProductsByValue}
                  layout="vertical"
                  margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={160}
                    interval={0}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) =>
                      typeof value === 'string' && value.length > 22
                        ? `${value.slice(0, 20)}…`
                        : value
                    }
                  />
                  <Tooltip
                    formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Stock Value']}
                  />
                  <Legend />
                  <Bar dataKey="value" fill="#4F46E5" name="Stock Value (₹)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <AdminEmpty message="No product data available" />
            )}
          </div>
        </div>

        <div className="admin-card">
          <h2 className="admin-card__title">Price Range Distribution</h2>
          <div className="admin-chart">
            {priceRangeData.some((item) => item.count > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={priceRangeData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis allowDecimals={false} />
                  <Tooltip formatter={(value) => [`${value} variants`, 'Count']} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#4F46E5"
                    name="Number of Variants"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <AdminEmpty message="No price data available" />
            )}
          </div>
        </div>

        <div className="admin-card">
          <h2 className="admin-card__title">Low Stock Alerts</h2>
          <div className="admin-alert-list">
            {lowStockAlerts.length > 0 ? (
              lowStockAlerts.map((item) => (
                <div key={item.id} className="admin-alert-row">
                  <div className="admin-alert-row__icon" aria-hidden>
                    <AlertTriangle size={18} />
                  </div>
                  <div className="admin-alert-row__body">
                    <strong>{item.name}</strong>
                    <span>
                      SKU: {item.sku}
                      {item.variant !== 'Default' ? ` · ${item.variant}` : ''}
                    </span>
                  </div>
                  <div className="admin-alert-row__meta">
                    <strong>{item.stock} units left</strong>
                    <span>Reorder at: {item.reorderLevel}</span>
                  </div>
                </div>
              ))
            ) : (
              <AdminEmpty message="No low stock items" />
            )}
          </div>
        </div>
      </div>

      <div className="admin-card">
        <h2 className="admin-card__title">Inventory Health Summary</h2>
        <div className="admin-health-grid">
          <div className="admin-health-card admin-health-card--ok">
            <span>Active Product</span>
            <strong>{activeCount}</strong>
            <small>products</small>
          </div>
          <div className="admin-health-card admin-health-card--warn">
            <span>Low Stock</span>
            <strong>{inventoryMetrics.lowStock}</strong>
            <small>variants</small>
          </div>
          <div className="admin-health-card admin-health-card--danger">
            <span>Out of Stock</span>
            <strong>{inventoryMetrics.outOfStock}</strong>
            <small>variants</small>
          </div>
        </div>
      </div>
    </div>
  )
}
