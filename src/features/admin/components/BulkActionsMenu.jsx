import { useEffect, useRef, useState } from 'react'
import { Bell, ChevronDown, ListFilter, Mail, MessageCircle } from 'lucide-react'

/**
 * Bulk actions dropdown — shown when one or more customers are selected.
 */
export function BulkActionsMenu({ count = 0, onCartEmail, onCartPush, align = 'right' }) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  useEffect(() => {
    if (!count) setOpen(false)
  }, [count])

  if (!count) return null

  return (
    <div className={`admin-bulk-actions${align === 'left' ? ' is-left' : ''}`} ref={menuRef}>
      <button
        type="button"
        className="admin-bulk-actions__trigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <ListFilter size={18} aria-hidden />
        {`Bulk Actions (${count})`}
        <ChevronDown size={16} aria-hidden />
      </button>

      {open ? (
        <div className="admin-bulk-actions__menu" role="menu">
          <button
            type="button"
            role="menuitem"
            className="admin-bulk-actions__item"
            onClick={() => {
              setOpen(false)
              onCartEmail?.()
            }}
          >
            <Mail size={15} className="admin-bulk-actions__icon admin-bulk-actions__icon--email" aria-hidden />
            Send cart reminder (Email)
          </button>
          <button
            type="button"
            role="menuitem"
            className="admin-bulk-actions__item"
            onClick={() => {
              setOpen(false)
              onCartPush?.()
            }}
          >
            <Bell size={15} className="admin-bulk-actions__icon admin-bulk-actions__icon--push" aria-hidden />
            Send cart reminder (Notification)
          </button>
          <button
            type="button"
            role="menuitem"
            className="admin-bulk-actions__item is-disabled"
            disabled
            title="WhatsApp bulk — connect WATI/Meta API later"
          >
            <MessageCircle size={15} className="admin-bulk-actions__icon admin-bulk-actions__icon--wa" aria-hidden />
            WhatsApp (coming soon)
          </button>
        </div>
      ) : null}
    </div>
  )
}

export default BulkActionsMenu
