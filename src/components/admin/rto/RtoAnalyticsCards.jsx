import {
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  UserX,
  Truck,
  RotateCcw,
  IndianRupee,
  TrendingUp,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { formatPrice } from '@/lib/utils'

export function RtoAnalyticsCards({ analytics, isLoading }) {
  if (isLoading) {
    return (
      <div className="rto-analytics-grid-skeleton">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="rto-analytics-card rto-analytics-card--loading">
            <div className="rto-skeleton-line rto-skeleton-line--title" />
            <div className="rto-skeleton-line rto-skeleton-line--value" />
          </div>
        ))}
      </div>
    )
  }

  const kpis = [
    {
      id: 'totalRto',
      label: 'Total RTO',
      value: (analytics?.totalRto ?? 0).toLocaleString(),
      icon: Package,
      tone: 'indigo',
      desc: 'All returned orders',
    },
    {
      id: 'pending',
      label: 'Pending Inspection',
      value: (analytics?.pending ?? 0).toLocaleString(),
      icon: Clock,
      tone: 'amber',
      desc: 'Awaiting action',
    },
    {
      id: 'refunded',
      label: 'Refunded',
      value: (analytics?.refunded ?? 0).toLocaleString(),
      icon: CheckCircle2,
      tone: 'emerald',
      desc: 'Completed refunds',
    },
    {
      id: 'closed',
      label: 'Closed',
      value: (analytics?.closed ?? 0).toLocaleString(),
      icon: XCircle,
      tone: 'slate',
      desc: 'Resolved cases',
    },
    {
      id: 'refundFailed',
      label: 'Refund Failed',
      value: (analytics?.refundFailed ?? 0).toLocaleString(),
      icon: AlertTriangle,
      tone: 'rose',
      desc: 'Gateway / bank issues',
    },
    {
      id: 'customerRelated',
      label: 'Customer Related',
      value: (analytics?.customerRelated ?? 0).toLocaleString(),
      icon: UserX,
      tone: 'blue',
      desc: 'Refused / unavailable',
    },
    {
      id: 'courierRelated',
      label: 'Courier Related',
      value: (analytics?.courierRelated ?? 0).toLocaleString(),
      icon: Truck,
      tone: 'violet',
      desc: 'Bad address / logistics',
    },
    {
      id: 'eligibleForRefund',
      label: 'Eligible for Refund',
      value: (analytics?.eligibleForRefund ?? 0).toLocaleString(),
      icon: RotateCcw,
      tone: 'cyan',
      desc: 'Meets refund criteria',
    },
    {
      id: 'totalRefundAmountInr',
      label: 'Total Refund Amount',
      value: formatPrice(analytics?.totalRefundAmountInr ?? 0),
      icon: IndianRupee,
      tone: 'pink',
      desc: 'Cumulative value',
      isPrice: true,
    },
  ]

  const chartData = (analytics?.timeline?.length
    ? analytics.timeline
    : analytics?.byDate?.length
      ? analytics.byDate
      : []
  ).map((item) => ({
    date: item.date ? item.date.slice(5) : item.day || '—',
    fullDate: item.date || item.day,
    count: Number(item.count || 0),
    refundAmount: Number(item.refundAmount || item.amount || 0),
  }))

  return (
    <div className="rto-analytics-section">
      <div className="rto-kpis-grid">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <div
              key={kpi.id}
              className={`rto-kpi-card rto-kpi-card--${kpi.tone}`}
            >
              <div className="rto-kpi-card__header">
                <span className="rto-kpi-card__label">{kpi.label}</span>
                <span className={`rto-kpi-card__icon rto-kpi-card__icon--${kpi.tone}`}>
                  <Icon size={18} />
                </span>
              </div>
              <div className="rto-kpi-card__body">
                <div className="rto-kpi-card__value">{kpi.value}</div>
                <div className="rto-kpi-card__desc">{kpi.desc}</div>
              </div>
            </div>
          )
        })}
      </div>

      {chartData.length > 0 && (
        <div className="rto-chart-card">
          <div className="rto-chart-card__header">
            <div>
              <h3 className="rto-chart-card__title">
                <TrendingUp size={16} />
                RTO Orders Trend (by Date)
              </h3>
              <p className="rto-chart-card__subtitle">Daily return volume pattern</p>
            </div>
          </div>
          <div className="rto-chart-wrap">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="date" tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                <YAxis allowDecimals={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                <Tooltip
                  formatter={(value, name) => [value, name === 'count' ? 'RTO Orders' : name]}
                  labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    fontSize: '12px',
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="url(#rtoBarGradient)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={36}
                />
                <defs>
                  <linearGradient id="rtoBarGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E03966" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#E03966" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
