import { Link } from 'react-router-dom'
import { MEGA_MENUS } from '../api'

export function MegaMenuPanel({ activeCategory }) {
  const columns = MEGA_MENUS[activeCategory]
  if (!columns?.length) return null

  return (
    <div className="mega-menu__grid">
      {columns.map((column) => (
        <div key={column.title} className="mega-menu__column">
          <Link to={column.href} className="mega-menu__column-title">
            {column.title}
          </Link>
          {column.links.map((link) => (
            <Link key={link.label} to={link.href} className="mega-menu__link">
              {link.label}
            </Link>
          ))}
          {column.seeMore && (
            <Link to={column.href} className="mega-menu__see-more">
              See more
            </Link>
          )}
        </div>
      ))}
    </div>
  )
}
