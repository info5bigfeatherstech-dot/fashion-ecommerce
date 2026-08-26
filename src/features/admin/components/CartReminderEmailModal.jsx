import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, Loader2, Mail, X } from 'lucide-react'
import { useSendBulkCartReminderEmail } from '@/features/admin/hooks'

const REASON_LABELS = {
  EMPTY_CART: 'Empty cart — skipped',
  NO_VALID_EMAIL: 'No valid email — skipped',
  USER_NOT_IN_SCOPE_OR_NOT_FOUND: 'Not found — skipped',
  SEND_FAILED: 'Send failed',
}

function statusLabel(detail) {
  if (!detail) return 'Unknown'
  if (detail.status === 'sent') return 'Sent'
  if (detail.reason && REASON_LABELS[detail.reason]) return REASON_LABELS[detail.reason]
  if (detail.status === 'failed') return detail.reason || 'Failed'
  if (detail.status === 'skipped') return detail.reason || 'Skipped'
  return detail.status
}

function statusClass(detail) {
  if (detail?.status === 'sent') return 'is-sent'
  if (detail?.status === 'failed') return 'is-failed'
  return 'is-skipped'
}

const PHASE_META = {
  review: {
    title: 'Send cart reminder',
    subtitle: (n) => `Review ${n} recipient${n === 1 ? '' : 's'} before sending`,
  },
  sending: {
    title: 'Sending emails',
    subtitle: () => 'Please wait — do not close this window',
  },
  done: {
    title: 'Delivery complete',
    subtitle: () => 'Cart reminder emails have been processed',
  },
  error: {
    title: 'Delivery failed',
    subtitle: () => 'Emails could not be sent',
  },
}

