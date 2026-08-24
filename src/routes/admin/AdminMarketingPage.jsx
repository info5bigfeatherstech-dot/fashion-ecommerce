import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import AdminSectionPage from './AdminSectionPage'

export default function AdminMarketingPage() {
  const navigate = useNavigate()
  return (
    <AdminSectionPage
      eyebrow="Growth"
      title="Marketing"
      description="Marketing hub aligned with fabFE. Coupons are available now; other modules can be wired next."
    >
      <div className="admin-row-actions" style={{ marginTop: 16 }}>
        <Button variant="primary" size="sm" onClick={() => navigate('/admin/coupons')}>
          Open coupons
        </Button>
      </div>
    </AdminSectionPage>
  )
}
