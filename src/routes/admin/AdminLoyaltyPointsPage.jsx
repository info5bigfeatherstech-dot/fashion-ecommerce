import { useEffect, useMemo, useState } from 'react'
import {
  Coins,
  Gift,
  Loader2,
  Percent,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UserCog,
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
  adjustAdminLoyaltyPoints,
  getAdminLoyaltyPointsSettings,
  updateAdminLoyaltyPointsSettings,
} from '@/features/admin/api/marketing'
import { useQuery } from '@tanstack/react-query'

const EMPTY = {
  enabled: false,
  earnPointsPerRupee: 1,
  redeemRupeePerPoint: 1,
  minOrderSubtotalToEarn: 0,
  minOrderSubtotalToRedeem: 0,
  minRedeemPoints: 1,
  maxRedeemPercentOfPayable: 50,
  maxRedeemPointsPerOrder: '',
  expiryDays: 365,
  earnOnShipping: false,
  earnOnTax: false,
  stackWithCoupon: true,
  termsHtml: '',
}

const SAMPLE_PAY_INR = 1100
const SAMPLE_BILL_INR = 2100
const SAMPLE_BALANCE_PTS = 1000
const SAMPLE_REDEEM_PTS = 100

function num(v, fallback = 0) {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

function fmtInr(n) {
  return `₹${Math.round(Math.max(0, Number(n) || 0)).toLocaleString('en-IN')}`
}

function fmtPts(n) {
  return Math.floor(Math.max(0, Number(n) || 0)).toLocaleString('en-IN')
}

function buildDynamicExamples(form, adjustPoints) {
  const earnRate = Math.max(0, num(form.earnPointsPerRupee, 0))
  const earnMin = Math.max(0, num(form.minOrderSubtotalToEarn, 0))
  const expiry = Math.max(0, Math.floor(num(form.expiryDays, 0)))
  const redeemValue = Math.max(0, num(form.redeemRupeePerPoint, 0))
  const maxPct = Math.min(100, Math.max(0, num(form.maxRedeemPercentOfPayable, 0)))
  const maxPtsRaw = form.maxRedeemPointsPerOrder
  const maxPts =
    maxPtsRaw === '' || maxPtsRaw == null
      ? null
      : Math.max(0, Math.floor(num(maxPtsRaw, 0)))
  const minPts = Math.max(0, Math.floor(num(form.minRedeemPoints, 0)))
  const redeemMin = Math.max(0, num(form.minOrderSubtotalToRedeem, 0))

  const earnOnSample = Math.floor(SAMPLE_PAY_INR * earnRate)
  const earnOn100 = Math.floor(100 * earnRate)

  const redeemOn100 = SAMPLE_REDEEM_PTS * redeemValue
  const pointsValueInr = SAMPLE_BALANCE_PTS * redeemValue
  const maxAllowedInr = (SAMPLE_BILL_INR * maxPct) / 100
  let usablePts = SAMPLE_BALANCE_PTS
  if (maxPts != null && maxPts > 0) usablePts = Math.min(usablePts, maxPts)
  if (redeemValue > 0 && maxPct > 0) {
    const pctCapPts = Math.floor(maxAllowedInr / redeemValue)
    usablePts = Math.min(usablePts, pctCapPts)
  } else if (maxPct <= 0 || redeemValue <= 0) {
    usablePts = 0
  }
  if (minPts > 0 && usablePts < minPts) usablePts = 0
  const usableInr = usablePts * redeemValue
  const payAfter = Math.max(0, SAMPLE_BILL_INR - usableInr)

  const adj = Number(adjustPoints)
  const adjExample = Number.isFinite(adj) && adj !== 0
    ? adj > 0
      ? `You entered +${Math.floor(adj)} → customer balance goes up by ${Math.floor(adj)}.`
      : `You entered ${Math.floor(adj)} → customer balance goes down by ${Math.abs(Math.floor(adj))}.`
    : 'Enter +100 to add, or -50 to remove.'

  return {
    earnStory: (
      <>
        <strong>With your settings now:</strong> Riya pays {fmtInr(SAMPLE_PAY_INR)} cash.
        <br />
        Earn rate <strong>{earnRate}</strong> → she gets ~<strong>{fmtPts(earnOnSample)}</strong> points
        {earnMin > 0 ? (
          <>
            <br />
            Min order {fmtInr(earnMin)} → carts below that get <strong>0</strong> points.
          </>
        ) : (
          <>
            <br />
            Min order {fmtInr(0)} → any paid order can earn.
          </>
        )}
        {form.earnOnShipping ? (
          <>
            <br />
            Shipping is <strong>included</strong> in earn base.
          </>
        ) : (
          <>
            <br />
            Shipping is <strong>excluded</strong> from earn base.
          </>
        )}
        {form.earnOnTax ? (
          <>
            <br />
            Tax is <strong>included</strong> in earn base.
          </>
        ) : (
          <>
            <br />
            Tax is <strong>excluded</strong> from earn base.
          </>
        )}
      </>
    ),
    earnRate: `You set ${earnRate} → ${fmtInr(100)} paid ≈ ${fmtPts(earnOn100)} points.`,
    earnMin:
      earnMin > 0
        ? `You set ${fmtInr(earnMin)} → orders below that earn 0 points.`
        : 'You set ₹0 → every qualifying paid order can earn.',
    expiry:
      expiry > 0
        ? `You set ${expiry} days → new points expire after ~${expiry} days.`
        : 'You set 0 → points never expire.',
    redeemStory: (
      <>
        <strong>With your settings now:</strong> Bill {fmtInr(SAMPLE_BILL_INR)}. Customer has{' '}
        {fmtPts(SAMPLE_BALANCE_PTS)} points.
        <br />
        Redeem value <strong>{redeemValue}</strong> → {fmtPts(SAMPLE_BALANCE_PTS)} pts ≈{' '}
        {fmtInr(pointsValueInr)} off possible.
        <br />
        Max {maxPct}% of bill = {fmtInr(maxAllowedInr)}
        {maxPts != null ? <> · Max pts/order = {fmtPts(maxPts)}</> : null}
        {minPts > 0 ? <> · Min to use = {fmtPts(minPts)}</> : null}.
        <br />
        {usablePts > 0 ? (
          <>
            She can use <strong>{fmtPts(usablePts)}</strong> pts (−{fmtInr(usableInr)}) → pays about{' '}
            <strong>{fmtInr(payAfter)}</strong>.
          </>
        ) : maxPct <= 0 || redeemValue <= 0 ? (
          <>
            Redeem is effectively <strong>blocked</strong> (max % or redeem value is 0).
          </>
        ) : (
          <>
            With these caps she <strong>cannot</strong> redeem on this sample bill.
          </>
        )}
      </>
    ),
    redeemValue: `You set ${redeemValue} → ${fmtPts(SAMPLE_REDEEM_PTS)} points = ${fmtInr(redeemOn100)} off.`,
    maxPct:
      maxPct <= 0
        ? 'You set 0% → redeem blocked at checkout.'
        : maxPct >= 100
          ? 'You set 100% → full bill can be paid with points (subject to other caps).'
          : `You set ${maxPct}% → on a ${fmtInr(SAMPLE_BILL_INR)} bill, max points discount ≈ ${fmtInr(maxAllowedInr)}.`,
    maxPts:
      maxPts == null
        ? 'Blank = no extra per-order points cap.'
        : `You set ${fmtPts(maxPts)} → even with ${fmtPts(SAMPLE_BALANCE_PTS)} pts, only ${fmtPts(maxPts)} usable per order.`,
    minPts:
      minPts <= 1
        ? `You set ${minPts} → customers can start using from ${minPts} point${minPts === 1 ? '' : 's'}.`
        : `You set ${minPts} → need at least ${fmtPts(minPts)} points before redeem.`,
    redeemMin:
      redeemMin <= 0
        ? 'You set ₹0 → points usable on any order size.'
        : `You set ${fmtInr(redeemMin)} → carts below that cannot redeem.`,
    stack: form.stackWithCoupon
      ? 'ON → coupon + points can apply together.'
      : 'OFF → only one of coupon or points on an order.',
    terms:
      expiry > 0
        ? `Tip: mention “Points expire after ${expiry} days” if you show terms on storefront.`
        : 'Tip: mention “Points never expire” if you show terms on storefront.',
    adjustPts: adjExample,
  }
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
      <InputGroup label={label} htmlFor={htmlFor}>
        {children}
      </InputGroup>
      {example ? <p className="admin-loyalty-points__example">{example}</p> : null}
    </div>
  )
}

