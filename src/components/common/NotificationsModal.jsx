import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, Loader2, X } from 'lucide-react'
import {
  fetchNotifications,
  fetchUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/features/notifications/api'
import { stopLenis, startLenis } from '@/lib/lenis'
import '@/styles/notifications-panel.css'

function fmtWhen(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const now = new Date()
  const diffMs = now - d
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  }).format(d)
}

function typeLabel(type) {
  const t = String(type || '').toLowerCase()
  if (t === 'back_in_stock') return 'Back in stock'
  if (t === 'rto_initiated') return 'RTO'
  if (t === 'order_amended') return 'Order update'
  if (t.startsWith('refund_')) return 'Refund'
  return 'Alert'
}

function typeTone(type) {
  const t = String(type || '').toLowerCase()
  if (t === 'back_in_stock' || t === 'refund_processed') return 'success'
  if (t === 'refund_rejected' || t === 'refund_failed') return 'danger'
  if (t === 'rto_initiated' || t === 'refund_not_applicable') return 'warn'
  if (t === 'order_amended' || t === 'refund_initiated') return 'info'
  return 'neutral'
}

export const NotificationsModal = memo(function NotificationsModal({
  open,
  onClose,
  isLoggedIn = false,
  onUnreadChange,
}) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [markingAll, setMarkingAll] = useState(false)
  const [error, setError] = useState('')
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!open) return undefined
    stopLenis()
    document.documentElement.classList.add('modal-open')
    document.body.style.overflow = 'hidden'
    return () => {
      startLenis()
      document.documentElement.classList.remove('modal-open')
      document.body.style.overflow = ''
    }
  }, [open])

  const onUnreadChangeRef = useRef(onUnreadChange)
  useEffect(() => {
    onUnreadChangeRef.current = onUnreadChange
  }, [onUnreadChange])

  useEffect(() => {
    if (!open || !isLoggedIn) return undefined
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const [list, count] = await Promise.all([
          fetchNotifications({ page: 1, limit: 25 }),
          fetchUnreadNotificationCount(),
        ])
        if (cancelled) return
        const safeCount = Number(count) || 0
        setNotifications(Array.isArray(list.notifications) ? list.notifications : [])
        setUnreadCount(safeCount)
        try {
          onUnreadChangeRef.current?.(safeCount)
        } catch {
          /* ignore */
        }
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Could not load notifications')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open, isLoggedIn])

  useEffect(() => {
    if (!open) return undefined
    const onEsc = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onEsc)
    return () => document.removeEventListener('keydown', onEsc)
  }, [open, onClose])

  const handleItemClick = useCallback(
    async (item) => {
      if (!item?.read && item?.id) {
        try {
          await markNotificationRead(item.id)
          setUnreadCount((c) => {
            const next = Math.max(0, c - 1)
            onUnreadChangeRef.current?.(next)
            return next
          })
          setNotifications((rows) =>
            rows.map((n) => (n.id === item.id ? { ...n, read: true } : n))
          )
        } catch {
          /* non-blocking */
        }
      }
      onClose?.()
      const type = String(item?.type || '').toLowerCase()
      const productSlug = item?.metadata?.productSlug
      if (type === 'back_in_stock' && productSlug) {
        navigate(`/products/${productSlug}`)
        return
      }
      navigate('/account/orders', { state: { highlightOrderId: item.orderId } })
    },
    [navigate, onClose]
  )

  const handleMarkAll = async () => {
    setMarkingAll(true)
    try {
      await markAllNotificationsRead()
      setNotifications((rows) => rows.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
      onUnreadChangeRef.current?.(0)
    } catch {
      /* ignore */
    } finally {
      setMarkingAll(false)
    }
  }

  if (!open) return null

  return createPortal(
    <div
      className="fab-notif-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Notifications"
      onClick={onClose}
    >
      <div
        className="fab-notif-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="fab-notif-panel__head">
          <div className="fab-notif-panel__head-text">
            <h2 className="fab-notif-panel__title">
              <Bell size={16} aria-hidden />
              Notifications
            </h2>
            <p className="fab-notif-panel__sub">
              {unreadCount > 0 ? `${unreadCount} unread` : 'You are all caught up'}
            </p>
          </div>
          <div className="fab-notif-panel__head-actions">
            {unreadCount > 0 && (
              <button
                type="button"
                className="fab-notif-panel__mark-all"
                onClick={handleMarkAll}
                disabled={markingAll}
              >
                {markingAll ? <Loader2 size={14} className="fab-notif-spin" /> : <CheckCheck size={14} />}
                Mark all
              </button>
            )}
            <button
              type="button"
              className="fab-notif-panel__close"
              onClick={onClose}
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        </header>

        <div className="fab-notif-panel__body">
          {!isLoggedIn && (
            <p className="fab-notif-panel__empty">Sign in to see your alerts.</p>
          )}
          {isLoggedIn && loading && (
            <div className="fab-notif-panel__loading">
              <Loader2 className="fab-notif-spin" size={22} />
            </div>
          )}
          {isLoggedIn && !loading && error && (
            <p className="fab-notif-panel__error">{error}</p>
          )}
          {isLoggedIn && !loading && !error && notifications.length === 0 && (
            <p className="fab-notif-panel__empty">No notifications yet.</p>
          )}
          {isLoggedIn &&
            !loading &&
            notifications.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleItemClick(item)}
                className={`fab-notif-item${!item.read ? ' is-unread' : ''}`}
              >
                <div className="fab-notif-item__meta">
                  <span className={`fab-notif-item__badge fab-notif-item__badge--${typeTone(item.type)}`}>
                    {typeLabel(item.type)}
                  </span>
                  <span className="fab-notif-item__time">{fmtWhen(item.sentAt)}</span>
                </div>
                <div className="fab-notif-item__title">{item.title}</div>
                <div className="fab-notif-item__body">{item.body}</div>
              </button>
            ))}
        </div>
      </div>
    </div>,
    document.body
  )
})
