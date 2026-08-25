import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Calculator,
  Eraser,
  Globe,
  MessageCircle,
  Package,
  QrCode,
  Scale,
  Search,
  Store,
  TextCursorInput,
} from 'lucide-react'
import { toast } from 'sonner'

function IconTm({ className = '' }) {
  return <span className={`admin-utilities__glyph admin-utilities__glyph--tm ${className}`}>TM</span>
}

function IconRegister({ className = '', inverted = false }) {
  return (
    <span className={`admin-utilities__glyph admin-utilities__glyph--register${inverted ? ' is-inverted' : ''} ${className}`}>
      Register
    </span>
  )
}

function IconBrandDoc({ className = '' }) {
  return (
    <span className={`admin-utilities__glyph admin-utilities__glyph--doc ${className}`}>
      <span className="admin-utilities__glyph-line" />
      <span>Business</span>
    </span>
  )
}

function IconGst({ className = '' }) {
  return <span className={`admin-utilities__glyph admin-utilities__glyph--box ${className}`}>GST</span>
}

function IconHsn({ className = '' }) {
  return <span className={`admin-utilities__glyph admin-utilities__glyph--box ${className}`}>HSN</span>
}

function IconTmCircle({ className = '' }) {
  return <span className={`admin-utilities__glyph admin-utilities__glyph--tm-circle ${className}`}>TM</span>
}

function IconPos({ className = '' }) {
  return (
    <span className={`admin-utilities__glyph admin-utilities__glyph--pos ${className}`}>
      P <span aria-hidden>●</span> S
    </span>
  )
}

const LATEST_RELEASES = [
  { id: 'tm-reg', title: 'Trademark Registration', Icon: IconTm, tone: 'navy' },
  { id: 'gst-reg-latest', title: 'GST Registration', Icon: () => <IconRegister inverted />, tone: 'blue' },
  { id: 'brand-gen-latest', title: 'Brand Name Generator', Icon: IconBrandDoc, tone: 'sky' },
  { id: 'shipmozo-latest', title: 'Shipmozo', Icon: Package, tone: 'indigo' },
]

const CATEGORIES = [
  {
    id: 'marketing',
    name: 'Marketing & Branding',
    tools: [
      { id: 'lawyer', title: 'Talk to Lawyer', Icon: Scale, color: 'slate' },
      { id: 'qr', title: 'Website QR Code', Icon: QrCode, color: 'blue' },
      { id: 'whatsapp', title: 'WhatsApp Business', Icon: MessageCircle, color: 'green' },
      { id: 'shipmozo', title: 'Shipmozo', Icon: Package, color: 'navy' },
      { id: 'brand-gen', title: 'Brand Name Generator', Icon: TextCursorInput, color: 'sky' },
      { id: 'bg-remover', title: 'Background Remover', Icon: Eraser, color: 'amber' },
    ],
  },
  {
    id: 'finance',
    name: 'Finance',
    tools: [
      { id: 'gst-reg', title: 'GST Registration', Icon: IconRegister, color: 'slate' },
      { id: 'gst-search', title: 'GST Number Search', Icon: IconGst, color: 'slate' },
      { id: 'hsn', title: 'HSN Search', Icon: IconHsn, color: 'slate' },
      { id: 'emi', title: 'EMI Calculator', Icon: Calculator, color: 'slate' },
    ],
  },
  {
    id: 'more',
    name: 'More',
    tools: [
      { id: 'tm', title: 'Trademark Registration', Icon: IconTmCircle, color: 'slate' },
      { id: 'perf', title: 'Website Performance Check', Icon: Globe, color: 'slate' },
      { id: 'pos', title: 'Restaurant POS', Icon: IconPos, color: 'slate' },
      { id: 'shopify', title: 'Get Shopify Website', Icon: Store, color: 'green' },
    ],
  },
]

function matchesQuery(title, query) {
  if (!query) return true
  return String(title).toLowerCase().includes(query)
}

function ToolTile({ tool, featured = false, onOpen }) {
  const Icon = tool.Icon
  return (
    <button
      type="button"
      className={`admin-utilities__tool${featured ? ' admin-utilities__tool--featured' : ''}`}
      onClick={() => onOpen(tool)}
    >
      <span
        className={
          featured
            ? `admin-utilities__icon-box admin-utilities__icon-box--${tool.tone || 'navy'}`
            : `admin-utilities__icon-plain admin-utilities__icon-plain--${tool.color || 'slate'}`
        }
        aria-hidden
      >
        <Icon size={featured ? 28 : 32} strokeWidth={featured ? 1.5 : 1.2} />
      </span>
      <span className="admin-utilities__tool-label">{tool.title}</span>
    </button>
  )
}

export default function AdminUtilitiesPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const query = search.trim().toLowerCase()

  const latest = useMemo(
    () => LATEST_RELEASES.filter((tool) => matchesQuery(tool.title, query)),
    [query]
  )

  const categories = useMemo(
    () =>
      CATEGORIES.map((cat) => ({
        ...cat,
        tools: cat.tools.filter((tool) => matchesQuery(tool.title, query)),
      })).filter((cat) => cat.tools.length > 0),
    [query]
  )

  const empty = latest.length === 0 && categories.length === 0

  const handleOpen = (tool) => {
    toast.message(`${tool.title}`, {
      description: 'This utility will be connected when the API is ready.',
    })
  }

  return (
    <div className="admin-page admin-utilities">
      <header className="admin-utilities__head">
        <div className="admin-utilities__title-row">
          <button
            type="button"
            className="admin-utilities__back"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="admin-utilities__title">Utilities</h1>
        </div>

        <div className="admin-utilities__search">
          <Search size={18} aria-hidden />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tools"
            aria-label="Search tools"
          />
        </div>
      </header>

      <div className="admin-utilities__sections">
        {latest.length > 0 && (
          <section className="admin-utilities__card">
            <div className="admin-utilities__card-head">
              <h2 className="admin-utilities__section-title">Latest Releases</h2>
              <span className="admin-utilities__new">New</span>
            </div>
            <div className="admin-utilities__grid">
              {latest.map((tool) => (
                <ToolTile key={tool.id} tool={tool} featured onOpen={handleOpen} />
              ))}
            </div>
          </section>
        )}

        {categories.map((cat) => (
          <section key={cat.id} className="admin-utilities__card">
            <h2 className="admin-utilities__section-title admin-utilities__section-title--muted">
              {cat.name}
            </h2>
            <div className="admin-utilities__grid">
              {cat.tools.map((tool) => (
                <ToolTile key={tool.id} tool={tool} onOpen={handleOpen} />
              ))}
            </div>
          </section>
        ))}

        {empty && (
          <div className="admin-utilities__empty">
            No tools match “{search.trim()}”.
          </div>
        )}
      </div>
    </div>
  )
}
