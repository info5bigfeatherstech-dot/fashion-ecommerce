import { useMemo, useState } from 'react'
import {
  Check,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  ShieldCheck,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  initiateAdminSelfPasswordReset,
  verifyAdminSelfPasswordReset,
} from '@/features/admin/api/marketing'
import { useAdminStore } from '@/features/admin/store'
import AdminSectionPage from './AdminSectionPage'

function SecuritySection({ email }) {
  const [otpSent, setOtpSent] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)
  const [maskedEmail, setMaskedEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPw, setShowNewPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)
  const [localError, setLocalError] = useState('')
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifying, setVerifying] = useState(false)

  const handleSendOtp = async () => {
    setLocalError('')
    setSendingOtp(true)
    try {
      const result = await initiateAdminSelfPasswordReset()
      setOtpSent(true)
      setMaskedEmail(result?.maskedEmail || '')
      toast.success(result?.message || 'OTP sent to your email')
    } catch (err) {
      const message = err?.message || 'Failed to send OTP'
      setLocalError(message)
      toast.error(message)
    } finally {
      setSendingOtp(false)
    }
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    setLocalError('')
    if (newPassword.length < 6) {
      setLocalError('Password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setLocalError('New password and confirmation do not match.')
      return
    }
    if (!/^\d{6}$/.test(otp)) {
      setLocalError('Enter the 6-digit OTP from your email.')
      return
    }

    setVerifying(true)
    try {
      const result = await verifyAdminSelfPasswordReset({ otp, newPassword, confirmPassword })
      setResetSuccess(true)
      setOtpSent(false)
      toast.success(result?.message || 'Password updated successfully')
    } catch (err) {
      const message = err?.message || 'Failed to reset password'
      setLocalError(message)
      toast.error(message)
    } finally {
      setVerifying(false)
    }
  }

  const resetFlow = () => {
    setOtpSent(false)
    setOtp('')
    setNewPassword('')
    setConfirmPassword('')
    setLocalError('')
  }

  return (
    <section className="admin-settings-block">
      <h2 className="admin-settings-block__heading">Security</h2>
      <div className="admin-settings-block__card">
        <div className="admin-settings-security__intro">
          <span className="admin-settings-security__icon" aria-hidden>
            <KeyRound size={18} />
          </span>
          <div>
            <h3 className="admin-settings-security__title">Reset admin password</h3>
            <p className="admin-settings-security__copy">
              We will email a one-time code to your admin account email
              {maskedEmail ? ` (${maskedEmail})` : email ? ` (${email})` : ''}. Use the{' '}
              <strong>latest</strong> OTP only (each new request replaces the previous one). Choose a
              password different from your current one. Delivery must reach a real inbox — invalid
              addresses bounce and you will not receive the OTP.
            </p>
          </div>
        </div>

        {localError ? (
          <div className="admin-settings-security__alert admin-settings-security__alert--error">
            {localError}
          </div>
        ) : null}

        {resetSuccess ? (
          <div className="admin-settings-security__success">
            <ShieldCheck size={32} aria-hidden />
            <p>Password updated successfully</p>
          </div>
        ) : !otpSent ? (
          <button
            type="button"
            className="admin-settings-security__otp-btn"
            onClick={handleSendOtp}
            disabled={sendingOtp}
          >
            {sendingOtp ? <Loader2 size={16} className="admin-settings-profile__spin" /> : <KeyRound size={16} />}
            {sendingOtp ? 'Sending OTP…' : 'Send OTP to my email'}
          </button>
        ) : (
          <form className="admin-settings-security__form" onSubmit={handleVerify}>
            <p className="admin-settings-security__hint">
              Check your email for the 6-digit OTP. It expires in 10 minutes.
            </p>

            <label className="admin-settings-security__field">
              <span>OTP Code</span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="6-digit OTP"
                maxLength={6}
                required
                className="admin-settings-security__otp-input"
              />
            </label>

            <label className="admin-settings-security__field">
              <span>New Password</span>
              <div className="admin-settings-security__password-wrap">
                <Lock size={16} aria-hidden />
                <input
                  type={showNewPw ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  minLength={6}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="admin-settings-security__pw-toggle"
                  onClick={() => setShowNewPw((v) => !v)}
                  aria-label={showNewPw ? 'Hide password' : 'Show password'}
                >
                  {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            <label className="admin-settings-security__field">
              <span>Confirm Password</span>
              <div className="admin-settings-security__password-wrap">
                <Lock size={16} aria-hidden />
                <input
                  type={showConfirmPw ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  minLength={6}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="admin-settings-security__pw-toggle"
                  onClick={() => setShowConfirmPw((v) => !v)}
                  aria-label={showConfirmPw ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            <div className="admin-settings-security__actions">
              <button type="submit" className="admin-settings-security__submit" disabled={verifying}>
                {verifying ? <Loader2 size={16} className="admin-settings-profile__spin" /> : null}
                {verifying ? 'Updating…' : 'Set new password'}
              </button>
              <button
                type="button"
                className="admin-settings-security__secondary"
                onClick={handleSendOtp}
                disabled={sendingOtp}
              >
                {sendingOtp ? 'Resending…' : 'Resend OTP'}
              </button>
              <button type="button" className="admin-settings-security__cancel" onClick={resetFlow}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  )
}

function BillingSection() {
  return (
    <section className="admin-settings-block">
      <h2 className="admin-settings-block__heading">Billing &amp; verification</h2>
      <div className="admin-settings-block__card admin-settings-block__card--rows">
        <div className="admin-settings-profile__row">
          <div className="admin-settings-profile__row-left">
            <div className="admin-settings-profile__label">KYC</div>
            <div className="admin-settings-billing__kyc">
              <span className="admin-settings-profile__value">GSTIN: *********</span>
              <CheckCircle2 size={16} className="admin-settings-billing__check" aria-hidden />
            </div>
          </div>
          <span className="admin-settings-billing__badge">KYC VERIFIED</span>
        </div>

        <div className="admin-settings-profile__row">
          <div className="admin-settings-profile__row-left">
            <div className="admin-settings-profile__label">BANK ACCOUNT</div>
            <div className="admin-settings-profile__value">Store</div>
            <div className="admin-settings-billing__masked">XXXXXXXXX399</div>
          </div>
          <button type="button" className="admin-settings-profile__edit">
            Edit
          </button>
        </div>

        <button
          type="button"
          className="admin-settings-billing__invoices admin-settings-profile__row admin-settings-profile__row--last"
          onClick={() =>
            toast.message('My invoices', { description: 'Subscription invoices will open here.' })
          }
        >
          <div className="admin-settings-profile__row-left">
            <div className="admin-settings-billing__invoices-title">My invoices</div>
            <div className="admin-settings-billing__invoices-sub">
              Manage invoices for your subscriptions
            </div>
          </div>
          <ChevronRight size={20} className="admin-settings-billing__chevron" aria-hidden />
        </button>
      </div>
    </section>
  )
}

const META = {
  profile: {
    title: 'Profile settings',
    description: '',
  },
  controls: {
    title: 'Controls',
    description: 'Store feature toggles and operational controls.',
  },
  'product-display': {
    title: 'Product display',
    description: 'Control how products appear on the storefront.',
  },
  label: {
    title: 'Label settings',
    description: 'Shipping label and Shipmozo/Shiprocket label preferences.',
  },
  orders: {
    title: 'Order settings',
    description: 'Order workflow defaults and fulfillment preferences.',
  },
  customer: {
    title: 'Customer settings',
    description: 'Customer account and checkout-related store settings.',
  },
  policies: {
    title: 'Store policies',
    description: 'Return, shipping, and privacy policy content.',
  },
  help: {
    title: 'Help center',
    description: 'Help center articles and support content.',
  },
  ideas: {
    title: 'Suggest ideas',
    description: 'Collect and review product/store improvement ideas.',
  },
  other: {
    title: 'Other',
    description: 'Additional store settings from fabFE.',
  },
}

export default function AdminSettingsSectionPage({ section = 'profile' }) {
  const meta = META[section] || META.profile

  const user = useAdminStore((s) => s.user)
  const [imgFailed, setImgFailed] = useState(false)

  const signedInAs = useMemo(() => {
    return user?.email || 'admin@gmail.com'
  }, [user?.email])

  const initials = useMemo(() => {
    const base = (user?.name || signedInAs || 'A').trim()
    if (base.includes(' ')) {
      return base
        .split(/\s+/)
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    }
    const left = base.split('@')[0] || base
    return left.slice(0, 2).toUpperCase()
  }, [signedInAs, user?.name])

  const isAdmin = String(user?.role || '').toLowerCase() === 'admin'

  if (section !== 'profile') {
    return (
      <AdminSectionPage eyebrow="Settings" title={meta.title} description={meta.description} />
    )
  }

  // NOTE: Image source is outside the Vite project root; we use a file:// URL so it can load locally.
  // If you later want this to work in production builds, we should copy it into `public/` or `src/assets/`.
  const profileImgSrc =
    'file:///C:/Users/info5/.cursor/projects/d-ecomm/assets/c__Users_info5_AppData_Roaming_Cursor_User_workspaceStorage_1531f6cd291bf67c46512f7433ca7e6c_images_image-0e9bbb0c-6c17-40ee-8bcb-342e1159a829.png'

  return (
    <AdminSectionPage eyebrow="Settings" title={meta.title} description={meta.description}>
      <div className="admin-settings-stack">
      <div className="admin-settings-profile">
        <div className="admin-settings-profile__top">
          <div className="admin-settings-profile__avatar-wrap">
            {!imgFailed ? (
              <img
                className="admin-settings-profile__avatar"
                src={profileImgSrc}
                alt="Profile"
                onError={() => setImgFailed(true)}
              />
            ) : (
              <span className="admin-settings-profile__avatar-fallback" aria-hidden>
                {initials}
              </span>
            )}
          </div>
          <div className="admin-settings-profile__pill">Profile</div>
        </div>

        <div className="admin-settings-profile__rows">
          {/* STORE */}
          <div className="admin-settings-profile__row">
            <div className="admin-settings-profile__row-left">
              <div className="admin-settings-profile__label">STORE</div>
              <div className="admin-settings-profile__value">9370686008</div>
              <div className="admin-settings-profile__sub">Store ID - 5566117</div>
              <div className="admin-settings-profile__sub">Signed in as {signedInAs}</div>
            </div>
            <button type="button" className="admin-settings-profile__edit">
              Edit
            </button>
          </div>

          {/* DISPLAY NUMBER */}
          <div className="admin-settings-profile__row">
            <div className="admin-settings-profile__row-left">
              <div className="admin-settings-profile__label">DISPLAY NUMBER</div>
              <div className="admin-settings-profile__value">9320017017</div>
            </div>
            <button type="button" className="admin-settings-profile__edit">
              Edit
            </button>
          </div>

          {/* EMAIL */}
          <div className="admin-settings-profile__row">
            <div className="admin-settings-profile__row-left">
              <div className="admin-settings-profile__label">EMAIL</div>
              <div className="admin-settings-profile__email-row">
                <div className="admin-settings-profile__value admin-settings-profile__email">
                  {signedInAs}
                </div>
                <span className="admin-settings-profile__verified">
                  <Check size={14} aria-hidden />
                  VERIFIED
                </span>
              </div>
            </div>
            <button type="button" className="admin-settings-profile__edit">
              Edit
            </button>
          </div>

          {/* STORE DESCRIPTION */}
          <div className="admin-settings-profile__row">
            <div className="admin-settings-profile__row-left">
              <div className="admin-settings-profile__label">STORE DESCRIPTION</div>
              <div className="admin-settings-profile__value admin-settings-profile__multiline">
                Welcome to the store. We invite you to avail all the best offers displayed by us with the safest Payment Gateways.
                We started in the year 2015...
              </div>
            </div>
            <button type="button" className="admin-settings-profile__edit">
              Edit
            </button>
          </div>

          {/* STORE ADDRESS */}
          <div className="admin-settings-profile__row">
            <div className="admin-settings-profile__row-left">
              <div className="admin-settings-profile__label">STORE ADDRESS</div>
              <div className="admin-settings-profile__value">Delhi - 110008</div>
            </div>
            <button type="button" className="admin-settings-profile__edit">
              Edit
            </button>
          </div>

          {/* BUSINESS TYPE */}
          <div className="admin-settings-profile__row admin-settings-profile__row--last">
            <div className="admin-settings-profile__row-left">
              <div className="admin-settings-profile__label">BUSINESS TYPE</div>
              <div className="admin-settings-profile__value">
                Mobile &amp; Electronics, Clothing &amp; Fashion, Others
              </div>
            </div>
            <button type="button" className="admin-settings-profile__edit">
              Edit
            </button>
          </div>
        </div>
      </div>

      {isAdmin ? <SecuritySection email={signedInAs} /> : null}
      <BillingSection />
      </div>
    </AdminSectionPage>
  )
}