export function CartReminderEmailModal({ open, onClose, recipients = [] }) {
  const [phase, setPhase] = useState('review')
  const [result, setResult] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [sendLocked, setSendLocked] = useState(false)
  const sendInFlightRef = useRef(false)
  const sendEmail = useSendBulkCartReminderEmail()

  const userIds = useMemo(
    () => recipients.map((r) => r._id || r.id).filter(Boolean),
    [recipients]
  )
  const withCart = recipients.filter((r) => (r.cartItemsCount || 0) > 0).length
  const emptyCart = recipients.length - withCart
  const meta = PHASE_META[phase] || PHASE_META.review
  const canClose = phase !== 'sending'

  useEffect(() => {
    if (!open) {
      setPhase('review')
      setResult(null)
      setErrorMessage('')
      setSendLocked(false)
      sendInFlightRef.current = false
      return undefined
    }

    setPhase('review')
    setResult(null)
    setErrorMessage('')
    setSendLocked(false)
    sendInFlightRef.current = false

    const onKey = (e) => {
      if (e.key === 'Escape' && phase !== 'sending') onClose?.()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const handleSend = async () => {
    if (!userIds.length || sendInFlightRef.current || sendLocked) return
    sendInFlightRef.current = true
    setSendLocked(true)
    setPhase('sending')
    setErrorMessage('')

    try {
      const res = await sendEmail.mutateAsync(userIds)
      setResult(res)
      setPhase('done')
    } catch (err) {
      setErrorMessage(err?.message || 'Could not send cart reminder emails.')
      setPhase('error')
      sendInFlightRef.current = false
      setSendLocked(false)
    }
  }

  const detailRows = useMemo(() => {
    if (!result?.details?.length) return []
    return result.details.filter((d) => d.userId || d.email)
  }, [result])

  if (!open) return null

  return (
    <div className="admin-cart-reminder" role="presentation">
      <div
        className="admin-cart-reminder__backdrop"
        onClick={canClose ? onClose : undefined}
        aria-hidden
      />
      <div
        className="admin-cart-reminder__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-reminder-email-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className={`admin-cart-reminder__head admin-cart-reminder__head--${phase}`}>
          <div>
            <h3 id="cart-reminder-email-title">{meta.title}</h3>
            <p>{meta.subtitle(recipients.length)}</p>
          </div>
          {canClose ? (
            <button type="button" className="admin-cart-reminder__close" onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          ) : null}
        </header>

        <div className="admin-cart-reminder__body">
          {phase === 'review' ? (
            <>
              <div className="admin-cart-reminder__chips">
                <span>{recipients.length} selected</span>
                {withCart > 0 ? <span className="is-ok">{withCart} with cart items</span> : null}
                {emptyCart > 0 ? <span className="is-warn">{emptyCart} empty cart — will skip</span> : null}
              </div>
              <ul className="admin-cart-reminder__list">
                {recipients.map((r) => {
                  const id = r._id || r.id
                  return (
                    <li key={id}>
                      <div>
                        <strong>{r.name || 'Customer'}</strong>
                        <span>{r.email || 'No email'}</span>
                      </div>
                      <em>Cart: {r.cartItemsCount || 0}</em>
                    </li>
                  )
                })}
              </ul>
              <p className="admin-cart-reminder__hint">
                Each customer will receive a personalized email with their cart items and order total.
              </p>
            </>
          ) : null}

          {phase === 'sending' ? (
            <div className="admin-cart-reminder__sending">
              <Loader2 size={36} className="admin-cart-reminder__spin" />
              <Mail size={22} className="admin-cart-reminder__sending-icon" aria-hidden />
              <p>Sending cart reminders</p>
              <small>
                Delivering to {recipients.length} recipient{recipients.length === 1 ? '' : 's'}.
              </small>
              <div className="admin-cart-reminder__progress" aria-hidden>
                <span />
              </div>
            </div>
          ) : null}

          {phase === 'done' && result ? (
            <div className="admin-cart-reminder__done">
              <div className="admin-cart-reminder__check">
                <Check size={28} />
              </div>
              <p className="admin-cart-reminder__done-title">Done</p>
              <p className="admin-cart-reminder__hint">{result.message}</p>
              <div className="admin-cart-reminder__stats">
                <div className="is-sent">
                  <strong>{result.sent ?? 0}</strong>
                  <span>Sent</span>
                </div>
                <div className="is-skipped">
                  <strong>{result.skipped ?? 0}</strong>
                  <span>Skipped</span>
                </div>
                <div className="is-failed">
                  <strong>{result.failed ?? 0}</strong>
                  <span>Failed</span>
                </div>
              </div>
              {detailRows.length > 0 ? (
                <ul className="admin-cart-reminder__details">
                  {detailRows.map((d, i) => (
                    <li key={d.userId || d.email || i} className={statusClass(d)}>
                      <span>{d.email || d.userId}</span>
                      <strong>{statusLabel(d)}</strong>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          {phase === 'error' ? (
            <div className="admin-cart-reminder__error">
              <p>Could not complete delivery</p>
              <small>{errorMessage}</small>
            </div>
          ) : null}
        </div>

        <footer className="admin-cart-reminder__foot">
          {phase === 'review' ? (
            <>
              <button type="button" className="admin-cart-reminder__btn admin-cart-reminder__btn--ghost" onClick={onClose} disabled={sendLocked}>
                Cancel
              </button>
              <button
                type="button"
                className="admin-cart-reminder__btn admin-cart-reminder__btn--primary"
                onClick={handleSend}
                disabled={!userIds.length || sendLocked}
              >
                Send {recipients.length} email{recipients.length === 1 ? '' : 's'}
              </button>
            </>
          ) : null}
          {phase === 'sending' ? <p className="admin-cart-reminder__wait">Sending in progress — please wait</p> : null}
          {phase === 'done' ? (
            <button type="button" className="admin-cart-reminder__btn admin-cart-reminder__btn--success" onClick={onClose}>
              Done
            </button>
          ) : null}
          {phase === 'error' ? (
            <>
              <button type="button" className="admin-cart-reminder__btn admin-cart-reminder__btn--ghost" onClick={onClose}>
                Close
              </button>
              <button type="button" className="admin-cart-reminder__btn admin-cart-reminder__btn--primary" onClick={handleSend}>
                Retry
              </button>
            </>
          ) : null}
        </footer>
      </div>
    </div>
  )
}

export default CartReminderEmailModal
