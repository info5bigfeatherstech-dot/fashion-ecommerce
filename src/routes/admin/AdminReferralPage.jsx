import { useEffect, useMemo, useState } from 'react'
import {
  Gift,
  Loader2,
  Percent,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Input, InputGroup } from '@/components/ui/Input'
import {
  AdminError,
  AdminLoading,
  AdminPageHeader,
} from '@/features/admin/components/AdminUi'
import {
  getAdminLoyaltyPointsSettings,
  getAdminReferralCodeDetail,
  getAdminReferralCodes,
  getAdminReferralRedemptions,
  getAdminReferralSettings,
  updateAdminReferralSettings,
} from '@/features/admin/api/marketing'
import { useQuery, useQueryClient } from '@tanstack/react-query'

const EMPTY = {
  enabled: true,
  discountType: 'percentage',
  discountValue: 8,
  maxDiscountAmount: '',
  minOrderValue: 0,
  rewardPoints: 80,
  redeemRupeePerPoint: '',
}

const MAX_REDEEM_RUPEE_PER_POINT = 1000

function parseRedeemRupeePerPoint(raw) {
  if (raw === '' || raw == null) {
    return { ok: false, message: 'Enter ₹ per point (for example 0.25)' }
  }
  const n = Number(raw)
  if (!Number.isFinite(n) || n < 0) {
    return { ok: false, message: '₹ per point must be 0 or more' }
  }
  if (n > MAX_REDEEM_RUPEE_PER_POINT) {
    return { ok: false, message: `₹ per point cannot exceed ₹${MAX_REDEEM_RUPEE_PER_POINT}` }
  }
  return { ok: true, value: Math.round((n + Number.EPSILON) * 100) / 100 }
}

function readLoyaltyRedeemRate(loyaltyPayload) {
  const n = Number(
    loyaltyPayload?.settings?.redeemRupeePerPoint
      ?? loyaltyPayload?.data?.settings?.redeemRupeePerPoint
  )
  return Number.isFinite(n) && n >= 0 ? n : null
}

function ToggleRow({ id, checked, onChange, title, description }) {
  return (
    <label className="admin-loyalty-points__toggle" htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        className="admin-loyalty-points__toggle-input"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="admin-loyalty-points__toggle-track" aria-hidden />
      <span className="admin-loyalty-points__toggle-copy">
        <span className="admin-loyalty-points__toggle-title">{title}</span>
        {description ? (
          <span className="admin-loyalty-points__toggle-desc">{description}</span>
        ) : null}
      </span>
    </label>
  )
}

function FieldWithExample({ label, htmlFor, example, children }) {
  return (
    <div className="admin-loyalty-points__field">
      <label className="input-group__label" htmlFor={htmlFor}>{label}</label>
      {children}
      {example ? <p className="admin-loyalty-points__example">{example}</p> : null}
    </div>
  )
}

function SectionCard({ icon: Icon, title, subtitle, children }) {
  return (
    <section className="admin-card admin-loyalty-points__card">
      <div className="admin-card__head admin-loyalty-points__card-head">
        <div className="admin-loyalty-points__card-title-wrap">
          {Icon ? (
            <span className="admin-loyalty-points__card-icon" aria-hidden>
              <Icon size={16} />
            </span>
          ) : null}
          <div>
            <h2 className="admin-card__title" style={{ margin: 0 }}>{title}</h2>
            {subtitle ? <p className="body-sm text-muted" style={{ margin: '4px 0 0' }}>{subtitle}</p> : null}
          </div>
        </div>
      </div>
      <div className="admin-loyalty-points__card-body">{children}</div>
    </section>
  )
}

function fmtDate(d) {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '—'
  }
}

function personLabel(p) {
  if (!p) return '—'
  return p.name || p.email || p.phone || p.id || '—'
}

function statusLabel(status) {
  const map = {
    reserved: 'Pending order',
    completed: 'Completed',
    voided: 'Voided',
    clawed_back: 'Reversed',
  }
  return map[status] || status || '—'
}

