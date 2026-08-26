import { useMemo, useState } from 'react'
import {
  Check,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  FileText,
  Info,
  KeyRound,
  Loader2,
  Lock,
  Settings2,
  ShieldCheck,
  Star,
  Store,
  Truck,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  initiateAdminSelfPasswordReset,
  verifyAdminSelfPasswordReset,
} from '@/features/admin/api/marketing'
import LabelSettingsSection from '@/features/admin/components/LabelSettingsSection'
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

function ControlsToggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`admin-settings-controls__toggle${checked ? ' is-on' : ''}`}
      onClick={onChange}
    >
      <span className="admin-settings-controls__toggle-thumb" aria-hidden />
    </button>
  )
}

function ControlsStatusRow({ title, desc, active, onToggle }) {
  return (
    <div className="admin-settings-controls__status-row">
      <div>
        <div className="admin-settings-controls__status-head">
          <p className="admin-settings-controls__status-title">{title}</p>
          {active ? (
            <span className="admin-settings-controls__pill admin-settings-controls__pill--active">
              <CheckCircle2 size={10} aria-hidden />
              Active
            </span>
          ) : (
            <span className="admin-settings-controls__pill admin-settings-controls__pill--paused">
              <XCircle size={10} aria-hidden />
              Paused
            </span>
          )}
        </div>
        <p className="admin-settings-controls__status-desc">{desc}</p>
      </div>
      <ControlsToggle checked={active} onChange={onToggle} label={`Toggle ${title}`} />
    </div>
  )
}

function ControlsFeatureCard({ icon: Icon, title, desc, tone, onClick }) {
  return (
    <button type="button" className="admin-settings-controls__feature" onClick={onClick}>
      <span className={`admin-settings-controls__feature-icon admin-settings-controls__feature-icon--${tone}`}>
        <Icon size={22} strokeWidth={2} aria-hidden />
      </span>
      <h4 className="admin-settings-controls__feature-title">{title}</h4>
      <p className="admin-settings-controls__feature-desc">{desc}</p>
    </button>
  )
}

