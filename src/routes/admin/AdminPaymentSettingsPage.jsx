import { AdminPaymentSettingsPanel } from '@/features/admin/components/AdminPaymentSettingsPanel'

export default function AdminPaymentSettingsPage() {
  return (
    <div className="admin-page">
      <header className="admin-page__head">
        <div>
          <p className="heading-sm text-accent">Settings</p>
          <h1 className="display-md">Payment policy</h1>
          <p className="body-sm text-muted">Configure COD and partial payment for checkout.</p>
        </div>
      </header>
      <AdminPaymentSettingsPanel />
    </div>
  )
}
