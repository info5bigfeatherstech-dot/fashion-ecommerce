import { useEffect, useMemo, useState } from 'react'
import { Bell, CheckCircle2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '@/store'
import { createOosInquiry } from '@/features/product/api'
import {
  isValidInquiryEmail,
  isValidInquiryPhone,
  validateInquiryContact,
} from '@/features/product/oosInquiryValidation'

/**
 * PDP out-of-stock notify form.
 * Email + mobile both required.
 */
export function OutOfStockInquiryForm({ productId, variantId, disabled = false }) {
  const user = useAppStore((s) => s.user)
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [fieldError, setFieldError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (user?.email) setEmail(String(user.email))
    if (user?.phone) setPhone(String(user.phone).replace(/\D/g, '').slice(-10))
  }, [user?.email, user?.phone])

  useEffect(() => {
    setSubmitted(false)
    setFieldError(null)
  }, [productId, variantId])

  const canSubmit = useMemo(() => {
    return Boolean(productId && variantId) && !disabled && !submitting && !submitted
  }, [productId, variantId, disabled, submitting, submitted])

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!canSubmit) return

    const checked = validateInquiryContact({ email, phone })
    if (!checked.ok) {
      setFieldError({ field: checked.field, message: checked.message })
      return
    }
    setFieldError(null)
    setSubmitting(true)

    try {
      const res = await createOosInquiry({
        productId,
        variantId,
        email: checked.email,
        phone: checked.phone,
      })
      const msg =
        res?.message ||
        'Thanks! We will notify you when this product is back in stock.'
      toast.success(msg)
      setSubmitted(true)
    } catch (err) {
      const details = err?.details
      const message =
        err?.message ||
        (err?.status === 429
          ? 'Too many attempts. Please try again later.'
          : 'Could not submit request. Please try again.')
      setFieldError({
        field: details?.field || 'contact',
        message,
      })
      if (err?.code === 'PRODUCT_IN_STOCK') {
        toast.message(message)
      } else {
        toast.error(message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="oos-inquiry">
        <div className="oos-inquiry__badge">Out of Stock</div>
        <div className="oos-inquiry__success">
          <CheckCircle2 size={20} className="oos-inquiry__success-icon" aria-hidden="true" />
          <div>
            <p className="oos-inquiry__success-title">You&apos;re on the waitlist</p>
            <p className="oos-inquiry__success-text">
              We&apos;ll email you when this item is back — and show it in your website
              notifications if you&apos;re logged in.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="oos-inquiry">
      <div className="oos-inquiry__badge">Out of Stock</div>

      <form className="oos-inquiry__card" onSubmit={onSubmit} noValidate>
        <div className="oos-inquiry__intro">
          <div className="oos-inquiry__icon" aria-hidden="true">
            <Bell size={16} strokeWidth={2.25} />
          </div>
          <div>
            <p className="oos-inquiry__title">Want this when it&apos;s back?</p>
            <p className="oos-inquiry__desc">
              Enter your email and mobile — we&apos;ll email you as soon as it&apos;s available
              again.
            </p>
          </div>
        </div>

        <div className="oos-inquiry__fields">
          <div className="oos-inquiry__field">
            <label htmlFor="oos-inquiry-email" className="oos-inquiry__label">
              Email <span className="oos-inquiry__req">*</span>
            </label>
            <input
              id="oos-inquiry-email"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="you@example.com"
              value={email}
              disabled={submitting || disabled}
              onChange={(e) => {
                setEmail(e.target.value)
                if (fieldError?.field === 'email') setFieldError(null)
              }}
              onBlur={() => {
                const v = email.trim()
                if (!v) {
                  setFieldError({
                    field: 'email',
                    message: 'Email is required so we can notify you when it is back.',
                  })
                  return
                }
                if (!isValidInquiryEmail(v)) {
                  setFieldError({
                    field: 'email',
                    message: 'Enter a valid email (e.g. name@gmail.com).',
                  })
                }
              }}
              className={`oos-inquiry__input${fieldError?.field === 'email' ? ' oos-inquiry__input--error' : ''}`}
            />
          </div>

          <div className="oos-inquiry__field">
            <label htmlFor="oos-inquiry-phone" className="oos-inquiry__label">
              Mobile <span className="oos-inquiry__req">*</span>
            </label>
            <input
              id="oos-inquiry-phone"
              type="tel"
              autoComplete="tel"
              inputMode="numeric"
              placeholder="10-digit mobile number"
              value={phone}
              disabled={submitting || disabled}
              maxLength={10}
              pattern="[6-9][0-9]{9}"
              onChange={(e) => {
                const next = e.target.value.replace(/\D/g, '').slice(0, 10)
                setPhone(next)
                if (fieldError?.field === 'phone') setFieldError(null)
              }}
              onBlur={() => {
                const v = phone.trim()
                if (!v) {
                  setFieldError({ field: 'phone', message: 'Mobile number is required.' })
                  return
                }
                if (!isValidInquiryPhone(v)) {
                  setFieldError({
                    field: 'phone',
                    message: 'Enter a valid 10-digit Indian mobile number.',
                  })
                }
              }}
              className={`oos-inquiry__input${fieldError?.field === 'phone' ? ' oos-inquiry__input--error' : ''}`}
            />
          </div>
        </div>

        {fieldError?.message ? (
          <p className="oos-inquiry__error" role="alert">
            {fieldError.message}
          </p>
        ) : (
          <p className="oos-inquiry__hint">
            Restock alert goes to your email. We also use your details for website
            notifications if you have an account — no spam.
          </p>
        )}

        <button type="submit" className="oos-inquiry__submit" disabled={!canSubmit}>
          {submitting ? (
            <>
              <Loader2 size={16} className="oos-inquiry__spin" aria-hidden="true" />
              Saving…
            </>
          ) : (
            <>
              <Bell size={16} aria-hidden="true" />
              Notify me when available
            </>
          )}
        </button>
      </form>
    </div>
  )
}
