import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, MessageSquare, MoreVertical, Share2 } from 'lucide-react'
import {
  AdminEmpty,
  AdminError,
  AdminLoading,
  AdminPageHeader,
  AdminPagination,
  extractListPayload,
} from '@/features/admin/components/AdminUi'
import { useAdminUsers } from '@/features/admin/hooks'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ActionMenu } from '@/components/ui/DropdownMenu'

const ROLE_OPTIONS = [
  { value: 'all', label: 'All Roles' },
  { value: 'user', label: 'User' },
  { value: 'admin', label: 'Admin' },
]

function getInitials(name, email) {
  if (name) {
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return parts[0][0].toUpperCase()
  }
  if (email) {
    return email[0].toUpperCase()
  }
  return '?'
}

function getAvatarColor(str) {
  const colors = [
    'bg-blue-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-indigo-500',
    'bg-teal-500',
  ]
  const hash = (str || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[hash % colors.length]
}

function LeadAvatar({ name, email }) {
  const initials = getInitials(name, email)
  const colorClass = getAvatarColor(name || email)
  
  return (
    <div className={`lead-avatar ${colorClass}`}>
      {initials}
    </div>
  )
}

function LeadRow({ lead, onAction }) {
  const navigate = useNavigate()
  const joinedDate = lead.createdAt ? new Date(lead.createdAt) : null
  const formattedDate = joinedDate
    ? joinedDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—'
  const formattedTime = joinedDate
    ? joinedDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    : ''

  // Mock engagement data - replace with actual data from your API
  const engagement = {
    visits: Math.floor(Math.random() * 10),
    interactions: Math.floor(Math.random() * 10),
  }

  return (
    <tr className="lead-row">
      <td>
        <input type="checkbox" className="lead-checkbox" />
      </td>
      <td>
        <div className="lead-customer">
          <LeadAvatar name={lead.name} email={lead.email} />
          <div className="lead-customer-info">
            <div className="lead-customer-name">{lead.name || 'Unnamed'}</div>
            <div className="lead-customer-email">{lead.email}</div>
          </div>
        </div>
      </td>
      <td>
        <Badge variant="warning" size="sm">UNVIEWED</Badge>
      </td>
      <td>
        <div className="lead-engagement">
          {engagement.visits > 0 && (
            <span className="lead-engagement-item">
              📊 {engagement.visits}
            </span>
          )}
          {engagement.interactions > 0 && (
            <span className="lead-engagement-item">
              ❤️ {engagement.interactions}
            </span>
          )}
        </div>
      </td>
      <td>
        <div className="lead-joined">
          <div className="lead-joined-date">{formattedDate}</div>
          <div className="lead-joined-time">{formattedTime}</div>
        </div>
      </td>
      <td>
        <div className="lead-actions">
          <button
            type="button"
            className="lead-action-btn"
            title="Send email"
            onClick={() => onAction('email', lead)}
          >
            <Mail size={16} />
          </button>
          <button
            type="button"
            className="lead-action-btn"
            title="Send message"
            onClick={() => onAction('message', lead)}
          >
            <MessageSquare size={16} />
          </button>
          <button
            type="button"
            className="lead-action-btn"
            title="Share"
            onClick={() => onAction('share', lead)}
          >
            <Share2 size={16} />
          </button>
          <ActionMenu
            trigger={
              <button type="button" className="lead-action-btn">
                <MoreVertical size={16} />
              </button>
            }
            items={[
              { label: 'View details', onClick: () => navigate(`/admin/customers/${lead._id || lead.id}`) },
              { label: 'Edit', onClick: () => onAction('edit', lead) },
              { label: 'Delete', onClick: () => onAction('delete', lead), danger: true },
            ]}
          />
        </div>
      </td>
    </tr>
  )
}

export default function AdminLeadsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  const { data, isLoading, isError, error, refetch } = useAdminUsers({ page, search })
  const { items: users, pagination } = useMemo(
    () => extractListPayload(data, ['users', 'data']),
    [data]
  )

  const handleAction = (action, lead) => {
    console.log('Action:', action, 'Lead:', lead)
    // Implement actions here
  }

  const handleExport = () => {
    console.log('Exporting leads data...')
    // Implement export functionality
  }

  return (
    <div className="admin-page">
      <AdminPageHeader title="Leads" />
      
      <div className="leads-toolbar">
        <div className="leads-toolbar-left">
          <div className="leads-search">
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setSearch(searchInput.trim())
                  setPage(1)
                }
              }}
              placeholder="Search customers..."
            />
          </div>
          <div className="leads-filter">
            <label htmlFor="role-filter" className="leads-filter-label">
              Auto-push
            </label>
            <select
              id="role-filter"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="leads-filter-select"
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="leads-toolbar-right">
          <Button variant="primary" size="sm" onClick={handleExport}>
            📤 Export Data
          </Button>
        </div>
      </div>

      <div className="admin-card admin-card--flush leads-card">
        {isLoading && <AdminLoading />}
        {isError && <AdminError message={error?.message} onRetry={refetch} />}
        {!isLoading && users.length === 0 && <AdminEmpty message="No leads found." />}
        {!isLoading && users.length > 0 && (
          <>
            <div className="leads-table-wrap">
              <table className="leads-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>
                      <input type="checkbox" className="lead-checkbox" />
                    </th>
                    <th>CUSTOMER</th>
                    <th>STATUS</th>
                    <th>ENGAGEMENT</th>
                    <th>JOINED</th>
                    <th style={{ width: '120px' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((lead) => (
                    <LeadRow key={lead._id || lead.id} lead={lead} onAction={handleAction} />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="leads-pagination">
              <div className="leads-pagination-info">
                Page {page} of {pagination?.totalPages || 1}
              </div>
              <div className="leads-pagination-controls">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Prev
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= (pagination?.totalPages || 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
