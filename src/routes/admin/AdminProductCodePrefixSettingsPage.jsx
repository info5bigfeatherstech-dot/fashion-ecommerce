import { AdminProductCodePrefixSettingsPanel } from '@/features/admin/components/AdminProductCodePrefixSettingsPanel'

export default function AdminProductCodePrefixSettingsPage() {
  return (
    <div className="admin-page admin-payment-settings">
      <div className="admin-payment-settings__head">
        <h1 className="admin-payment-settings__title">Product code prefix</h1>
      </div>
      <AdminProductCodePrefixSettingsPanel />
    </div>
  )
}
