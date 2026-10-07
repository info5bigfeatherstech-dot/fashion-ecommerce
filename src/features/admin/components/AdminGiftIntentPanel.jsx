import { useState } from 'react'
import { Gift, Pencil, Trash2, Check, X, MessageSquare, Tag, User } from 'lucide-react'
import { toast } from 'sonner'
import {
  useAdminOrderGiftIntent,
  useUpdateAdminOrderGiftIntent,
  useDeleteAdminOrderGiftIntent,
  useGiftIntentOptions,
} from '@/features/orders/hooks'

const EDITABLE_STATUSES = new Set([
  'pending',
  'new',
  'confirmed',
  'bill_sent',
  'processing',
  'ready_to_pick',
])

const DEFAULT_OCCASIONS = [
  { id: 'birthday', label: 'Birthday 🎂' },
  { id: 'anniversary', label: 'Anniversary 💍' },
  { id: 'festival', label: 'Festival 🪔' },
  { id: 'other', label: 'Other ✨' },
]

export function AdminGiftIntentPanel({ order, orderId, onUpdated }) {
  const [isEditing, setIsEditing] = useState(false)

  // Load snapshot & options
  const { data: snapshotData, refetch: refetchSnapshot } = useAdminOrderGiftIntent(orderId)
  const { data: optionsData } = useGiftIntentOptions()
  const updateMutation = useUpdateAdminOrderGiftIntent()
  const deleteMutation = useDeleteAdminOrderGiftIntent()

  const currentIntent =
    snapshotData?.orderIntent ||
    snapshotData ||
    order?.orderIntent ||
    (order?.isGiftOrder ? { type: 'gift_other', giftDetails: order?.giftDetails } : null) || {
      type: 'my_order',
      giftDetails: {},
    }

  const isGift = currentIntent?.type === 'gift_other' || Boolean(order?.isGiftOrder)
  const details = currentIntent?.giftDetails || {}

  const orderStatus = String(order?.orderStatus || order?.status || '').toLowerCase()
  const canEdit = EDITABLE_STATUSES.has(orderStatus)

  // Edit form state
  const [formType, setFormType] = useState(isGift ? 'gift_other' : 'my_order')
  const [recipientName, setRecipientName] = useState(details.recipientName || '')
  const [senderName, setSenderName] = useState(details.senderName || '')
  const [occasion, setOccasion] = useState(details.occasion || '')
  const [message, setMessage] = useState(details.message || '')

  const startEdit = () => {
    setFormType(isGift ? 'gift_other' : 'gift_other')
    setRecipientName(details.recipientName || '')
    setSenderName(details.senderName || '')
    setOccasion(details.occasion || '')
    setMessage(details.message || '')
    setIsEditing(true)
  }

  const cancelEdit = () => {
    setIsEditing(false)
  }

  const handleSave = async (e) => {
    e?.preventDefault?.()
    try {
      const payload = {
        type: formType,
        giftDetails:
          formType === 'gift_other'
            ? {
                recipientName: recipientName.trim(),
                senderName: senderName.trim(),
                occasion: occasion.trim(),
                message: message.trim(),
              }
            : {},
      }

      await updateMutation.mutateAsync({
        orderId,
        orderIntent: payload,
      })

      toast.success(
        formType === 'gift_other' ? 'Gift intent updated' : 'Order intent set to regular'
      )
      setIsEditing(false)
      refetchSnapshot()
      onUpdated?.()
    } catch (err) {
      toast.error(err?.message || 'Failed to update gift intent')
    }
  }

  const handleClear = async () => {
    if (!window.confirm('Clear gift intent and revert order to regular "My Order"?')) return
    try {
      await deleteMutation.mutateAsync(orderId)
      toast.success('Gift intent removed — reverted to regular order')
      refetchSnapshot()
      onUpdated?.()
    } catch (err) {
      toast.error(err?.message || 'Failed to clear gift intent')
    }
  }

  const occasionsList = Array.isArray(optionsData?.occasions) && optionsData.occasions.length > 0
    ? optionsData.occasions.map((occ) => {
        if (typeof occ === 'object' && occ !== null) {
          return { id: occ.id || occ.value, label: occ.label || occ.name || occ.id }
        }
        const str = String(occ)
        const match = DEFAULT_OCCASIONS.find((d) => d.id.toLowerCase() === str.toLowerCase())
        return match || { id: str, label: str.charAt(0).toUpperCase() + str.slice(1) }
      })
    : DEFAULT_OCCASIONS

  return (
    <section className="od-card admin-gift-intent-panel">
      {/* Header */}
      <div className="od-card__head">
        <div className="od-card__title-wrap" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            className="od-card__icon"
            style={{
              background: isGift ? 'rgba(236, 72, 153, 0.12)' : 'var(--color-neutral, #f1f5f9)',
              color: isGift ? '#db2777' : '#64748b',
              width: 30,
              height: 30,
              borderRadius: 6,
            }}
          >
            <Gift size={15} />
          </span>
          <div className="od-card__title-text">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <h3 className="od-card__title" style={{ margin: 0 }}>Gift Intent</h3>
              {isGift ? (
                <span
                  className="admin-badge admin-badge--gift"
                  style={{ fontSize: '10px', padding: '1px 6px', lineHeight: 1.3 }}
                >
                  Gift Order
                </span>
              ) : (
                <span
                  style={{
                    fontSize: '10px',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    background: '#f1f5f9',
                    color: '#64748b',
                    fontWeight: 600,
                  }}
                >
                  Standard
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        {canEdit && !isEditing ? (
          <div className="od-address-actions">
            <button
              type="button"
              className="od-address-actions__btn od-address-actions__btn--edit"
              onClick={startEdit}
            >
              <Pencil size={11} aria-hidden />
              {isGift ? 'Edit' : 'Add Gift'}
            </button>
            {isGift && (
              <button
                type="button"
                className="od-address-actions__btn"
                style={{ color: '#ef4444', borderColor: '#fecaca', background: '#fef2f2' }}
                onClick={handleClear}
                disabled={deleteMutation.isPending}
              >
                <Trash2 size={11} aria-hidden />
                Clear
              </button>
            )}
          </div>
        ) : null}
      </div>

      {/* Body */}
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {!canEdit && (
          <p className="od-muted" style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>
            Locked in status &ldquo;{orderStatus}&rdquo; (editable only in pending/confirmed/processing).
          </p>
        )}

        {isEditing ? (
          /* Edit Form */
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '8px', padding: '4px', background: '#f1f5f9', borderRadius: '8px' }}>
              <button
                type="button"
                onClick={() => setFormType('gift_other')}
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: formType === 'gift_other' ? '#fff' : 'transparent',
                  color: formType === 'gift_other' ? '#db2777' : '#64748b',
                  boxShadow: formType === 'gift_other' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                🎁 Gift Order
              </button>
              <button
                type="button"
                onClick={() => setFormType('my_order')}
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: formType === 'my_order' ? '#fff' : 'transparent',
                  color: formType === 'my_order' ? '#1e293b' : '#64748b',
                  boxShadow: formType === 'my_order' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                Standard Order
              </button>
            </div>

            {formType === 'gift_other' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <span className="od-field-label" style={{ margin: 0 }}>Recipient</span>
                      <span style={{ fontSize: '10px', color: '#94a3b8' }}>{recipientName.length}/80</span>
                    </div>
                    <input
                      type="text"
                      maxLength={80}
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="Receiver name"
                      style={{
                        width: '100%',
                        padding: '6px 9px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '12px',
                      }}
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <span className="od-field-label" style={{ margin: 0 }}>From / Sender</span>
                      <span style={{ fontSize: '10px', color: '#94a3b8' }}>{senderName.length}/80</span>
                    </div>
                    <input
                      type="text"
                      maxLength={80}
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder="Sender name"
                      style={{
                        width: '100%',
                        padding: '6px 9px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '12px',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                    <span className="od-field-label" style={{ margin: 0 }}>Occasion</span>
                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>{occasion.length}/80</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <select
                      value={
                        occasionsList.some((o) => o.id.toLowerCase() === occasion.toLowerCase())
                          ? occasion.toLowerCase()
                          : occasion
                          ? 'custom'
                          : ''
                      }
                      onChange={(e) => {
                        const val = e.target.value
                        if (val !== 'custom') {
                          setOccasion(val)
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '12px',
                        background: '#fff',
                      }}
                    >
                      <option value="">Select preset…</option>
                      {occasionsList.map((occ) => (
                        <option key={occ.id} value={occ.id}>
                          {occ.label}
                        </option>
                      ))}
                      <option value="custom">Custom…</option>
                    </select>

                    <input
                      type="text"
                      maxLength={80}
                      value={occasion}
                      onChange={(e) => setOccasion(e.target.value)}
                      placeholder="Or custom (e.g. Diwali)"
                      style={{
                        width: '100%',
                        padding: '6px 9px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '12px',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                    <span className="od-field-label" style={{ margin: 0 }}>Gift Card Message</span>
                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>{message.length}/300</span>
                  </div>
                  <textarea
                    rows={2}
                    maxLength={300}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Message to be printed on card…"
                    style={{
                      width: '100%',
                      padding: '6px 9px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '12px',
                      resize: 'vertical',
                    }}
                  />
                </div>
              </div>
            ) : null}

            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button
                type="submit"
                disabled={updateMutation.isPending}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#2563eb',
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Check size={13} /> {updateMutation.isPending ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: '#fff',
                  color: '#475569',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <X size={13} /> Cancel
              </button>
            </div>
          </form>
        ) : isGift ? (
          /* Clean Structured Read-Only View */
          <>
            <div className="od-contact-grid" style={{ rowGap: '10px' }}>
              <div>
                <p className="od-field-label">Recipient</p>
                <p className="od-field-value" style={{ margin: 0, fontWeight: 600, color: '#0f172a' }}>
                  {details.recipientName || order?.shippingAddress?.fullName || '—'}
                </p>
              </div>

              <div>
                <p className="od-field-label">From / Sender</p>
                <p className="od-field-value" style={{ margin: 0, fontWeight: 600, color: '#0f172a' }}>
                  {details.senderName || order?.user?.name || '—'}
                </p>
              </div>

              {details.occasion ? (
                <div className="od-contact-grid__full">
                  <p className="od-field-label">Occasion</p>
                  <p className="od-field-value" style={{ margin: 0, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#334155',
                        textTransform: 'capitalize',
                      }}
                    >
                      🎉 {details.occasion}
                    </span>
                  </p>
                </div>
              ) : null}
            </div>

            {details.message ? (
              <div
                style={{
                  marginTop: '4px',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderLeft: '3px solid #db2777',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px' }}>
                  <MessageSquare size={11} style={{ color: '#be185d' }} />
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      color: '#be185d',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Gift Message
                  </span>
                </div>
                <p
                  style={{
                    margin: 0,
                    fontStyle: 'italic',
                    fontSize: '12px',
                    lineHeight: 1.45,
                    color: '#334155',
                  }}
                >
                  &ldquo;{details.message}&rdquo;
                </p>
              </div>
            ) : null}
          </>
        ) : (
          <p className="od-muted" style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
            Standard order placed for personal use. No gift packaging or custom note requested.
          </p>
        )}
      </div>
    </section>
  )
}
