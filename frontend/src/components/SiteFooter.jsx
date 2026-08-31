import { Link } from 'react-router-dom'
import BrandLogo from './BrandLogo'

const linkClass =
  'text-[0.95rem] font-semibold leading-snug text-[#d5deea] break-anywhere hover:text-white'
const colTitleClass =
  'mb-1.5 font-display text-[0.8rem] font-bold uppercase tracking-[0.08em] text-[#6f8298]'

export default function SiteFooter({ onOpenAuth }) {
  function handleAuth(mode) {
    if (typeof onOpenAuth === 'function') {
      onOpenAuth(mode)
    }
  }

  return (
    <footer className="relative mt-10 overflow-hidden bg-[#0f161f] text-[#e8edf4] sm:mt-14 [background-image:radial-gradient(ellipse_65%_70%_at_0%_100%,rgba(26,122,109,0.18),transparent_55%)]">
      <div
        className="h-[3px] bg-[linear-gradient(90deg,var(--color-teal)_0%,#2a9b8a_45%,var(--color-signal)_100%)]"
        aria-hidden="true"
      />

      <div className="page-x mx-auto max-w-[1120px] pt-[clamp(2.25rem,6vh,3.75rem)] pb-6 sm:pb-6.5">
        <div className="grid grid-cols-1 items-start gap-7 sm:grid-cols-2 sm:gap-8 lg:grid-cols-[1.45fr_repeat(3,minmax(0,1fr))] lg:gap-x-11 lg:gap-y-10">
          <div className="max-w-none sm:col-span-2 lg:col-span-1 lg:max-w-88">
            <BrandLogo to="/" size="sm" className="h-[2.65rem] w-auto rounded-[0.3rem] sm:h-[2.85rem]" />
            <p className="mt-3.5 mb-5 text-[0.92rem] leading-relaxed text-[#9aabbd] sm:mt-4 sm:text-[0.95rem]">
              Performance marketing built on clarity, ethics, and measurable growth.
            </p>
            {onOpenAuth ? (
              <button
                type="button"
                className="inline-flex h-[2.45rem] w-full items-center justify-center rounded-[0.4rem] bg-signal px-4.5 text-[0.92rem] font-semibold text-white transition-colors hover:bg-signal-deep sm:w-auto"
                onClick={() => handleAuth('signup')}
              >
                Get started
              </button>
            ) : (
              <Link
                to="/?auth=signup"
                className="inline-flex h-[2.45rem] w-full items-center justify-center rounded-[0.4rem] bg-signal px-4.5 text-[0.92rem] font-semibold text-white transition-colors hover:bg-signal-deep sm:w-auto"
              >
                Get started
              </Link>
            )}
          </div>

          <div className="flex flex-col items-start gap-2.5">
            <h3 className={colTitleClass}>Explore</h3>
            <Link className={linkClass} to="/">
              Home
            </Link>
            <Link className={linkClass} to="/about">
              About
            </Link>
            <Link className={linkClass} to="/services">
              Services
            </Link>
            <Link className={linkClass} to="/#faq">
              FAQ
            </Link>
            <Link className={linkClass} to="/#contact">
              Contact
            </Link>
          </div>

          <div className="flex flex-col items-start gap-2.5">
            <h3 className={colTitleClass}>Account</h3>
            {onOpenAuth ? (
              <>
                <button type="button" className={`${linkClass} border-0 bg-transparent p-0 text-left`} onClick={() => handleAuth('login')}>
                  Log in
                </button>
                <button type="button" className={`${linkClass} border-0 bg-transparent p-0 text-left`} onClick={() => handleAuth('signup')}>
                  Sign up
                </button>
              </>
            ) : (
              <>
                <Link className={linkClass} to="/?auth=login">
                  Log in
                </Link>
                <Link className={linkClass} to="/?auth=signup">
                  Sign up
                </Link>
              </>
            )}
            <Link className={linkClass} to="/terms">
              Terms &amp; Conditions
            </Link>
            <Link className={linkClass} to="/compliance-transparency">
              Compliance &amp; Transparency
            </Link>
            <Link className={linkClass} to="/privacy">
              Privacy &amp; Security
            </Link>
          </div>

          <div className="flex flex-col items-start gap-2.5">
            <h3 className={colTitleClass}>Contact</h3>
            <a className={linkClass} href="mailto:support@nexora-marketing.com">
              support@nexora-marketing.com
            </a>
            <Link className={linkClass} to="/#contact">
              Partnership queries
            </Link>
          </div>
        </div>

        <div className="mt-10 flex flex-col flex-wrap items-start justify-between gap-5 border-t border-white/10 pt-5 sm:flex-row sm:items-start">
          <p className="m-0 text-[0.88rem] whitespace-normal text-[#7a8b9f] sm:whitespace-nowrap">
            © {new Date().getFullYear()} Nexora Bizworks. All rights reserved.
          </p>
          <p className="m-0 max-w-none text-left text-[0.8rem] leading-relaxed text-[#6b7c90] sm:max-w-[52ch] sm:text-right">
            Independent promotional advertising &amp; performance marketing. Not a bank, brokerage,
            or investment advisor — we do not hold deposits or guarantee returns.
          </p>
        </div>
      </div>
    </footer>
  )
}
