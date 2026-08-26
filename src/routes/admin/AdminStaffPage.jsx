import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Briefcase,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Download,
  Edit2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Phone,
  Plus,
  Search,
  Shield,
  ShieldCheck,
  Trash2,
  User,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { ADMIN_ROLES } from '@/api/endpoints'
import { extractListPayload } from '@/features/admin/components/AdminUi'
import {
  useAdminStaff,
  useAdminStaffProfile,
  useCreateAdminStaff,
  useDeleteAdminStaff,
  useInitiateAdminStaffPasswordReset,
  useUpdateAdminStaff,
  useVerifyAdminStaffPasswordReset,
} from '@/features/admin/hooks'
import { ADMIN_ROLE_LABELS } from '@/features/admin/store'

const STAFF_ROLES = ADMIN_ROLES.filter((role) => role !== 'admin')

const STATUS_META = {
  active: {
    label: 'Active',
    className: 'admin-staff__status-pill admin-staff__status-pill--active',
    dot: 'admin-staff__status-dot admin-staff__status-dot--active',
  },
  inactive: {
    label: 'Inactive',
    className: 'admin-staff__status-pill admin-staff__status-pill--inactive',
    dot: 'admin-staff__status-dot admin-staff__status-dot--inactive',
  },
}

function getInitials(name) {
  return (name || '?')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function formatJoinedDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function StaffProfileCard({ profile, isLoading }) {
  if (isLoading) {
    return (
      <div className="admin-staff__profile admin-staff__profile--loading" aria-hidden>
        <div className="admin-staff__profile-left">
          <div className="admin-staff__profile-avatar admin-staff__skeleton" />
          <div className="admin-staff__profile-meta">
            <div className="admin-staff__skeleton admin-staff__skeleton--line admin-staff__skeleton--wide" />
            <div className="admin-staff__skeleton admin-staff__skeleton--line" />
          </div>
        </div>
      </div>
    )
  }

  if (!profile) return null

  const statusKey = String(profile.status || 'active').toLowerCase()
  const statusMeta = STATUS_META[statusKey] || STATUS_META.inactive

  return (
    <div className="admin-staff__profile">
      <div className="admin-staff__profile-left">
        <div className="admin-staff__profile-avatar">{getInitials(profile.name || profile.email)}</div>
        <div className="admin-staff__profile-meta">
          <div className="admin-staff__profile-name-row">
            <h2 className="admin-staff__profile-name">{profile.name || profile.email}</h2>
            <span className="admin-staff__role-badge">
              <Shield size={10} aria-hidden />
              {ADMIN_ROLE_LABELS[profile.role] || profile.role}
            </span>
          </div>
          <p className="admin-staff__profile-since">
            <Clock size={11} aria-hidden />
            Admin since {formatJoinedDate(profile.createdAt)}
          </p>
        </div>
      </div>

      <div className="admin-staff__profile-right">
        <div className="admin-staff__profile-contact">
          <Mail size={14} aria-hidden />
          <span>{profile.email || '—'}</span>
        </div>
        {profile.phone ? (
          <div className="admin-staff__profile-contact">
            <Phone size={14} aria-hidden />
            <span>{profile.phone}</span>
          </div>
        ) : null}
        <div className="admin-staff__profile-contact">
          <User size={14} aria-hidden />
          <span className={statusMeta.className}>
            <span className={statusMeta.dot} aria-hidden />
            {statusMeta.label}
          </span>
        </div>
      </div>
    </div>
  )
}

function StaffModal({ title, subtitle, onClose, children }) {
  return (
    <div className="admin-staff__modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="admin-staff__modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="staff-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin-staff__modal-head">
          <div>
            <h3 id="staff-modal-title">{title}</h3>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <button type="button" className="admin-staff__modal-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function CreateStaffModal({ onClose, onSuccess }) {
  const createStaff = useCreateAdminStaff()
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: '' })

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = {
      email: form.email.trim(),
      password: form.password,
      role: form.role,
    }
    const name = form.name.trim()
    const phone = form.phone.trim()
    if (name) payload.name = name
    if (phone) payload.phone = phone

    try {
      await createStaff.mutateAsync(payload)
      toast.success('Staff member created')
      onSuccess()
      onClose()
    } catch (err) {
      toast.error(err?.message || 'Could not create staff member')
    }
  }

  return (
    <StaffModal title="Add New Staff" subtitle="Create a new staff account" onClose={onClose}>
      <form className="admin-staff__form" onSubmit={handleSubmit}>
        <label className="admin-staff__field">
          <span className="admin-staff__label">
            Full Name <span className="admin-staff__optional">(optional)</span>
          </span>
          <div className="admin-staff__input-wrap">
            <User size={16} aria-hidden />
            <input type="text" value={form.name} onChange={set('name')} placeholder="Priya Sharma" />
          </div>
        </label>

        <label className="admin-staff__field">
          <span className="admin-staff__label">Email Address</span>
          <div className="admin-staff__input-wrap">
            <Mail size={16} aria-hidden />
            <input type="email" value={form.email} onChange={set('email')} placeholder="priya@company.com" required />
          </div>
        </label>

        <label className="admin-staff__field">
          <span className="admin-staff__label">
            Phone Number <span className="admin-staff__optional">(optional)</span>
          </span>
          <div className="admin-staff__input-wrap">
            <Phone size={16} aria-hidden />
            <input
              type="tel"
              value={form.phone}
              onChange={set('phone')}
              placeholder="9876543210"
              pattern="[0-9]{10}"
              title="10-digit phone number (optional)"
            />
          </div>
        </label>

        <label className="admin-staff__field">
          <span className="admin-staff__label">Password</span>
          <div className="admin-staff__input-wrap admin-staff__input-wrap--password">
            <Lock size={16} aria-hidden />
            <input
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={set('password')}
              placeholder="Min. 6 characters"
              minLength={6}
              required
            />
            <button
              type="button"
              className="admin-staff__password-toggle"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </label>

        <label className="admin-staff__field">
          <span className="admin-staff__label">Position / Role</span>
          <div className="admin-staff__input-wrap">
            <Briefcase size={16} aria-hidden />
            <select value={form.role} onChange={set('role')} required>
              <option value="">Select position</option>
              {STAFF_ROLES.map((roleValue) => (
                <option key={roleValue} value={roleValue}>
                  {ADMIN_ROLE_LABELS[roleValue]}
                </option>
              ))}
            </select>
          </div>
        </label>

        <div className="admin-staff__modal-actions">
          <button type="button" className="admin-staff__btn admin-staff__btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="admin-staff__btn admin-staff__btn--primary" disabled={createStaff.isPending}>
            {createStaff.isPending ? <Loader2 size={16} className="admin-staff__spin" /> : null}
            {createStaff.isPending ? 'Creating…' : 'Create Staff'}
          </button>
        </div>
      </form>
    </StaffModal>
  )
}

