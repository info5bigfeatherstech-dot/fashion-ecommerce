import { useNavigate } from 'react-router-dom'
import { Archive, Star, Upload } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function AdminProductStatsBar({
  activeCount = 0,
  featuredCount = 0,
  archivedCount = 0,
  onBulkUpload,
}) {
  const navigate = useNavigate()

  return (
    <div className="admin-stats-bar">
      <span className="admin-stats-chip admin-stats-chip--blue">
        <span className="admin-stats-chip__dot" aria-hidden />
        {activeCount} Active
      </span>
      <span className="admin-stats-chip admin-stats-chip--purple">
        <Star size={14} aria-hidden />
        {featuredCount} Featured
      </span>
      <button
        type="button"
        className="admin-stats-chip admin-stats-chip--muted"
        onClick={() => navigate('/admin/archived')}
      >
        <Archive size={14} aria-hidden />
        {archivedCount} Archived
      </button>
      <button
        type="button"
        className="admin-stats-chip admin-stats-chip--green"
        onClick={onBulkUpload}
      >
        <Upload size={14} aria-hidden />
        Bulk Upload
      </button>
    </div>
  )
}
