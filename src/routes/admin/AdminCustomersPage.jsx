import { useCallback, useEffect, useMemo, useState } from 'react'
import { Bell, Download, Eye, Heart, Mail, Search, Share2, ShoppingBag, Smartphone } from 'lucide-react'
import { toast } from 'sonner'
import {
  AdminEmpty,
  AdminError,
  AdminLoading,
  AdminPageHeader,
  extractListPayload,
} from '@/features/admin/components/AdminUi'
import { AdminCartDetailsModal } from '@/features/admin/components/AdminCartDetailsModal'
import { AdminCustomerDetailsModal } from '@/features/admin/components/AdminCustomerDetailsModal'
import { BulkActionsMenu } from '@/features/admin/components/BulkActionsMenu'
import { CartReminderEmailModal } from '@/features/admin/components/CartReminderEmailModal'
import { CartReminderPushModal } from '@/features/admin/components/CartReminderPushModal'
import { LeadsAutoPushToggle } from '@/features/admin/components/LeadsAutoPushToggle'
import {
  useAdminEngagementSummary,
  useAdminUsers,
  useExportAdminUsers,
} from '@/features/admin/hooks'

const ENGAGEMENT_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'push_on', label: 'Notifications on' },
  { id: 'push_off', label: 'Notifications off' },
  { id: 'pwa_on', label: 'App installed' },
  { id: 'pwa_off', label: 'App not installed' },
  { id: 'push_and_pwa', label: 'App + Notifications' },
]

function formatJoinedDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatJoinedTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function userIdOf(user) {
  return user?._id || user?.id
}

function snapshotUser(user) {
  return {
    _id: userIdOf(user),
    name: user?.name,
    email: user?.email,
    cartItemsCount: user?.cartItemsCount || 0,
  }
}

const RANDOM_WHATSAPP_MESSAGES = [
  (name) =>
    `Hello ${name || 'there'}! 👋 Thank you for checking out our store. How can we assist you with your shopping today?`,
  (name) =>
    `Hi ${name || 'there'}! ✨ We noticed your interest in our collection. Let us know if you need any recommendations or details!`,
  (name) =>
    `Hello ${name || 'there'}! 🛍️ We have special offers running on our top styles today. Feel free to reply if you'd like to explore!`,
  (name) =>
    `Hi ${name || 'there'}! 💬 Thanks for visiting us. If you have any questions about sizing, orders, or delivery, we are here to help!`,
  (name) =>
    `Hello ${name || 'there'}! Hope you're having a wonderful day. Let us know if we can help you find anything special today!`,
]

function formatWhatsAppPhone(phone) {
  if (!phone) return ''
  let digits = String(phone).replace(/\D/g, '')
  if (!digits) return ''
  if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1)
  }
  if (digits.length === 10) {
    digits = `91${digits}`
  }
  return digits
}

function getRandomWhatsAppMessage(name) {
  const cleanName = name && name !== 'Customer' && name !== 'Unnamed' ? name.trim() : ''
  const template = RANDOM_WHATSAPP_MESSAGES[Math.floor(Math.random() * RANDOM_WHATSAPP_MESSAGES.length)]
  return template(cleanName)
}

function NotificationsCell({ user }) {
  const on = Boolean(user?.notificationsEnabled)
  const count = Number(user?.pushDeviceCount) || 0
  if (!on) {
    return (
      <div className="admin-leads__notify">
        <span className="admin-leads__badge admin-leads__badge--off">Off</span>
      </div>
    )
  }
  return (
    <div className="admin-leads__notify">
      <span className="admin-leads__badge admin-leads__badge--on">
        On{count > 0 ? ` · ${count} device${count === 1 ? '' : 's'}` : ''}
      </span>
      {user?.pushSubscribedAt ? (
        <small className="admin-leads__badge-meta">
          Since {formatJoinedDate(user.pushSubscribedAt)}
        </small>
      ) : null}
    </div>
  )
}

function AppInstallCell({ user }) {
  const installed = Boolean(user?.pwaInstalled)
  if (!installed) {
    return (
      <div className="admin-leads__notify">
        <span className="admin-leads__badge admin-leads__badge--off">Not installed</span>
      </div>
    )
  }
  return (
    <div className="admin-leads__notify">
      <span className="admin-leads__badge admin-leads__badge--app">Installed</span>
      {user?.pwaInstalledAt ? (
        <small className="admin-leads__badge-meta">
          {formatJoinedDate(user.pwaInstalledAt)}
        </small>
      ) : null}
    </div>
  )
}

