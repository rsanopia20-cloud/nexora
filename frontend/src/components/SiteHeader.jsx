import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import BrandLogo from './BrandLogo'
import MenuToggleButton from './MenuToggleButton'

export const NAV_LINKS = [
  {
    id: 'home',
    to: '/',
    label: 'Home',
    isActive: ({ pathname, hash }) => pathname === '/' && !hash,
  },
  {
    id: 'about',
    to: '/about',
    label: 'About',
    isActive: ({ pathname }) => pathname === '/about',
  },
  {
    id: 'services',
    to: '/services',
    label: 'Services',
    isActive: ({ pathname }) => pathname === '/services',
  },
  {
    id: 'faq',
    to: '/#faq',
    label: 'FAQ',
    isActive: ({ pathname, hash }) => pathname === '/' && hash === '#faq',
  },
  {
    id: 'contact',
    to: '/#contact',
    label: 'Contact Us',
    isActive: ({ pathname, hash }) => pathname === '/' && hash === '#contact',
  },
]

const btnSolid =
  'inline-flex h-10 min-h-10 items-center justify-center rounded-[0.4rem] bg-signal px-4.5 text-[0.92rem] font-semibold text-white transition-colors hover:bg-signal-deep'

function navHref(item, pathname) {
  if (pathname === '/' && (item.id === 'faq' || item.id === 'contact')) {
    return `#${item.id}`
  }
  return item.to
}

function navLinkClass(active) {
  const base =
    'border-b border-mist/70 py-3.5 text-[0.92rem] font-semibold transition-colors max-lg:whitespace-normal lg:whitespace-nowrap lg:border-0 lg:py-1.5 lg:px-1 lg:text-[0.94rem]'
  if (active) {
    return `${base} text-teal max-lg:bg-teal/8 max-lg:font-bold lg:font-bold lg:underline lg:decoration-2 lg:underline-offset-[0.35rem]`
  }
  return `${base} text-[#1a2332] hover:text-teal`
}

export default function SiteHeader({ onOpenAuth }) {
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    document.body.classList.toggle('nav-open', menuOpen)
    return () => document.body.classList.remove('nav-open')
  }, [menuOpen])

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname, location.hash])

  function closeMenu() {
    setMenuOpen(false)
  }

  function handleAuth(mode) {
    closeMenu()
    if (typeof onOpenAuth === 'function') {
      onOpenAuth(mode)
    }
  }

  const loc = { pathname: location.pathname, hash: location.hash }

  return (
    <header className="fixed inset-x-0 top-0 z-40 grid h-header grid-cols-[1fr_auto] items-center gap-x-4 border-b border-mist/90 bg-paper/90 px-4 backdrop-blur-[14px] sm:gap-x-9 sm:px-[clamp(1.5rem,5vw,3.25rem)] lg:grid-cols-[auto_1fr_auto]">
      <div className="flex min-w-0 items-center">
        <BrandLogo
          to="/"
          size="sm"
          className="h-9 w-auto max-h-9 rounded-[0.3rem] sm:h-10 sm:max-h-10 lg:h-12 lg:max-h-12"
        />
      </div>

      <nav
        className={`${
          menuOpen ? 'flex' : 'hidden'
        } absolute top-header right-0 left-0 z-30 max-h-[calc(100dvh-var(--spacing-header))] flex-col items-stretch gap-0 overflow-y-auto overscroll-contain border-b border-mist bg-paper/98 px-4 py-2 shadow-[0_12px_24px_rgba(11,19,32,0.08)] lg:static lg:max-h-none lg:flex lg:flex-row lg:items-center lg:justify-center lg:gap-[2.15rem] lg:overflow-visible lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none`}
        aria-label="Primary"
      >
        {NAV_LINKS.map((item) => {
          const active = item.isActive(loc)
          const href = navHref(item, location.pathname)
          const className = navLinkClass(active)

          if (href.startsWith('#')) {
            return (
              <a key={item.id} href={href} onClick={closeMenu} className={className}>
                {item.label}
              </a>
            )
          }

          return (
            <Link
              key={item.id}
              to={href}
              onClick={() => {
                closeMenu()
                if (!href.includes('#')) {
                  window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
                }
              }}
              className={className}
            >
              {item.label}
            </Link>
          )
        })}

        <div className="grid grid-cols-1 gap-2.5 pt-3.5 sm:grid-cols-2 lg:hidden">
          {onOpenAuth ? (
            <>
              <button
                type="button"
                className="inline-flex h-11 w-full items-center justify-center rounded-[0.4rem] border border-mist bg-transparent text-[0.9rem] font-semibold text-ink"
                onClick={() => handleAuth('login')}
              >
                Log in
              </button>
              <button
                type="button"
                className={`${btnSolid} h-11 w-full`}
                onClick={() => handleAuth('signup')}
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              <Link
                to="/?auth=login"
                onClick={closeMenu}
                className="inline-flex h-11 w-full items-center justify-center rounded-[0.4rem] border border-mist bg-transparent text-[0.9rem] font-semibold text-ink"
              >
                Log in
              </Link>
              <Link
                to="/?auth=signup"
                onClick={closeMenu}
                className={`${btnSolid} h-11 w-full`}
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>

      <div className="flex items-center justify-end gap-2 sm:gap-3.5">
        <nav className="hidden items-center gap-2 sm:gap-3 lg:flex" aria-label="Account">
          {onOpenAuth ? (
            <>
              <button
                type="button"
                className="inline-flex h-10 min-h-10 items-center justify-center rounded-[0.4rem] border border-transparent bg-transparent px-3 text-[0.88rem] font-semibold text-[#1a2332] hover:bg-mist/70 sm:px-4 sm:text-[0.9rem]"
                onClick={() => handleAuth('login')}
              >
                Log in
              </button>
              <button type="button" className={btnSolid} onClick={() => handleAuth('signup')}>
                Sign up
              </button>
            </>
          ) : (
            <>
              <Link
                to="/?auth=login"
                className="inline-flex h-10 min-h-10 items-center justify-center rounded-[0.4rem] border border-transparent bg-transparent px-3 text-[0.88rem] font-semibold text-[#1a2332] hover:bg-mist/70 sm:px-4 sm:text-[0.9rem]"
              >
                Log in
              </Link>
              <Link to="/?auth=signup" className={btnSolid}>
                Sign up
              </Link>
            </>
          )}
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