function ExampleBox({ children }) {
  return <div className="admin-loyalty-points__example-box">{children}</div>
}

function SectionCard({ icon: Icon, title, subtitle, children, footer }) {
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
            <h3 className="admin-card__title">{title}</h3>
            {subtitle ? <p className="admin-card__subtitle">{subtitle}</p> : null}
          </div>
        </div>
      </div>
      <div className="admin-loyalty-points__card-body">{children}</div>
      {footer ? <div className="admin-loyalty-points__card-footer">{footer}</div> : null}
    </section>
  )
}

export default function AdminLoyaltyPointsPage() {
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [adjustUserId, setAdjustUserId] = useState('')
  const [adjustPoints, setAdjustPoints] = useState('')
  const [adjustNote, setAdjustNote] = useState('')
  const [adjusting, setAdjusting] = useState(false)

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['admin', 'loyalty-points', 'settings'],
    queryFn: ({ signal }) => getAdminLoyaltyPointsSettings({ signal, storefront: 'ecomm' }),
  })

  useEffect(() => {
    const s = data?.settings || data?.data?.settings
    if (!s) return
    setForm({
      enabled: Boolean(s.enabled),
      earnPointsPerRupee: Number(s.earnPointsPerRupee) || 0,
      redeemRupeePerPoint: Number(s.redeemRupeePerPoint) || 0,
      minOrderSubtotalToEarn: Number(s.minOrderSubtotalToEarn) || 0,
      minOrderSubtotalToRedeem: Number(s.minOrderSubtotalToRedeem) || 0,
      minRedeemPoints: Number(s.minRedeemPoints) || 0,
      maxRedeemPercentOfPayable: Number(s.maxRedeemPercentOfPayable) || 0,
      maxRedeemPointsPerOrder:
        s.maxRedeemPointsPerOrder != null && Number(s.maxRedeemPointsPerOrder) > 0
          ? Number(s.maxRedeemPointsPerOrder)
          : '',
      expiryDays: Number(s.expiryDays) || 0,
      earnOnShipping: Boolean(s.earnOnShipping),
      earnOnTax: Boolean(s.earnOnTax),
      stackWithCoupon: s.stackWithCoupon !== false,
      termsHtml: s.termsHtml || '',
    })
  }, [data])

  const examples = useMemo(
    () => buildDynamicExamples(form, adjustPoints),
    [form, adjustPoints]
  )

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateAdminLoyaltyPointsSettings({
        storefront: 'ecomm',
        ...form,
        earnPointsPerRupee: Number(form.earnPointsPerRupee) || 0,
        redeemRupeePerPoint: Number(form.redeemRupeePerPoint) || 0,
        minOrderSubtotalToEarn: Number(form.minOrderSubtotalToEarn) || 0,
        minOrderSubtotalToRedeem: Number(form.minOrderSubtotalToRedeem) || 0,
        minRedeemPoints: Math.max(0, Math.floor(Number(form.minRedeemPoints) || 0)),
        maxRedeemPercentOfPayable: Math.min(
          100,
          Math.max(0, Number(form.maxRedeemPercentOfPayable) || 0)
        ),
        maxRedeemPointsPerOrder:
          form.maxRedeemPointsPerOrder === '' || form.maxRedeemPointsPerOrder == null
            ? null
            : Math.max(0, Math.floor(Number(form.maxRedeemPointsPerOrder) || 0)),
        expiryDays: Math.max(0, Math.floor(Number(form.expiryDays) || 0)),
      })
      toast.success('Loyalty points settings saved')
      refetch()
    } catch (err) {
      toast.error(err?.message || 'Could not save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleAdjust = async () => {
    const userId = String(adjustUserId || '').trim()
    const points = Number(adjustPoints)
    if (!userId) {
      toast.error('Customer userId is required')
      return
    }
    if (!Number.isFinite(points) || points === 0) {
      toast.error('Enter a non-zero points delta (+credit / −debit)')
      return
    }
    setAdjusting(true)
    try {
      const res = await adjustAdminLoyaltyPoints({
        userId,
        points,
        note: adjustNote,
        storefront: 'ecomm',
      })
      toast.success(`Balance updated: ${res?.balance ?? '—'} pts`)
      setAdjustPoints('')
      setAdjustNote('')
    } catch (err) {
      toast.error(err?.message || 'Adjust failed')
    } finally {
      setAdjusting(false)
    }
  }

  return (
    <div className="admin-page admin-loyalty-points">
      <AdminPageHeader eyebrow="Marketing" title="Loyalty points">
        <div className="admin-row-actions" style={{ marginTop: 16 }}>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={isFetching}
            onClick={() => refetch()}
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
        Separate from badges. Turn on to let customers earn points after payment and use them at
        checkout. COD and partial pay also use the final discounted total. On RTO / return refund,
        earned points are taken back and used points are returned. Examples under each field update
        live as you type.
      </p>

      {isLoading ? (
        <AdminLoading />
      ) : isError ? (
        <AdminError message={error?.message || 'Failed to load settings'} onRetry={refetch} />
      ) : (
        <div className="admin-loyalty-points__stack">
          <SectionCard
            icon={ShieldCheck}
            title="Program"
            subtitle="On / off for the whole points system"
          >
            <ToggleRow
              id="lp-enabled"
              checked={form.enabled}
              onChange={(v) => setField('enabled', v)}
              title="Turn on points"
              description="Off = no earn, no redeem, checkout stays the same."
            />
            <div
              className={`admin-loyalty-points__status ${
                form.enabled
                  ? 'admin-loyalty-points__status--on'
                  : 'admin-loyalty-points__status--off'
              }`}
            >
              <Sparkles size={14} />
              {form.enabled ? 'Live on storefront' : 'Paused'}
            </div>
          </SectionCard>

          <SectionCard
            icon={Gift}
            title="Earn"
            subtitle="How customers get points after payment"
          >
            <ExampleBox>{examples.earnStory}</ExampleBox>
            <div className="admin-loyalty-points__grid">
              <FieldWithExample
                label="Earn rate (points per ₹1)"
                htmlFor="lp-earn-rate"
                example={examples.earnRate}
              >
                <Input
                  id="lp-earn-rate"
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.earnPointsPerRupee}
                  onChange={(e) => setField('earnPointsPerRupee', e.target.value)}
                />
              </FieldWithExample>
              <FieldWithExample
                label="Min order to earn (₹)"
                htmlFor="lp-earn-min"
                example={examples.earnMin}
              >
                <Input
                  id="lp-earn-min"
                  type="number"
                  min={0}
                  value={form.minOrderSubtotalToEarn}
                  onChange={(e) => setField('minOrderSubtotalToEarn', e.target.value)}
                />
              </FieldWithExample>
              <FieldWithExample
                label="Expiry (days, 0 = never)"
                htmlFor="lp-expiry"
                example={examples.expiry}
              >
                <Input
                  id="lp-expiry"
                  type="number"
                  min={0}
                  value={form.expiryDays}
                  onChange={(e) => setField('expiryDays', e.target.value)}
                />
              </FieldWithExample>
            </div>
            <div className="admin-loyalty-points__toggles">
              <ToggleRow
                id="lp-earn-ship"
                checked={form.earnOnShipping}
                onChange={(v) => setField('earnOnShipping', v)}
                title="Include shipping"
                description={
                  form.earnOnShipping
                    ? 'ON now = also give points on delivery charges.'
                    : 'OFF now = only on products (cash paid).'
                }
              />
              <ToggleRow
                id="lp-earn-tax"
                checked={form.earnOnTax}
                onChange={(v) => setField('earnOnTax', v)}
                title="Include tax"
                description={
                  form.earnOnTax
                    ? 'ON now = also give points on tax.'
                    : 'OFF now = no points on tax.'
                }
              />
            </div>
          </SectionCard>

          <SectionCard
            icon={Percent}
            title="Redeem"
            subtitle="How points are used for discount at checkout"
          >
            <ExampleBox>{examples.redeemStory}</ExampleBox>
            <div className="admin-loyalty-points__grid">
              <FieldWithExample
                label="Redeem value (₹ per point)"
                htmlFor="lp-redeem-rate"
                example={examples.redeemValue}
              >
                <Input
                  id="lp-redeem-rate"
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.redeemRupeePerPoint}
                  onChange={(e) => setField('redeemRupeePerPoint', e.target.value)}
                />
              </FieldWithExample>
              <FieldWithExample
                label="Max % of bill with points"
                htmlFor="lp-max-pct"
                example={examples.maxPct}
              >
                <Input
                  id="lp-max-pct"
                  type="number"
                  min={0}
                  max={100}
                  value={form.maxRedeemPercentOfPayable}
                  onChange={(e) => setField('maxRedeemPercentOfPayable', e.target.value)}
                />
              </FieldWithExample>
              <FieldWithExample
                label="Max points per order"
                htmlFor="lp-max-pts"
                example={examples.maxPts}
              >
                <Input
                  id="lp-max-pts"
                  type="number"
                  min={0}
                  placeholder="No limit"
                  value={form.maxRedeemPointsPerOrder}
                  onChange={(e) => setField('maxRedeemPointsPerOrder', e.target.value)}
                />
              </FieldWithExample>
              <FieldWithExample
                label="Min points to use"
                htmlFor="lp-min-pts"
                example={examples.minPts}
              >
                <Input
                  id="lp-min-pts"
                  type="number"
                  min={0}
                  value={form.minRedeemPoints}
                  onChange={(e) => setField('minRedeemPoints', e.target.value)}
                />
              </FieldWithExample>
              <FieldWithExample
                label="Min order to redeem (₹)"
                htmlFor="lp-redeem-min"
                example={examples.redeemMin}
              >
                <Input
                  id="lp-redeem-min"
                  type="number"
                  min={0}
                  value={form.minOrderSubtotalToRedeem}
                  onChange={(e) => setField('minOrderSubtotalToRedeem', e.target.value)}
                />
              </FieldWithExample>
            </div>
            <div className="admin-loyalty-points__toggles">
              <ToggleRow
                id="lp-stack"
                checked={form.stackWithCoupon}
                onChange={(v) => setField('stackWithCoupon', v)}
                title="Allow with coupon"
                description={examples.stack}
              />
            </div>
          </SectionCard>

          <SectionCard icon={Coins} title="Terms" subtitle="Optional text for customers">
            <FieldWithExample
              label="Terms text (HTML ok)"
              htmlFor="lp-terms"
              example={examples.terms}
            >
              <textarea
                id="lp-terms"
                className="input admin-loyalty-points__textarea"
                rows={5}
                value={form.termsHtml}
                onChange={(e) => setField('termsHtml', e.target.value)}
                placeholder="e.g. Points expire after 365 days. Not transferable."
              />
            </FieldWithExample>
          </SectionCard>

          <SectionCard
            icon={UserCog}
            title="Manual adjust"
            subtitle="Add or remove points for one customer"
            footer={
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={adjusting}
                onClick={handleAdjust}
              >
                {adjusting ? <Loader2 size={14} className="admin-settings-profile__spin" /> : null}
                {adjusting ? 'Updating…' : 'Apply'}
              </Button>
            }
          >
            <ExampleBox>
              <strong>Story:</strong> Customer forgot points → put +500.
              <br />
              Mistake / abuse → put -200.
            </ExampleBox>
            <div className="admin-loyalty-points__grid">
              <FieldWithExample
                label="Customer user ID"
                htmlFor="lp-adj-user"
                example="Mongo _id of the customer from admin customers list."
              >
                <Input
                  id="lp-adj-user"
                  value={adjustUserId}
                  onChange={(e) => setAdjustUserId(e.target.value)}
                  placeholder="Mongo user id"
                  autoComplete="off"
                />
              </FieldWithExample>
              <FieldWithExample
                label="Points (+ or −)"
                htmlFor="lp-adj-pts"
                example={examples.adjustPts}
              >
                <Input
                  id="lp-adj-pts"
                  type="number"
                  value={adjustPoints}
                  onChange={(e) => setAdjustPoints(e.target.value)}
                  placeholder="e.g. 100 or -50"
                />
              </FieldWithExample>
              <FieldWithExample
                label="Note (optional)"
                htmlFor="lp-adj-note"
                example="Shown in ledger — e.g. goodwill credit / correction."
              >
                <Input
                  id="lp-adj-note"
                  value={adjustNote}
                  onChange={(e) => setAdjustNote(e.target.value)}
                  placeholder="Why you changed it"
                />
              </FieldWithExample>
            </div>
          </SectionCard>

          <div className="admin-loyalty-points__sticky-actions">
            <Button type="button" variant="primary" disabled={saving} onClick={handleSave}>
              {saving ? <Loader2 size={14} className="admin-settings-profile__spin" /> : null}
              {saving ? 'Saving…' : 'Save settings'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