export default function AdminCustomersPage() {
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [engagement, setEngagement] = useState('all')
  const [selectedIds, setSelectedIds] = useState([])
  const [selectedMeta, setSelectedMeta] = useState({})
  const [cartUser, setCartUser] = useState(null)
  const [detailUser, setDetailUser] = useState(null)
  const [cartReminderOpen, setCartReminderOpen] = useState(false)
  const [cartReminderRecipients, setCartReminderRecipients] = useState([])
  const [cartPushOpen, setCartPushOpen] = useState(false)
  const [cartPushRecipients, setCartPushRecipients] = useState([])

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const { data, isLoading, isError, error, refetch, isFetching } = useAdminUsers({
    page,
    limit: 10,
    search,
    role,
    engagement,
  })
  const {
    data: summary,
    isLoading: summaryLoading,
    isError: summaryError,
    refetch: refetchSummary,
  } = useAdminEngagementSummary()
  const exportUsers = useExportAdminUsers()

  const { items: users, pagination } = useMemo(() => {
    if (Array.isArray(data?.data)) {
      return { items: data.data, pagination: data.pagination || {} }
    }
    return extractListPayload(data, ['users', 'data'])
  }, [data])

  const totalPages = Math.max(1, Number(pagination?.totalPages) || 1)
  const allSelected = users.length > 0 && users.every((u) => selectedIds.includes(userIdOf(u)))

  const stats = useMemo(
    () => ({
      total: Number(summary?.total) || 0,
      notificationsOn: Number(summary?.notificationsOn) || 0,
      notificationsOff: Number(summary?.notificationsOff) || 0,
      pwaInstalled: Number(summary?.pwaInstalled) || 0,
      pwaNotInstalled: Number(summary?.pwaNotInstalled) || 0,
      appAndNotifications: Number(summary?.appAndNotifications) || 0,
    }),
    [summary]
  )

  const setEngagementFilter = (next) => {
    const value = String(next || 'all')
    setEngagement(value)
    setPage(1)
  }

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(users.map(userIdOf).filter(Boolean))
      setSelectedMeta((prev) => {
        const next = { ...prev }
        users.forEach((u) => {
          const id = userIdOf(u)
          if (id) next[id] = snapshotUser(u)
        })
        return next
      })
    } else {
      setSelectedIds([])
      setSelectedMeta({})
    }
  }

  const toggleUser = (user) => {
    const id = userIdOf(user)
    if (!id) return
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
    setSelectedMeta((prev) => {
      const next = { ...prev }
      if (next[id]) delete next[id]
      else next[id] = snapshotUser(user)
      return next
    })
  }

  const buildRecipientsFromSelection = useCallback(() => {
    return selectedIds.map((id) => {
      if (selectedMeta[id]) return selectedMeta[id]
      const fromPage = users.find((u) => userIdOf(u) === id)
      if (fromPage) return snapshotUser(fromPage)
      return { _id: id, name: 'Customer', email: '—', cartItemsCount: 0 }
    })
  }, [selectedIds, selectedMeta, users])

  const openCartReminder = (recipients) => {
    if (!recipients?.length) return
    setCartReminderRecipients(recipients)
    setCartReminderOpen(true)
  }

  const openCartPush = (recipients) => {
    if (!recipients?.length) return
    setCartPushRecipients(recipients)
    setCartPushOpen(true)
  }

  const handleBulkCartEmail = () => {
    if (!selectedIds.length) return
    openCartReminder(buildRecipientsFromSelection())
  }

  const handleBulkCartPush = () => {
    if (!selectedIds.length) return
    openCartPush(buildRecipientsFromSelection())
  }

  const handleSingleCartEmail = (user) => {
    if (!userIdOf(user)) return
    if ((user.cartItemsCount || 0) === 0) {
      toast.warning('This customer has an empty cart.')
      return
    }
    openCartReminder([snapshotUser(user)])
  }

  const handleShareWhatsApp = (user) => {
    const rawPhone = user?.phone || user?.phoneNumber || user?.phone_number
    const cleanPhone = formatWhatsAppPhone(rawPhone)
    if (!cleanPhone) {
      toast.warning('No valid phone number found for this customer.')
      return
    }
    const message = getRandomWhatsAppMessage(user?.name)
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }
  const handleExport = async () => {
    try {
      await exportUsers.mutateAsync({ search, role })
      toast.success('Customers exported')
    } catch (err) {
      toast.error(err?.message || 'Export failed')
    }
  }

  const handleRetry = () => {
    refetch()
    refetchSummary()
  }

  return (
    <div className="admin-page admin-leads">
      <AdminPageHeader title="Leads" />

      <div className="admin-leads__stats" role="group" aria-label="Customer engagement summary">
        <button
          type="button"
          className={`admin-leads__stat${engagement === 'all' ? ' is-active' : ''}`}
          onClick={() => setEngagementFilter('all')}
        >
          <span className="admin-leads__stat-label">Total</span>
          <strong className="admin-leads__stat-value">
            {summaryLoading ? '…' : stats.total}
          </strong>
        </button>
        <button
          type="button"
          className={`admin-leads__stat${engagement === 'push_on' ? ' is-active' : ''}`}
          onClick={() => setEngagementFilter('push_on')}
        >
          <span className="admin-leads__stat-label">
            <Bell size={12} aria-hidden="true" /> Notifications on
          </span>
          <strong className="admin-leads__stat-value">
            {summaryLoading ? '…' : stats.notificationsOn}
          </strong>
          <small className="admin-leads__stat-sub">
            {stats.notificationsOff} off
          </small>
        </button>
        <button
          type="button"
          className={`admin-leads__stat${engagement === 'pwa_on' ? ' is-active' : ''}`}
          onClick={() => setEngagementFilter('pwa_on')}
        >
          <span className="admin-leads__stat-label">
            <Smartphone size={12} aria-hidden="true" /> App installed
          </span>
          <strong className="admin-leads__stat-value">
            {summaryLoading ? '…' : stats.pwaInstalled}
          </strong>
          <small className="admin-leads__stat-sub">
            {stats.pwaNotInstalled} not installed
          </small>
        </button>
        <button
          type="button"
          className={`admin-leads__stat${engagement === 'push_and_pwa' ? ' is-active' : ''}`}
          onClick={() => setEngagementFilter('push_and_pwa')}
        >
          <span className="admin-leads__stat-label">App + Notifications</span>
          <strong className="admin-leads__stat-value">
            {summaryLoading ? '…' : stats.appAndNotifications}
          </strong>
        </button>
      </div>

      {summaryError ? (
        <p className="admin-leads__summary-error">
          Could not load engagement summary.{' '}
          <button type="button" className="admin-leads__summary-retry" onClick={refetchSummary}>
            Retry
          </button>
        </p>
      ) : null}

      <div className="admin-leads__filters" role="tablist" aria-label="Engagement filters">
        {ENGAGEMENT_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={engagement === f.id}
            className={`admin-leads__filter${engagement === f.id ? ' is-active' : ''}`}
            onClick={() => setEngagementFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="admin-leads__toolbar">
        <div className="admin-leads__search">
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search customers..."
            aria-label="Search customers"
          />
        </div>

        <LeadsAutoPushToggle />

        <select
          className="admin-leads__role"
          value={role}
          onChange={(e) => {
            setRole(e.target.value)
            setPage(1)
          }}
          aria-label="Filter by role"
        >
          <option value="">All Roles</option>
          <option value="user">Customer</option>
          <option value="wholesaler">Wholesaler</option>
        </select>

        <button
          type="button"
          className="admin-leads__export"
          onClick={handleExport}
          disabled={exportUsers.isPending}
        >
          {exportUsers.isPending ? (
            <span className="admin-leads__export-spin" aria-hidden="true" />
          ) : (
            <Download size={16} aria-hidden="true" />
          )}
          {exportUsers.isPending ? 'Exporting…' : 'Export Data'}
        </button>

        <BulkActionsMenu
          count={selectedIds.length}
          onCartEmail={handleBulkCartEmail}
          onCartPush={handleBulkCartPush}
        />
      </div>

      <div className="admin-card admin-card--flush admin-leads__card">
        {isFetching && !isLoading ? (
          <div className="admin-leads__updating" aria-busy="true">Updating…</div>
        ) : null}

        {isLoading && <AdminLoading label="Loading customers…" />}
        {isError && <AdminError message={error?.message} onRetry={handleRetry} />}
        {!isLoading && !isError && users.length === 0 && (
          <AdminEmpty message="No customers found." />
        )}

        {!isLoading && !isError && users.length > 0 && (
          <div className="admin-table-wrap">
            <table className="admin-table admin-leads__table">
              <thead>
                <tr>
                  <th className="admin-leads__check-col">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      aria-label="Select all customers"
                    />
                  </th>
                  <th>Customer</th>
                  <th>Notifications</th>
                  <th>App</th>
                  <th>Cart / Wish</th>
                  <th>Joined</th>
                  <th className="admin-leads__actions-col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const id = userIdOf(user)
                  const initial = (user.name || user.email || '?').charAt(0).toUpperCase()
                  return (
                    <tr key={id}>
                      <td className="admin-leads__check-col">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(id)}
                          onChange={() => toggleUser(user)}
                          aria-label={`Select ${user.name || user.email || 'customer'}`}
                        />
                      </td>
                      <td>
                        <div className="admin-leads__customer">
                          <span className="admin-leads__avatar" aria-hidden="true">{initial}</span>
                          <div className="admin-leads__customer-meta">
                            <strong>{user.name || 'Customer'}</strong>
                            <span>{user.email || '—'}</span>
                            <span className="admin-leads__phone">
                              {user.phone ? user.phone : 'No phone'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <NotificationsCell user={user} />
                      </td>
                      <td>
                        <AppInstallCell user={user} />
                      </td>
                      <td>
                        <div className="admin-leads__engage">
                          <button
                            type="button"
                            className="admin-leads__engage-chip admin-leads__engage-chip--cart"
                            title="View cart items"
                            onClick={() => setCartUser(user)}
                          >
                            <ShoppingBag size={12} aria-hidden="true" />
                            {user.cartItemsCount || 0}
                          </button>
                          <button
                            type="button"
                            className="admin-leads__engage-chip admin-leads__engage-chip--wish"
                            title="View customer details"
                            onClick={() => setDetailUser(user)}
                          >
                            <Heart size={12} aria-hidden="true" />
                            {user.wishlistCount || 0}
                          </button>
                        </div>
                      </td>
                      <td>
                        <div className="admin-leads__joined">
                          <span>{formatJoinedDate(user.createdAt)}</span>
                          <small>{formatJoinedTime(user.createdAt)}</small>
                        </div>
                      </td>
                      <td className="admin-leads__actions-col">
                        <div className="admin-leads__row-actions">
                          <button
                            type="button"
                            className="admin-leads__row-action"
                            onClick={() => handleSingleCartEmail(user)}
                            disabled={!(user.cartItemsCount > 0)}
                            title={
                              user.cartItemsCount > 0
                                ? 'Send cart reminder email'
                                : 'Empty cart — no reminder email'
                            }
                            aria-label="Send cart reminder email"
                          >
                            <Mail size={15} />
                          </button>
                          <button
                            type="button"
                            className="admin-leads__row-action admin-leads__row-action--share"
                            onClick={() => handleShareWhatsApp(user)}
                            disabled={!user.phone}
                            title={
                              user.phone
                                ? `Share via WhatsApp (${user.phone})`
                                : 'No phone number available'
                            }
                            aria-label="Share via WhatsApp"
                          >
                            <Share2 size={15} />
                          </button>
                          <button
                            type="button"
                            className="admin-leads__row-action"
                            onClick={() => setDetailUser(user)}
                            title="View customer details"
                            aria-label="View customer details"
                          >
                            <Eye size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="admin-leads__pager">
          <span>Page {page} of {totalPages}</span>
          <div className="admin-leads__pager-btns">
            <button
              type="button"
              className="admin-leads__pager-btn"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </button>
            <button
              type="button"
              className="admin-leads__pager-btn admin-leads__pager-btn--next"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <AdminCartDetailsModal
        open={Boolean(cartUser)}
        onClose={() => setCartUser(null)}
        userId={cartUser ? userIdOf(cartUser) : null}
        fallbackUser={cartUser}
      />

      <AdminCustomerDetailsModal
        open={Boolean(detailUser)}
        onClose={() => setDetailUser(null)}
        userId={detailUser ? userIdOf(detailUser) : null}
        initialUser={detailUser}
        onViewCart={(id, user) => {
          setDetailUser(null)
          setCartUser(user || { _id: id, id })
        }}
      />

      <CartReminderEmailModal
        open={cartReminderOpen}
        onClose={() => {
          setCartReminderOpen(false)
          setCartReminderRecipients([])
        }}
        recipients={cartReminderRecipients}
      />

      <CartReminderPushModal
        open={cartPushOpen}
        onClose={() => {
          setCartPushOpen(false)
          setCartPushRecipients([])
        }}
        recipients={cartPushRecipients}
      />
    </div>
  )
}
