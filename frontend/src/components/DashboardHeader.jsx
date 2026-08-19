import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import BrandLogo from './BrandLogo'
import MenuToggleButton from './MenuToggleButton'

const NAV_ITEMS = [
  { id: 'overview', href: '#overview', label: 'Overview' },
  { id: 'offers', href: '#offers', label: 'My offers' },
  { id: 'account', href: '#account', label: 'Account' },
  { id: 'help', href: '#help', label: 'Help' },
]

function navLinkClass(active) {
  const base =
    'border-b border-mist/70 py-3.5 text-[0.92rem] font-semibold transition-colors max-lg:whitespace-normal lg:whitespace-nowrap lg:border-0 lg:py-1.5 lg:px-1 lg:text-[0.94rem]'
  if (active) {
    return `${base} text-teal max-lg:bg-teal/8 max-lg:font-bold lg:font-bold lg:underline lg:decoration-2 lg:underline-offset-[0.35rem]`
  }
  return `${base} text-[#1a2332] hover:text-teal`
}

export default function DashboardHeader({ user, onLogout }) {
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeHash, setActiveHash] = useState('')

  useEffect(() => {
    document.body.classList.toggle('nav-open', menuOpen)
    return () => document.body.classList.remove('nav-open')
  }, [menuOpen])

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    function syncHash() {
      setActiveHash(window.location.hash || '#overview')
    }
    syncHash()
    window.addEventListener('hashchange', syncHash)
    return () => window.removeEventListener('hashchange', syncHash)
  }, [])

  function closeMenu() {
    setMenuOpen(false)
  }

  const firstName = user?.fullName?.split(/\s+/)[0] || 'there'

  return (
    <header className="fixed inset-x-0 top-0 z-40 grid h-[4.25rem] grid-cols-[1fr_auto] items-center gap-x-3 border-b border-mist/90 bg-paper/92 px-3 backdrop-blur-[14px] sm:h-header sm:gap-x-9 sm:px-4 md:px-[clamp(1.5rem,5vw,3.25rem)] lg:grid-cols-[auto_1fr_auto]">
      <div className="flex min-w-0 items-center">
        <BrandLogo
          to="/dashboard"
          size="sm"
          className="h-8 w-auto max-h-8 rounded-[0.3rem] sm:h-10 sm:max-h-10 lg:h-12 lg:max-h-12"
        />
      </div>

      <nav
        className={`${
          menuOpen ? 'flex' : 'hidden'
        } absolute top-[4.25rem] right-0 left-0 z-30 max-h-[calc(100dvh-4.25rem)] flex-col items-stretch gap-0 overflow-y-auto overscroll-contain border-b border-mist bg-paper/98 px-4 py-2 shadow-[0_12px_24px_rgba(11,19,32,0.08)] sm:top-header sm:max-h-[calc(100dvh-var(--spacing-header))] lg:static lg:max-h-none lg:flex lg:flex-row lg:items-center lg:justify-center lg:gap-[2.15rem] lg:overflow-visible lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none`}
        aria-label="Dashboard"
      >
        {NAV_ITEMS.map((item) => {
          const active = activeHash === item.href || (!activeHash && item.id === 'overview')
          return (
            <a
              key={item.id}
              href={item.href}
              onClick={closeMenu}
              className={navLinkClass(active)}
            >
              {item.label}
            </a>
          )
        })}

        <div className="border-t border-mist/80 pt-3.5 lg:hidden">
          <p className="m-0 mb-3 px-1 text-[0.88rem] font-semibold text-muted sm:hidden">
            Signed in as {firstName}
          </p>
          <div className="grid grid-cols-1 gap-2.5">
          <Link
            to="/"
            onClick={closeMenu}
            className="inline-flex h-11 w-full items-center justify-center rounded-[0.4rem] border border-mist bg-transparent text-[0.9rem] font-semibold text-ink"
          >
            Public site
          </Link>
          <button
            type="button"
            className="inline-flex h-11 w-full items-center justify-center rounded-[0.4rem] bg-signal text-[0.9rem] font-semibold text-white hover:bg-signal-deep"
            onClick={() => {
              closeMenu()
              onLogout()
            }}
          >
            Log out
          </button>
          </div>
        </div>
      </nav>

      <div className="flex items-center justify-end gap-2 sm:gap-3">
        <p className="hidden max-w-[10rem] truncate text-[0.82rem] font-semibold text-muted sm:block lg:max-w-[12rem] lg:text-[0.88rem]">
          Hi, {firstName}
        </p>
        <nav className="hidden items-center gap-2 lg:flex" aria-label="Account actions">
          <Link
            to="/"
            className="inline-flex h-10 min-h-10 items-center justify-center rounded-[0.4rem] border border-transparent bg-transparent px-3 text-[0.88rem] font-semibold text-[#1a2332] hover:bg-mist/70 sm:px-4 sm:text-[0.9rem]"
          >
            Public site
          </Link>
          <button
            type="button"
            className="inline-flex h-10 min-h-10 items-center justify-center rounded-[0.4rem] bg-signal px-4 text-[0.9rem] font-semibold text-white hover:bg-signal-deep"
            onClick={onLogout}
          >
            Log out
          </button>
        </nav>
        <MenuToggleButton
          open={menuOpen}
          className="lg:hidden"
          onClick={() => setMenuOpen((open) => !open)}
        />
      </div>
    </header>
  )
}
