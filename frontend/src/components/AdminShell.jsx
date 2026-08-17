/* TODO: Gate /admin/* behind admin-only auth before production use. */

import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import BrandLogo from './BrandLogo'
import '../pages/Admin.css'

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', match: (path) => path === '/admin' },
  { to: '/admin/links', label: 'Manage Links', match: (path) => path.startsWith('/admin/links') },
  { to: '/admin/users', label: 'Users', match: (path) => path.startsWith('/admin/users') },
  { to: '/', label: 'Site', match: () => false },
]

export default function AdminShell({ title, children }) {
  const location = useLocation()
  const path = location.pathname
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    document.body.classList.toggle('nav-open', menuOpen)
    return () => document.body.classList.remove('nav-open')
  }, [menuOpen])

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div className="admin-header-left">
          <BrandLogo to="/admin" size="sm" className="admin-logo" />
          <span className="admin-title">{title}</span>
        </div>

        <button
          type="button"
          className="admin-menu-btn"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav className={`admin-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Admin">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={item.match(path) ? 'is-active' : ''}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="admin-main">{children}</main>
    </div>
  )
}
