import { AdminPaymentSettingsPanel } from '@/features/admin/components/AdminPaymentSettingsPanel'

export default function AdminPaymentSettingsPage() {
  return (
    <div className="admin-page admin-payment-settings">
      <div className="admin-payment-settings__head">
        <h1 className="admin-payment-settings__title">Payment settings</h1>
      </div>
      <AdminPaymentSettingsPanel />
    </div>
  )
}
