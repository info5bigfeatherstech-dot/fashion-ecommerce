import { useId, useState, useRef, useEffect } from 'react'
import { Gift, User, Sparkles, ChevronDown, Check } from 'lucide-react'
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
    ...(optionsData?.maxLengths || {}),
    message: 1000,
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

  const isPresetOccasion = occasionsList.some(
    (occ) => (occ.id || '').toLowerCase() === (details.occasion || '').toLowerCase()
  )

  const [isCustomSelected, setIsCustomSelected] = useState(
    () => !isPresetOccasion && Boolean(details.occasion)
  )
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const isCustom = isCustomSelected || (!isPresetOccasion && Boolean(details.occasion))

  const currentPresetMatch = occasionsList.find(
    (occ) => (occ.id || '').toLowerCase() === (details.occasion || '').toLowerCase()
  )

  const selectedDisplayLabel = isCustom
    ? details.occasion
      ? `${details.occasion} (Custom)`
      : 'Custom Occasion…'
    : currentPresetMatch
    ? currentPresetMatch.label
    : null

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
    <div className="checkout-gift-section">
      <div className="checkout-gift-section__header">
        <p className="checkout-gift-section__title">
          <Sparkles size={15} style={{ color: '#db2777' }} />
          Who is this order for?
        </p>
        <p className="checkout-gift-section__subtitle">
          Choose whether this package is for you or being sent directly as a special surprise gift.
        </p>
      </div>

      {/* Radio options */}
      <div
        role="radiogroup"
        aria-label="Order intent type"
        className="checkout-gift-radiogroup"
      >
        <button
          type="button"
          role="radio"
          aria-checked={!isGift}
          disabled={disabled}
          onClick={() => handleTypeChange('my_order')}
          className={`checkout-gift-choice checkout-gift-choice--self${!isGift ? ' checkout-gift-choice--active' : ''}`}
        >
          <div className="checkout-gift-choice__icon">
            <User size={16} />
          </div>
          <div className="checkout-gift-choice__content">
            <p className="checkout-gift-choice__title">For Myself</p>
            <p className="checkout-gift-choice__desc">Standard order</p>
          </div>
        </button>

        <button
          type="button"
          role="radio"
          aria-checked={isGift}
          disabled={disabled}
          onClick={() => handleTypeChange('gift_other')}
          className={`checkout-gift-choice checkout-gift-choice--gift${isGift ? ' checkout-gift-choice--active' : ''}`}
        >
          <div className="checkout-gift-choice__icon">
            <Gift size={16} />
          </div>
          <div className="checkout-gift-choice__content">
            <p className="checkout-gift-choice__title">Send as a Gift 🎁</p>
            <p className="checkout-gift-choice__desc">Add card & message</p>
          </div>
        </button>
      </div>

      {/* Expanded Gift Form */}
      {isGift && (
        <div className="checkout-gift-form">
          <div className="checkout-gift-form__banner">
            <span className="checkout-gift-form__badge-label">
              <Gift size={13} /> Gift Details (All optional)
            </span>
            <span className="checkout-gift-form__badge-pill">
              Free gift message card included
            </span>
          </div>

          <div className="checkout-gift-form__row-2col">
            {/* Recipient Name */}
            <div className="checkout-gift-form__field">
              <div className="checkout-gift-form__label-row">
                <label htmlFor={recipientId} className="checkout-gift-form__label">
                  Recipient Name (Receiver)
                </label>
              </div>
              <input
                id={recipientId}
                type="text"
                disabled={disabled}
                maxLength={maxLengths.recipientName}
                value={details.recipientName || ''}
                onChange={(e) => handleDetailChange('recipientName', e.target.value)}
                placeholder="e.g., Riya"
                className="checkout-gift-form__input"
              />
            </div>

            {/* Sender Name */}
            <div className="checkout-gift-form__field">
              <div className="checkout-gift-form__label-row">
                <label htmlFor={senderId} className="checkout-gift-form__label">
                  From / Sender Name (on receipt)
                </label>
              </div>
              <input
                id={senderId}
                type="text"
                disabled={disabled}
                maxLength={maxLengths.senderName}
                value={details.senderName || ''}
                onChange={(e) => handleDetailChange('senderName', e.target.value)}
                placeholder="e.g., Aman"
                className="checkout-gift-form__input"
              />
            </div>
          </div>

          {/* Occasion dropdown & optional custom text input */}
          <div className="checkout-gift-form__field" style={{ marginBottom: '12px' }}>
            <div className="checkout-gift-form__label-row">
              <label id={`${occasionId}-label`} className="checkout-gift-form__label">
                Occasion (Preset or Custom)
              </label>
              <span className="checkout-gift-form__counter">
                {(details.occasion || '').length}/{maxLengths.occasion || 80}
              </span>
            </div>

            <div className="checkout-gift-select-wrapper" ref={dropdownRef}>
              <button
                type="button"
                id={occasionId}
                disabled={disabled}
                onClick={() => setIsOpen((prev) => !prev)}
                className={`checkout-gift-select-trigger ${isOpen ? 'checkout-gift-select-trigger--open' : ''}`}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-labelledby={`${occasionId}-label`}
              >
                <span className={selectedDisplayLabel ? 'checkout-gift-select-trigger__text' : 'checkout-gift-select-trigger__placeholder'}>
                  {selectedDisplayLabel || 'Select occasion (optional)'}
                </span>
                <ChevronDown
                  size={16}
                  className="checkout-gift-select-trigger__chevron"
                />
              </button>

              {isOpen && (
                <div role="listbox" className="checkout-gift-dropdown-menu">
                  <button
                    type="button"
                    role="option"
                    aria-selected={!isCustom && !details.occasion}
                    onClick={() => {
                      setIsCustomSelected(false)
                      handleDetailChange('occasion', '')
                      setIsOpen(false)
                    }}
                    className={`checkout-gift-dropdown-item ${!isCustom && !details.occasion ? 'checkout-gift-dropdown-item--selected' : ''}`}
                  >
                    <span style={{ color: '#9ca3af' }}>Select occasion (none)</span>
                    {!isCustom && !details.occasion && (
                      <Check size={14} className="checkout-gift-dropdown-item__check" />
                    )}
                  </button>

                  {occasionsList.map((occ) => {
                    const isSelected =
                      !isCustom &&
                      (details.occasion || '').toLowerCase() === (occ.id || '').toLowerCase()
                    return (
                      <button
                        key={occ.id}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => {
                          setIsCustomSelected(false)
                          handleDetailChange('occasion', occ.id)
                          setIsOpen(false)
                        }}
                        className={`checkout-gift-dropdown-item ${isSelected ? 'checkout-gift-dropdown-item--selected' : ''}`}
                      >
                        <span>{occ.label}</span>
                        {isSelected && (
                          <Check size={14} className="checkout-gift-dropdown-item__check" />
                        )}
                      </button>
                    )
                  })}

                  <div className="checkout-gift-dropdown-divider" />

                  <button
                    type="button"
                    role="option"
                    aria-selected={isCustom}
                    onClick={() => {
                      setIsCustomSelected(true)
                      if (isPresetOccasion) {
                        handleDetailChange('occasion', '')
                      }
                      setIsOpen(false)
                    }}
                    className={`checkout-gift-dropdown-item ${isCustom ? 'checkout-gift-dropdown-item--selected' : ''}`}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Sparkles size={14} style={{ color: '#db2777' }} />
                      Custom Occasion…
                    </span>
                    {isCustom && (
                      <Check size={14} className="checkout-gift-dropdown-item__check" />
                    )}
                  </button>
                </div>
              )}
            </div>

            {isCustom && (
              <input
                type="text"
                disabled={disabled}
                maxLength={maxLengths.occasion || 80}
                value={details.occasion || ''}
                onChange={(e) => handleDetailChange('occasion', e.target.value)}
                placeholder="Or type custom (e.g., Diwali)"
                className="checkout-gift-form__input"
                style={{ marginTop: '8px' }}
                autoFocus
              />
            )}
          </div>

          {/* Message */}
          <div className="checkout-gift-form__field">
            <div className="checkout-gift-form__label-row">
              <label htmlFor={messageId} className="checkout-gift-form__label">
                Gift Message
              </label>
              <span className="checkout-gift-form__counter">
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
              className="checkout-gift-form__textarea"
            />
          </div>
        </div>
      )}
    </div>
  )
}
