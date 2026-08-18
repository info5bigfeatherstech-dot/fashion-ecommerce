import { Link } from 'react-router-dom'
import { MEGA_MENUS } from '../api'

export function MegaMenuPanel({ activeCategory }) {
  const columns = MEGA_MENUS[activeCategory]
  if (!columns?.length) return null

  return (
    <div className="mega-menu__grid">
      {columns.map((column, idx) => (
        <div key={column.title || idx} className="mega-menu__column">
          {column.title ? (
            column.href ? (
              <Link to={column.href} className="mega-menu__column-title">
                {column.title}
              </Link>
            ) : (
              <span className="mega-menu__column-title mega-menu__column-title--plain">
                {column.title}
              </span>
            )
          ) : null}
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
