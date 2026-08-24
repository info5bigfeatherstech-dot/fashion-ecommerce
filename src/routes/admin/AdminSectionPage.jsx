import { AdminPageHeader } from '@/features/admin/components/AdminUi'

/**
 * Lightweight section page for fabFE nav items that are not fully ported yet.
 */
export default function AdminSectionPage({
  eyebrow = 'Admin',
  title = 'Section',
  description = 'This section is available in the admin navigation. Full tooling can be connected to matching APIs next.',
  children,
}) {
  return (
    <div className="admin-page">
      <AdminPageHeader eyebrow={eyebrow} title={title} />
      <div className="admin-card">
        <p className="admin-card__subtitle" style={{ margin: 0 }}>
          {description}
        </p>
        {children}
      </div>
    </div>
  )
}