export default function AdminReferralPage() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [codeSearch, setCodeSearch] = useState('')
  const [codePage, setCodePage] = useState(1)
  const [usageSearch, setUsageSearch] = useState('')
  const [usageStatus, setUsageStatus] = useState('all')
  const [usagePage, setUsagePage] = useState(1)
  const [selectedCode, setSelectedCode] = useState('')

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['admin', 'referral', 'settings'],
    queryFn: ({ signal }) => getAdminReferralSettings({ signal, storefront: 'ecomm' }),
  })

  const loyaltyQ = useQuery({
    queryKey: ['admin', 'loyalty-points', 'settings'],
    queryFn: ({ signal }) => getAdminLoyaltyPointsSettings({ signal, storefront: 'ecomm' }),
  })

  const codesQ = useQuery({
    queryKey: ['admin', 'referral', 'codes', codePage, codeSearch],
    queryFn: ({ signal }) =>
      getAdminReferralCodes({
        signal,
        storefront: 'ecomm',
        page: codePage,
        limit: 20,
        search: codeSearch,
      }),
  })

  const usageQ = useQuery({
    queryKey: ['admin', 'referral', 'redemptions', usagePage, usageStatus, usageSearch],
    queryFn: ({ signal }) =>
      getAdminReferralRedemptions({
        signal,
        storefront: 'ecomm',
        page: usagePage,
        limit: 20,
        status: usageStatus,
        search: usageSearch,
      }),
  })

  const detailQ = useQuery({
    queryKey: ['admin', 'referral', 'code', selectedCode],
    queryFn: ({ signal }) => getAdminReferralCodeDetail(selectedCode, { signal, storefront: 'ecomm' }),
    enabled: Boolean(selectedCode),
  })

  useEffect(() => {
    const s = data?.settings || data?.data?.settings
    if (!s) return
    const fromReferral = Number(s.redeemRupeePerPoint)
    const hasReferralRate = s.redeemRupeePerPoint != null && Number.isFinite(fromReferral)
    setForm((prev) => ({
      enabled: s.enabled !== false,
      discountType: s.discountType === 'fixed' ? 'fixed' : 'percentage',
      discountValue: Number(s.discountValue) || 0,
      maxDiscountAmount:
        s.maxDiscountAmount != null && Number(s.maxDiscountAmount) > 0
          ? Number(s.maxDiscountAmount)
          : '',
      minOrderValue: Number(s.minOrderValue) || 0,
      rewardPoints: Math.max(0, Math.floor(Number(s.rewardPoints) || 0)),
      redeemRupeePerPoint: hasReferralRate
        ? Math.max(0, fromReferral)
        : (prev.redeemRupeePerPoint !== '' && prev.redeemRupeePerPoint != null
            ? prev.redeemRupeePerPoint
            : ''),
    }))
  }, [data])

  useEffect(() => {
    const fromLoyalty = readLoyaltyRedeemRate(loyaltyQ.data)
    if (fromLoyalty == null) return
    setForm((prev) => {
      if (prev.redeemRupeePerPoint !== '' && prev.redeemRupeePerPoint != null) return prev
      return { ...prev, redeemRupeePerPoint: fromLoyalty }
    })
  }, [loyaltyQ.data])

  const parsedRate = parseRedeemRupeePerPoint(form.redeemRupeePerPoint)
  const rewardPtsPreview = Math.max(0, Math.floor(Number(form.rewardPoints) || 0))
  const ratePreview = parsedRate.ok ? parsedRate.value : 0
  const rupeePreview = ratePreview > 0
    ? Math.round(rewardPtsPreview * ratePreview * 100) / 100
    : null

  const example = useMemo(() => {
    const bag = 1000
    const val = Number(form.discountValue) || 0
    let off = form.discountType === 'fixed' ? val : (bag * val) / 100
    const cap = Number(form.maxDiscountAmount)
    if (form.discountType === 'percentage' && Number.isFinite(cap) && cap > 0) {
      off = Math.min(off, cap)
    }
    off = Math.round((Math.min(off, bag) + Number.EPSILON) * 100) / 100
    return `On a ₹1,000 bag the friend saves ₹${off.toLocaleString('en-IN')}. You award the referrer ${rewardPtsPreview} loyalty points${
      rupeePreview != null ? ` (≈ ₹${rupeePreview.toLocaleString('en-IN')} at ₹${ratePreview} / point)` : ''
    }.`
  }, [form, rewardPtsPreview, rupeePreview, ratePreview])

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const handleSave = async () => {
    const parsedRate = parseRedeemRupeePerPoint(form.redeemRupeePerPoint)
    if (!parsedRate.ok) {
      toast.error(parsedRate.message)
      return
    }
    const rewardPoints = Math.max(0, Math.floor(Number(form.rewardPoints) || 0))
    if (!Number.isFinite(Number(form.rewardPoints)) || Number(form.rewardPoints) < 0) {
      toast.error('Reward points must be 0 or more')
      return
    }
    setSaving(true)
    try {
      await updateAdminReferralSettings({
        storefront: 'ecomm',
        enabled: Boolean(form.enabled),
        discountType: form.discountType,
        discountValue: Number(form.discountValue) || 0,
        maxDiscountAmount:
          form.maxDiscountAmount === '' || form.maxDiscountAmount == null
            ? null
            : Number(form.maxDiscountAmount),
        minOrderValue: Number(form.minOrderValue) || 0,
        rewardPoints,
        redeemRupeePerPoint: parsedRate.value,
      })
      toast.success('Referral settings saved')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'referral', 'settings'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'loyalty-points', 'settings'] }),
      ])
    } catch (err) {
      toast.error(err?.message || 'Could not save settings')
    } finally {
      setSaving(false)
    }
  }

  const codes = codesQ.data?.items || []
  const codesTotal = Number(codesQ.data?.total) || 0
  const uses = usageQ.data?.items || []
  const usesTotal = Number(usageQ.data?.total) || 0
  const detail = detailQ.data?.code || null

  return (
    <div className="admin-page admin-loyalty-points">
      <AdminPageHeader eyebrow="Marketing" title="Referrals">
        <div className="admin-row-actions" style={{ marginTop: 16 }}>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={isFetching || loyaltyQ.isFetching}
            onClick={() => {
              refetch()
              loyaltyQ.refetch()
            }}
          >
            <RefreshCw size={14} className={isFetching ? 'admin-settings-profile__spin' : undefined} />
            Refresh
          </Button>
          <Button type="button" variant="primary" size="sm" disabled={saving || isLoading} onClick={handleSave}>
            {saving ? <Loader2 size={14} className="admin-settings-profile__spin" /> : null}
            {saving ? 'Saving…' : 'Save settings'}
          </Button>
        </div>
      </AdminPageHeader>

      <p className="body-sm text-muted admin-loyalty-points__intro">
        Each customer generates one unique RF-001+ code from their profile and can share it with anyone.
        A friend uses one referral once at checkout (not together with a coupon). Loyalty redeem stays
        separate. The code owner gets the points below after prepaid or partial payment at checkout, or
        when a full COD referred order is delivered. ₹ per point is the same Loyalty redeem rate — changing
        it here also updates Loyalty points.
      </p>

      {isLoading ? (
        <AdminLoading />
      ) : isError ? (
        <AdminError message={error?.message || 'Failed to load settings'} onRetry={refetch} />
      ) : (
        <div className="admin-loyalty-points__stack">
          <SectionCard icon={ShieldCheck} title="Program" subtitle="On / off for storefront referrals">
            <ToggleRow
              id="rf-enabled"
              checked={form.enabled}
              onChange={(v) => setField('enabled', v)}
              title="Turn on referrals"
              description="Off = no generate, no checkout discount, no new rewards."
            />
            <div
              className={`admin-loyalty-points__status ${
                form.enabled ? 'admin-loyalty-points__status--on' : 'admin-loyalty-points__status--off'
              }`}
            >
              <Sparkles size={14} />
              {form.enabled ? 'Live on storefront' : 'Paused'}
            </div>
          </SectionCard>

          <SectionCard icon={Percent} title="Friend discount" subtitle="Applied at checkout when they use a referral code">
            <div className="admin-loyalty-points__example-box">{example}</div>
            <div className="admin-loyalty-points__grid">
              <FieldWithExample label="Discount type" htmlFor="rf-type">
                <select
                  id="rf-type"
                  className="input"
                  value={form.discountType}
                  onChange={(e) => setField('discountType', e.target.value)}
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed ₹</option>
                </select>
              </FieldWithExample>
              <FieldWithExample
                label={form.discountType === 'fixed' ? 'Discount amount (₹)' : 'Discount percent'}
                htmlFor="rf-value"
              >
                <Input
                  id="rf-value"
                  type="number"
                  min="0"
                  max={form.discountType === 'percentage' ? 100 : undefined}
                  step="0.01"
                  value={form.discountValue}
                  onChange={(e) => setField('discountValue', e.target.value)}
                />
              </FieldWithExample>
              {form.discountType === 'percentage' ? (
                <FieldWithExample
                  label="Max discount ₹ (optional)"
                  htmlFor="rf-cap"
                  example="Leave blank for no cap"
                >
                  <Input
                    id="rf-cap"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.maxDiscountAmount}
                    onChange={(e) => setField('maxDiscountAmount', e.target.value)}
                  />
                </FieldWithExample>
              ) : null}
              <FieldWithExample label="Min order value ₹" htmlFor="rf-min">
                <Input
                  id="rf-min"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.minOrderValue}
                  onChange={(e) => setField('minOrderValue', e.target.value)}
                />
              </FieldWithExample>
            </div>
          </SectionCard>

          <SectionCard icon={Gift} title="Referrer reward" subtitle="Prepaid/partial at checkout · COD when delivered">
            <div className="admin-loyalty-points__grid">
              <FieldWithExample
                label="Points awarded"
                htmlFor="rf-points"
                example="How many wallet points the code owner receives for one successful referred order."
              >
                <Input
                  id="rf-points"
                  type="number"
                  min="0"
                  step="1"
                  value={form.rewardPoints}
                  onChange={(e) => setField('rewardPoints', e.target.value)}
                />
              </FieldWithExample>
              <FieldWithExample
                label="₹ per point"
                htmlFor="rf-rate"
                example={
                  parsedRate.ok
                    ? `Same Loyalty redeem rate. ${rewardPtsPreview} pts × ₹${ratePreview} = ₹${(
                        rupeePreview ?? 0
                      ).toLocaleString('en-IN')} at checkout.`
                    : 'Same Loyalty redeem rate. Example: 0.25 means 1 point = 25 paise.'
                }
              >
                <Input
                  id="rf-rate"
                  type="number"
                  min="0"
                  max={MAX_REDEEM_RUPEE_PER_POINT}
                  step="0.01"
                  value={form.redeemRupeePerPoint}
                  onChange={(e) => setField('redeemRupeePerPoint', e.target.value)}
                />
              </FieldWithExample>
            </div>
          </SectionCard>

          <SectionCard icon={Users} title="Codes" subtitle="Every generated RF code and how often it converted">
            <form
              className="admin-referral__toolbar"
              onSubmit={(e) => {
                e.preventDefault()
                setCodePage(1)
                codesQ.refetch()
              }}
            >
              <InputGroup label="Search code">
                <Input
                  value={codeSearch}
                  onChange={(e) => {
                    setCodeSearch(e.target.value.toUpperCase())
                    setCodePage(1)
                  }}
                  placeholder="RF-001"
                />
              </InputGroup>
              <Button type="submit" variant="secondary" size="sm">
                <Search size={14} /> Search
              </Button>
            </form>
            {codesQ.isLoading ? (
              <AdminLoading label="Loading codes…" />
            ) : codes.length === 0 ? (
              <p className="body-sm text-muted">No referral codes generated yet.</p>
            ) : (
              <div className="admin-referral__table-wrap">
                <table className="admin-referral__table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Owner</th>
                      <th>Completed</th>
                      <th>Pending</th>
                      <th>Points</th>
                      <th>Generated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {codes.map((row) => (
                      <tr key={row.id || row.code}>
                        <td>
                          <button
                            type="button"
                            className="admin-referral__code-btn"
                            onClick={() => setSelectedCode(row.code)}
                          >
                            {row.code}
                          </button>
                        </td>
                        <td>
                          <div>{personLabel(row.owner)}</div>
                          <div className="admin-referral__muted">{row.owner?.phone || row.owner?.email || ''}</div>
                        </td>
                        <td>{row.completedUses || 0}</td>
                        <td>{row.pendingUses || 0}</td>
                        <td>{row.pointsAwarded || 0}</td>
                        <td>{fmtDate(row.generatedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {codesTotal > 20 ? (
              <div className="admin-referral__pager">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={codePage <= 1}
                  onClick={() => setCodePage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <span className="body-sm text-muted">
                  Page {codePage} · {codesTotal} codes
                </span>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={codePage * 20 >= codesTotal}
                  onClick={() => setCodePage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            ) : null}

            {selectedCode ? (
              <div className="admin-referral__detail">
                <div className="admin-referral__detail-head">
                  <strong>{selectedCode}</strong>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedCode('')}>
                    Close
                  </Button>
                </div>
                {detailQ.isLoading ? (
                  <p className="body-sm text-muted">Loading uses…</p>
                ) : !detail?.uses?.length ? (
                  <p className="body-sm text-muted">No uses yet for this code.</p>
                ) : (
                  <ul className="admin-referral__uses">
                    {detail.uses.map((use) => (
                      <li key={use.id}>
                        <span>{use.orderId}</span>
                        <span>{statusLabel(use.status)}</span>
                        <span>₹{Number(use.discountInr || 0).toLocaleString('en-IN')}</span>
                        <span>{use.rewardPoints || 0} pts</span>
                        <span>{personLabel(use.referee)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}
          </SectionCard>

          <SectionCard icon={Users} title="Usage report" subtitle="Every referred checkout, including pending and reversed">
            <form
              className="admin-referral__toolbar"
              onSubmit={(e) => {
                e.preventDefault()
                setUsagePage(1)
                usageQ.refetch()
              }}
            >
              <InputGroup label="Search code / order">
                <Input
                  value={usageSearch}
                  onChange={(e) => {
                    setUsageSearch(e.target.value)
                    setUsagePage(1)
                  }}
                  placeholder="RF-001 or order id"
                />
              </InputGroup>
              <InputGroup label="Status">
                <select
                  className="input"
                  value={usageStatus}
                  onChange={(e) => {
                    setUsageStatus(e.target.value)
                    setUsagePage(1)
                  }}
                >
                  <option value="all">All</option>
                  <option value="reserved">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="voided">Voided</option>
                  <option value="clawed_back">Reversed</option>
                </select>
              </InputGroup>
              <Button type="submit" variant="secondary" size="sm">
                <Search size={14} /> Filter
              </Button>
            </form>
            {usageQ.isLoading ? (
              <AdminLoading label="Loading usage…" />
            ) : uses.length === 0 ? (
              <p className="body-sm text-muted">No referral usage yet.</p>
            ) : (
              <div className="admin-referral__table-wrap">
                <table className="admin-referral__table">
                  <thead>
                    <tr>
                      <th>When</th>
                      <th>Code</th>
                      <th>Order</th>
                      <th>Status</th>
                      <th>Friend</th>
                      <th>Owner</th>
                      <th>Discount</th>
                      <th>Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uses.map((row) => (
                      <tr key={row.id}>
                        <td>{fmtDate(row.createdAt)}</td>
                        <td>{row.code}</td>
                        <td>{row.orderId}</td>
                        <td>{statusLabel(row.status)}</td>
                        <td>{personLabel(row.referee)}</td>
                        <td>{personLabel(row.owner)}</td>
                        <td>₹{Number(row.discountInr || 0).toLocaleString('en-IN')}</td>
                        <td>{row.rewardPoints || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {usesTotal > 20 ? (
              <div className="admin-referral__pager">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={usagePage <= 1}
                  onClick={() => setUsagePage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <span className="body-sm text-muted">
                  Page {usagePage} · {usesTotal} rows
                </span>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={usagePage * 20 >= usesTotal}
                  onClick={() => setUsagePage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            ) : null}
          </SectionCard>
        </div>
      )}
    </div>
  )
}