function EditStaffModal({ staff, onClose, onSuccess }) {
  const updateStaff = useUpdateAdminStaff()
  const initiateReset = useInitiateAdminStaffPasswordReset()
  const verifyReset = useVerifyAdminStaffPasswordReset()

  const [form, setForm] = useState({
    name: staff.name || '',
    email: staff.email || '',
    phone: staff.phone || '',
    role: staff.role || '',
    status: staff.status || 'active',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)

  const [pwOpen, setPwOpen] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)
  const [maskedEmail, setMaskedEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showNewPw, setShowNewPw] = useState(false)

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))
  const staffId = staff._id || staff.id

  const resetPwFlow = () => {
    setOtpSent(false)
    setResetSuccess(false)
    setMaskedEmail('')
    setOtp('')
    setNewPassword('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      role: form.role,
      status: form.status,
    }
    const password = String(form.password || '').trim()
    if (password) {
      if (password.length < 6) {
        toast.error('Password must be at least 6 characters')
        return
      }
      payload.password = password
    }

    try {
      await updateStaff.mutateAsync({
        id: staffId,
        ...payload,
      })
      toast.success(password ? 'Staff member and password updated' : 'Staff member updated')
      onSuccess()
      onClose()
    } catch (err) {
      toast.error(err?.message || 'Could not update staff member')
    }
  }

  const handleSendOtp = async () => {
    try {
      const result = await initiateReset.mutateAsync(staffId)
      setOtpSent(true)
      setResetSuccess(false)
      setMaskedEmail(result?.maskedEmail || '')
      toast.success(result?.message || 'OTP sent to your email')
    } catch (err) {
      toast.error(err?.message || 'Failed to send OTP')
    }
  }

  const handleVerifyReset = async (e) => {
    e.preventDefault()
    if (!/^\d{6}$/.test(otp)) {
      toast.error('Enter the 6-digit OTP from your email')
      return
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    try {
      const result = await verifyReset.mutateAsync({
        staffId,
        otp,
        newPassword,
      })
      setResetSuccess(true)
      setOtpSent(false)
      toast.success(result?.message || 'Password reset successfully')
      setTimeout(() => {
        setPwOpen(false)
        resetPwFlow()
      }, 1800)
    } catch (err) {
      toast.error(err?.message || 'Failed to reset password')
    }
  }

  return (
    <StaffModal
      title="Edit Staff Member"
      subtitle={`Update details for ${staff.name || staff.email}`}
      onClose={onClose}
    >
      <form className="admin-staff__form" onSubmit={handleSubmit}>
        <label className="admin-staff__field">
          <span className="admin-staff__label">Full Name</span>
          <div className="admin-staff__input-wrap">
            <User size={16} aria-hidden />
            <input type="text" value={form.name} onChange={set('name')} required />
          </div>
        </label>

        <label className="admin-staff__field">
          <span className="admin-staff__label">Email Address</span>
          <div className="admin-staff__input-wrap">
            <Mail size={16} aria-hidden />
            <input type="email" value={form.email} onChange={set('email')} required />
          </div>
        </label>

        <label className="admin-staff__field">
          <span className="admin-staff__label">Phone Number</span>
          <div className="admin-staff__input-wrap">
            <Phone size={16} aria-hidden />
            <input
              type="tel"
              value={form.phone}
              onChange={set('phone')}
              pattern="[0-9]{10}"
              title="10-digit phone number"
            />
          </div>
        </label>

        <label className="admin-staff__field">
          <span className="admin-staff__label">Position / Role</span>
          <div className="admin-staff__input-wrap">
            <Briefcase size={16} aria-hidden />
            <select value={form.role} onChange={set('role')} required>
              {STAFF_ROLES.map((roleValue) => (
                <option key={roleValue} value={roleValue}>
                  {ADMIN_ROLE_LABELS[roleValue]}
                </option>
              ))}
            </select>
          </div>
        </label>

        <label className="admin-staff__field">
          <span className="admin-staff__label">Status</span>
          <select className="admin-staff__select-plain" value={form.status} onChange={set('status')}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>

        {/* <label className="admin-staff__field">
          <span className="admin-staff__label">
            Password <span className="admin-staff__optional">(optional — leave blank to keep current)</span>
          </span>
          <div className="admin-staff__input-wrap admin-staff__input-wrap--password">
            <Lock size={16} aria-hidden />
            <input
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={set('password')}
              placeholder="Set a new password"
              minLength={6}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="admin-staff__password-toggle"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </label> */}

        <div className="admin-staff__modal-actions">
          <button type="button" className="admin-staff__btn admin-staff__btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="admin-staff__btn admin-staff__btn--primary" disabled={updateStaff.isPending}>
            {updateStaff.isPending ? <Loader2 size={16} className="admin-staff__spin" /> : null}
            {updateStaff.isPending ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>

      <div className="admin-staff__pw-reset">
        <button
          type="button"
          className="admin-staff__pw-reset-toggle"
          onClick={() => {
            setPwOpen((v) => !v)
            if (pwOpen) resetPwFlow()
          }}
          aria-expanded={pwOpen}
        >
          <span>
            <KeyRound size={16} aria-hidden />
            Reset Staff Password
          </span>
          {pwOpen ? <ChevronUp size={16} aria-hidden /> : <ChevronDown size={16} aria-hidden />}
        </button>

        {pwOpen ? (
          <div className="admin-staff__pw-reset-body">
            {resetSuccess ? (
              <div className="admin-staff__pw-reset-success">
                <ShieldCheck size={28} aria-hidden />
                <p>Password reset successfully</p>
              </div>
            ) : !otpSent ? (
              <div className="admin-staff__pw-reset-step">
                <p>
                  An OTP will be sent to <strong>your admin email</strong>
                  {maskedEmail ? ` (${maskedEmail})` : ''}. Use it to confirm and set a new password for{' '}
                  <strong>{staff.name || staff.email}</strong>.
                </p>
                <button
                  type="button"
                  className="admin-staff__btn admin-staff__btn--amber"
                  onClick={handleSendOtp}
                  disabled={initiateReset.isPending}
                >
                  {initiateReset.isPending ? <Loader2 size={15} className="admin-staff__spin" /> : <KeyRound size={15} />}
                  {initiateReset.isPending ? 'Sending OTP…' : 'Send OTP to My Email'}
                </button>
              </div>
            ) : (
              <form className="admin-staff__pw-reset-step" onSubmit={handleVerifyReset}>
                <p>
                  Check your admin email for the 6-digit OTP
                  {maskedEmail ? ` sent to ${maskedEmail}` : ''}. It expires in 10 minutes.
                </p>

                <label className="admin-staff__field">
                  <span className="admin-staff__label">OTP Code</span>
                  <input
                    className="admin-staff__otp-input"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="6-digit OTP"
                    maxLength={6}
                    required
                  />
                </label>

                <label className="admin-staff__field">
                  <span className="admin-staff__label">New Password</span>
                  <div className="admin-staff__input-wrap admin-staff__input-wrap--password">
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
                      className="admin-staff__password-toggle"
                      onClick={() => setShowNewPw((v) => !v)}
                      aria-label={showNewPw ? 'Hide password' : 'Show password'}
                    >
                      {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </label>

                <div className="admin-staff__modal-actions">
                  <button
                    type="button"
                    className="admin-staff__btn admin-staff__btn--ghost"
                    onClick={handleSendOtp}
                    disabled={verifyReset.isPending || initiateReset.isPending}
                  >
                    {initiateReset.isPending ? 'Sending…' : 'Resend OTP'}
                  </button>
                  <button
                    type="submit"
                    className="admin-staff__btn admin-staff__btn--primary"
                    disabled={verifyReset.isPending || otp.length < 6}
                  >
                    {verifyReset.isPending ? <Loader2 size={16} className="admin-staff__spin" /> : null}
                    {verifyReset.isPending ? 'Verifying…' : 'Confirm Reset'}
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : null}
      </div>
    </StaffModal>
  )
}

export default function AdminStaffPage() {
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editStaff, setEditStaff] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const { data: profile, isLoading: profileLoading } = useAdminStaffProfile()
  const { data, isLoading, isError, error, refetch } = useAdminStaff({ page, search, role: roleFilter })
  const deleteStaff = useDeleteAdminStaff()

  const staffPayload = data?.staff ? data : { staff: data }
  const { items: staff, pagination } = useMemo(
    () => extractListPayload(staffPayload, ['staff']),
    [data]
  )

  const totalCount = pagination?.total ?? staff.length
  const totalPages = pagination?.totalPages || 1

  const downloadCSV = useCallback(() => {
    const header = 'Name,Email,Phone,Role,Status,Joined\n'
    const rows = staff
      .map((member) =>
        [
          member.name,
          member.email,
          member.phone || '',
          member.role,
          member.status,
          formatJoinedDate(member.createdAt),
        ].join(',')
      )
      .join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'staff_report.csv'
    anchor.click()
    URL.revokeObjectURL(url)
  }, [staff])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this staff member? This cannot be undone.')) return
    setDeletingId(id)
    try {
      await deleteStaff.mutateAsync(id)
      toast.success('Staff member removed')
      refetch()
    } catch (err) {
      toast.error(err?.message || 'Delete failed')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="admin-page admin-staff">
      <h1 className="admin-staff__title">Staff</h1>

      <StaffProfileCard profile={profile} isLoading={profileLoading} />

      <section className="admin-staff__directory">
        <div className="admin-staff__directory-head">
          <div>
            <h2 className="admin-staff__directory-title">Staff Directory</h2>
            <p className="admin-staff__directory-sub">Manage internal team members and access levels.</p>
          </div>
          <div className="admin-staff__directory-actions">
            <button type="button" className="admin-staff__btn admin-staff__btn--outline" onClick={downloadCSV}>
              <Download size={16} />
              Download CSV
            </button>
            <button
              type="button"
              className="admin-staff__btn admin-staff__btn--primary"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus size={18} />
              Add Staff
            </button>
          </div>
        </div>

        <div className="admin-staff__filters">
          <div className="admin-staff__search-wrap">
            <Search size={15} aria-hidden />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name, email or phone..."
              aria-label="Search staff"
            />
          </div>
          <select
            className="admin-staff__role-filter"
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value)
              setPage(1)
            }}
            aria-label="Filter by role"
          >
            <option value="">All Roles</option>
            {STAFF_ROLES.map((roleValue) => (
              <option key={roleValue} value={roleValue}>
                {ADMIN_ROLE_LABELS[roleValue]}
              </option>
            ))}
          </select>
        </div>

        <div className="admin-staff__table-card">
          {isError ? (
            <div className="admin-staff__table-empty">
              <p>{error?.message || 'Could not load staff members.'}</p>
              <button type="button" className="admin-staff__btn admin-staff__btn--outline" onClick={() => refetch()}>
                Retry
              </button>
            </div>
          ) : (
            <div className="admin-staff__table-scroll">
              <table className="admin-staff__table">
                <thead>
                  <tr>
                    {['Member', 'Position', 'Contact & Security', 'Status', 'Manage'].map((col, index) => (
                      <th key={col} className={index === 4 ? 'admin-staff__th--right' : undefined}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {isLoading
                    ? Array.from({ length: 4 }).map((_, rowIndex) => (
                        <tr key={rowIndex} className="admin-staff__row-loading">
                          {Array.from({ length: 5 }).map((__, cellIndex) => (
                            <td key={cellIndex}>
                              <div className="admin-staff__skeleton admin-staff__skeleton--cell" />
                            </td>
                          ))}
                        </tr>
                      ))
                    : null}

                  {!isLoading && staff.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="admin-staff__empty-cell">
                        No staff members found.
                      </td>
                    </tr>
                  ) : null}

                  {!isLoading
                    ? staff.map((member) => {
                        const id = member._id || member.id
                        const statusKey = String(member.status || 'inactive').toLowerCase()
                        const statusMeta = STATUS_META[statusKey] || STATUS_META.inactive

                        return (
                          <tr key={id} className="admin-staff__row">
                            <td>
                              <div className="admin-staff__member">
                                <span className="admin-staff__member-avatar">{getInitials(member.name)}</span>
                                <span>
                                  <span className="admin-staff__member-name">{member.name || '—'}</span>
                                  <span className="admin-staff__member-joined">
                                    <Calendar size={10} aria-hidden />
                                    Joined {formatJoinedDate(member.createdAt)}
                                  </span>
                                </span>
                              </div>
                            </td>
                            <td>
                              <span className="admin-staff__position">
                                <Briefcase size={14} aria-hidden />
                                {ADMIN_ROLE_LABELS[member.role] || member.role || '—'}
                              </span>
                            </td>
                            <td>
                              <div className="admin-staff__contact">
                                <span>
                                  <Mail size={13} aria-hidden />
                                  {member.email || '—'}
                                </span>
                                {member.phone ? (
                                  <span>
                                    <Phone size={13} aria-hidden />
                                    {member.phone}
                                  </span>
                                ) : null}
                              </div>
                            </td>
                            <td>
                              <span className={statusMeta.className}>
                                <span className={statusMeta.dot} aria-hidden />
                                {statusMeta.label}
                              </span>
                            </td>
                            <td>
                              <div className="admin-staff__row-actions">
                                <button
                                  type="button"
                                  className="admin-staff__icon-btn"
                                  onClick={() => setEditStaff(member)}
                                  aria-label={`Edit ${member.name}`}
                                >
                                  <Edit2 size={15} />
                                </button>
                                <button
                                  type="button"
                                  className="admin-staff__icon-btn admin-staff__icon-btn--danger"
                                  onClick={() => handleDelete(id)}
                                  disabled={deletingId === id}
                                  aria-label={`Delete ${member.name}`}
                                >
                                  {deletingId === id ? (
                                    <Loader2 size={15} className="admin-staff__spin" />
                                  ) : (
                                    <Trash2 size={15} />
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    : null}
                </tbody>
              </table>
            </div>
          )}

          <div className="admin-staff__table-foot">
            <p>
              Showing <strong>{staff.length}</strong> of <strong>{totalCount}</strong> staff members
            </p>
            {totalPages > 1 ? (
              <div className="admin-staff__pager">
                <button
                  type="button"
                  className="admin-staff__pager-btn"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  aria-label="Previous page"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`admin-staff__pager-num${p === page ? ' is-active' : ''}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  className="admin-staff__pager-btn"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= totalPages}
                  aria-label="Next page"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {showCreateModal ? (
        <CreateStaffModal onClose={() => setShowCreateModal(false)} onSuccess={() => refetch()} />
      ) : null}
      {editStaff ? (
        <EditStaffModal
          staff={editStaff}
          onClose={() => setEditStaff(null)}
          onSuccess={() => refetch()}
        />
      ) : null}
    </div>
  )
}
