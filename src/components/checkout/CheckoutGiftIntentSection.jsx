import { useId } from 'react'
import { Gift, User, Sparkles } from 'lucide-react'
import { useGiftIntentOptions } from '@/features/orders/hooks'

const DEFAULT_OCCASIONS = [
  { id: 'birthday', label: 'Birthday 🎂' },
  { id: 'anniversary', label: 'Anniversary 💍' },
  { id: 'festival', label: 'Festival 🪔' },
  { id: 'other', label: 'Other Special Occasion ✨' },
]

export function CheckoutGiftIntentSection({ value, onChange, disabled = false }) {
  const recipientId = useId()
  const senderId = useId()
  const occasionId = useId()
  const messageId = useId()

  const { data: optionsData } = useGiftIntentOptions()

  const isGift = value?.type === 'gift_other'
  const details = value?.giftDetails || {}

  const maxLengths = {
    recipientName: 80,
    senderName: 80,
    occasion: 80,
    message: 300,
    ...(optionsData?.maxLengths || {}),
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

  const handleTypeChange = (nextType) => {
    if (disabled) return
    onChange?.({
      type: nextType,
      giftDetails: nextType === 'gift_other' ? { ...details } : {},
    })
  }

  const handleDetailChange = (field, text) => {
    if (disabled) return
    onChange?.({
      type: 'gift_other',
      giftDetails: {
        ...details,
        [field]: text,
      },
    })
  }

  const messageLength = (details.message || '').length

  return (
    <div className="checkout-gift-section" style={{ marginTop: '1.25rem' }}>
      <div className="checkout-gift-section__header" style={{ marginBottom: '0.75rem' }}>
        <p className="body-sm font-semibold" style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
          {/* <Sparkles size={16} style={{ color: '#db2777' }} /> */}
          Who is this order for?
        </p>
        <p className="body-xs text-muted" style={{ margin: '2px 0 0 0' }}>
          Choose whether this package is for you or being sent directly as a special surprise gift.
        </p>
      </div>

      {/* Radio options */}
      <div
        role="radiogroup"
        aria-label="Order intent type"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '10px',
        }}
      >
        <button
          type="button"
          role="radio"
          aria-checked={!isGift}
          disabled={disabled}
          onClick={() => handleTypeChange('my_order')}
          className={`checkout-gift-choice${!isGift ? ' checkout-gift-choice--active' : ''}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 14px',
            borderRadius: '10px',
            border: !isGift ? '2px solid #e8a020' : '1px solid var(--border-color, #e5e7eb)',
            background: !isGift ? 'rgba(232, 160, 32, 0.05)' : 'var(--bg-surface, #fff)',
            cursor: disabled ? 'not-allowed' : 'pointer',
            textAlign: 'left',
            transition: 'all 0.15s ease',
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: !isGift ? '#e8a020' : 'rgba(0,0,0,0.06)',
              color: !isGift ? '#fff' : 'inherit',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <User size={16} />
          </div>
          <div>
            <p className="body-sm font-semibold" style={{ margin: 0 }}>For Myself</p>
            <p className="body-xs text-muted" style={{ margin: 0 }}>Standard order</p>
          </div>
        </button>

        <button
          type="button"
          role="radio"
          aria-checked={isGift}
          disabled={disabled}
          onClick={() => handleTypeChange('gift_other')}
          className={`checkout-gift-choice${isGift ? ' checkout-gift-choice--active' : ''}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 14px',
            borderRadius: '10px',
            border: isGift ? '2px solid #db2777' : '1px solid var(--border-color, #e5e7eb)',
            background: isGift ? 'rgba(219, 39, 119, 0.05)' : 'var(--bg-surface, #fff)',
            cursor: disabled ? 'not-allowed' : 'pointer',
            textAlign: 'left',
            transition: 'all 0.15s ease',
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: isGift ? '#db2777' : 'rgba(0,0,0,0.06)',
              color: isGift ? '#fff' : 'inherit',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Gift size={16} />
          </div>
          <div>
            <p className="body-sm font-semibold" style={{ margin: 0 }}>Send as a Gift 🎁</p>
            <p className="body-xs text-muted" style={{ margin: 0 }}>Add card & message</p>
          </div>
        </button>
      </div>

      {/* Expanded Gift Form */}
      {isGift && (
        <div
          className="checkout-gift-form"
          style={{
            marginTop: '12px',
            padding: '16px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(253, 242, 248, 0.7) 0%, rgba(254, 243, 199, 0.3) 100%)',
            border: '1px solid #fbcfe8',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#be185d',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <Gift size={13} /> Gift Details (All optional)
            </span>
            <span
              style={{
                fontSize: '0.72rem',
                color: '#15803d',
                background: '#dcfce7',
                padding: '2px 8px',
                borderRadius: '10px',
                fontWeight: 500,
              }}
            >
              Free gift message card included
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '12px',
              marginBottom: '12px',
            }}
          >
            {/* Recipient Name */}
            <div>
              <label htmlFor={recipientId} className="body-xs font-semibold" style={{ display: 'block', marginBottom: '4px' }}>
                Recipient Name (Receiver)
              </label>
              <input
                id={recipientId}
                type="text"
                disabled={disabled}
                maxLength={maxLengths.recipientName}
                value={details.recipientName || ''}
                onChange={(e) => handleDetailChange('recipientName', e.target.value)}
                placeholder="e.g., Riya"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #f9a8d4',
                  background: '#fff',
                  fontSize: '0.875rem',
                  outline: 'none',
                }}
              />
            </div>

            {/* Sender Name */}
            <div>
              <label htmlFor={senderId} className="body-xs font-semibold" style={{ display: 'block', marginBottom: '4px' }}>
                From / Sender Name (on receipt)
              </label>
              <input
                id={senderId}
                type="text"
                disabled={disabled}
                maxLength={maxLengths.senderName}
                value={details.senderName || ''}
                onChange={(e) => handleDetailChange('senderName', e.target.value)}
                placeholder="e.g., Aman"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #f9a8d4',
                  background: '#fff',
                  fontSize: '0.875rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Occasion dropdown & free text */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label htmlFor={occasionId} className="body-xs font-semibold">
                Occasion (Preset or Free Text)
              </label>
              <span className="body-xs text-muted" style={{ fontSize: '0.72rem' }}>
                {(details.occasion || '').length}/{maxLengths.occasion || 80}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
              <select
                id={occasionId}
                disabled={disabled}
                value={
                  occasionsList.some((occ) => occ.id.toLowerCase() === (details.occasion || '').toLowerCase())
                    ? (details.occasion || '').toLowerCase()
                    : details.occasion
                    ? 'custom'
                    : ''
                }
                onChange={(e) => {
                  const val = e.target.value
                  if (val !== 'custom') {
                    handleDetailChange('occasion', val)
                  }
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #f9a8d4',
                  background: '#fff',
                  fontSize: '0.875rem',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="">Select preset occasion</option>
                {occasionsList.map((occ) => (
                  <option key={occ.id} value={occ.id}>
                    {occ.label}
                  </option>
                ))}
                <option value="custom">Custom Occasion…</option>
              </select>

              <input
                type="text"
                disabled={disabled}
                maxLength={maxLengths.occasion || 80}
                value={details.occasion || ''}
                onChange={(e) => handleDetailChange('occasion', e.target.value)}
                placeholder="Or type custom (e.g., Diwali)"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #f9a8d4',
                  background: '#fff',
                  fontSize: '0.875rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Message */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label htmlFor={messageId} className="body-xs font-semibold">
                Gift Message
              </label>
              <span className="body-xs text-muted" style={{ fontSize: '0.72rem' }}>
                {messageLength}/{maxLengths.message}
              </span>
            </div>
            <textarea
              id={messageId}
              rows={3}
              disabled={disabled}
              maxLength={maxLengths.message}
              value={details.message || ''}
              onChange={(e) => handleDetailChange('message', e.target.value)}
              placeholder="Write a sweet message to be printed with your gift… e.g. Happy birthday! Wishing you lots of love!"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #f9a8d4',
                background: '#fff',
                fontSize: '0.875rem',
                outline: 'none',
                resize: 'vertical',
                minHeight: '70px',
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