function ControlsSection() {
  const [controls, setControls] = useState({
    store: true,
    delivery: true,
    pickup: false,
  })

  const toggle = (key) => {
    setControls((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="admin-settings-controls__stack">
      <section className="admin-settings-controls__card">
        <div className="admin-settings-controls__card-head">
          <Settings2 size={16} aria-hidden />
          <h2>Operational Status</h2>
        </div>
        <div className="admin-settings-controls__status-list">
          <ControlsStatusRow
            title="Global Store Access"
            desc="Allow customers to browse your products"
            active={controls.store}
            onToggle={() => toggle('store')}
          />
          <ControlsStatusRow
            title="Delivery Services"
            desc="Enable/Disable shipping and home delivery"
            active={controls.delivery}
            onToggle={() => toggle('delivery')}
          />
          <ControlsStatusRow
            title="Self Pick-up"
            desc="Allow customers to collect from store"
            active={controls.pickup}
            onToggle={() => toggle('pickup')}
          />
        </div>
      </section>

      <section className="admin-settings-controls__card admin-settings-controls__framework">
        <div className="admin-settings-controls__framework-left">
          <span className="admin-settings-controls__framework-icon" aria-hidden>
            <Store size={24} strokeWidth={2} />
          </span>
          <div>
            <p className="admin-settings-controls__framework-label">Business Framework</p>
            <p className="admin-settings-controls__framework-value">Business to Customer (B2C)</p>
          </div>
        </div>
        <button
          type="button"
          className="admin-settings-controls__framework-btn"
          onClick={() => toast.message('Business type', { description: 'Framework change coming soon.' })}
        >
          Change Type
        </button>
      </section>

      <section className="admin-settings-controls__features-wrap">
        <div className="admin-settings-controls__features-head">
          <h2 className="admin-settings-controls__features-title">Advanced Features</h2>
          <button
            type="button"
            className="admin-settings-controls__explore"
            onClick={() => toast.message('Advanced features', { description: 'Feature marketplace coming soon.' })}
          >
            Explore All
            <ChevronRight size={18} aria-hidden />
          </button>
        </div>

        <div className="admin-settings-controls__features-grid">
          <ControlsFeatureCard
            icon={Star}
            tone="amber"
            title="Review Engine"
            desc="Build social proof with automated customer ratings."
            onClick={() => toast.message('Review Engine', { description: 'Configure generated reviews in Marketing.' })}
          />
          <ControlsFeatureCard
            icon={FileText}
            tone="blue"
            title="GST Automator"
            desc="Generate compliant invoices instantly per order."
            onClick={() => toast.message('GST Automator', { description: 'GST invoicing tools coming soon.' })}
          />
          <ControlsFeatureCard
            icon={Truck}
            tone="purple"
            title="COD Management"
            desc="Set logic-based fees for Cash on Delivery orders."
            onClick={() => toast.message('COD Management', { description: 'Open Payments settings to manage COD.' })}
          />
        </div>
      </section>
    </div>
  )
}

const ASPECT_RATIOS = [
  {
    id: '1:1',
    label: 'Square (1:1)',
    desc: 'Perfect for a balanced, grid-friendly layout. Ideal for most products.',
    shape: 'square',
  },
  {
    id: '3:4',
    label: 'Portrait (3:4)',
    desc: 'Great for fashion, electronics, or anything vertical.',
    shape: 'portrait-34',
  },
  {
    id: '9:16',
    label: 'Portrait (9:16)',
    desc: 'Great for mobile-first visuals. Suited for beauty, wellness, fitness, and service-based businesses.',
    shape: 'portrait-916',
  },
  {
    id: '4:3',
    label: 'Landscape (4:3)',
    desc: 'Ideal for wide products like trays, shoes or scenery.',
    shape: 'landscape-43',
  },
  {
    id: '16:9',
    label: 'Landscape (16:9)',
    desc: 'Best for wide, desktop-friendly images. Ideal for travel, real estate, and event-based businesses.',
    shape: 'landscape-169',
  },
]

const BASE_COLORS = [
  { id: 'transparent', label: 'Light' },
  { id: 'black', label: 'Black' },
  { id: 'white', label: 'White' },
]

const PREVIEW_IMG =
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=300'

function ProductDisplaySection() {
  const [selectedRatio, setSelectedRatio] = useState('3:4')
  const [selectedColor, setSelectedColor] = useState('white')

  return (
    <div className="admin-settings-product-display">
      <h1 className="admin-settings-product-display__title">Product display preference</h1>

      <div className="admin-settings-product-display__note">
        <span className="admin-settings-product-display__note-icon" aria-hidden>
          <Info size={16} />
        </span>
        <p>
          <strong>Note:</strong> This size will be used as a default for the image cropper for product /
          service images.
        </p>
      </div>

      <div className="admin-settings-product-display__card">
        <div className="admin-settings-product-display__card-head">Select one option</div>
        <div className="admin-settings-product-display__options" role="radiogroup" aria-label="Aspect ratio">
          {ASPECT_RATIOS.map((ratio) => {
            const selected = selectedRatio === ratio.id
            return (
              <label
                key={ratio.id}
                className={`admin-settings-product-display__option${selected ? ' is-selected' : ''}`}
              >
                <div className="admin-settings-product-display__option-left">
                  <span className="admin-settings-product-display__shape-wrap" aria-hidden>
                    <span
                      className={`admin-settings-product-display__shape admin-settings-product-display__shape--${ratio.shape}`}
                    />
                  </span>
                  <span>
                    <span className="admin-settings-product-display__option-label">{ratio.label}</span>
                    <span className="admin-settings-product-display__option-desc">{ratio.desc}</span>
                  </span>
                </div>
                <input
                  type="radio"
                  name="aspect-ratio"
                  value={ratio.id}
                  checked={selected}
                  onChange={() => setSelectedRatio(ratio.id)}
                />
              </label>
            )
          })}
        </div>
      </div>

      <div className="admin-settings-product-display__base">
        <div className="admin-settings-product-display__base-copy">
          <h2>Choose a default base color of product image card</h2>
          <p>This will be used when the cropped image does not match the product image display preference.</p>
        </div>
        <div className="admin-settings-product-display__swatches" role="radiogroup" aria-label="Base color">
          {BASE_COLORS.map((color) => {
            const selected = selectedColor === color.id
            return (
              <button
                key={color.id}
                type="button"
                className={`admin-settings-product-display__swatch${selected ? ' is-selected' : ''}`}
                aria-pressed={selected}
                aria-label={color.label}
                onClick={() => setSelectedColor(color.id)}
              >
                <span
                  className={`admin-settings-product-display__swatch-inner admin-settings-product-display__swatch-inner--${color.id}`}
                >
                  <img src={PREVIEW_IMG} alt="" />
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

const META = {
  profile: {
    title: 'Profile settings',
    description: '',
  },
  controls: {
    title: 'Store Controls',
    description: '',
  },
  'product-display': {
    title: 'Product display preference',
    description: '',
  },
  label: {
    title: 'Label settings',
    description: '',
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

  if (section === 'controls') {
    return (
      <div className="admin-page admin-settings-controls">
        <div className="admin-settings-controls__page-head">
          <h1 className="admin-settings-controls__page-title">{meta.title}</h1>
          <span className="admin-settings-controls__live">Live Dashboard</span>
        </div>
        <ControlsSection />
      </div>
    )
  }

  if (section === 'product-display') {
    return (
      <div className="admin-page">
        <ProductDisplaySection />
      </div>
    )
  }

  if (section === 'label') {
    return (
      <div className="admin-page admin-label-settings-page">
        <LabelSettingsSection />
      </div>
    )
  }

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
