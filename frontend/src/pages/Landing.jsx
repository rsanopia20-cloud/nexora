import { useEffect, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import AuthModal from '../components/AuthModal'
import BrandLogo from '../components/BrandLogo'
import LoginForm from '../components/LoginForm'
import SignupForm from '../components/SignupForm'
import SiteFooter from '../components/SiteFooter'
import SiteHeader from '../components/SiteHeader'
import { useAuth } from '../context/AuthContext'

const eyebrow = 'mb-3 text-[0.8rem] font-semibold uppercase tracking-[0.14em] text-teal'
const btnSolid =
  'inline-flex items-center justify-center rounded-[0.4rem] bg-signal px-4.5 py-2.5 text-[0.92rem] font-semibold text-white transition-colors hover:bg-signal-deep'
const btnOutline =
  'inline-flex items-center justify-center rounded-[0.4rem] border-[1.5px] border-white/70 bg-ink/20 px-4.5 py-2.5 text-[0.92rem] font-semibold text-white transition-colors hover:border-white hover:bg-white/14'

const GUIDES = [
  'Ethical promotional advertising',
  'Transparent campaign communication',
  'Compliance-first operations',
  'Responsible customer engagement',
]

const SERVICE_ITEMS = [
  {
    title: 'Marketing & Campaigns',
    accent: 'border-signal',
    items: [
      'Promotional advertising & digital outreach',
      'Performance & affiliate marketing',
      'Campaign management',
    ],
  },
  {
    title: 'Acquisition & Support',
    accent: 'border-teal',
    items: [
      'Customer acquisition & lead generation',
      'Onboarding support',
      'Digital marketing assistance',
    ],
  },
  {
    title: 'Programs',
    accent: 'border-[#c45a3a]',
    items: ['Internship & training programs', 'Work from home opportunities'],
  },
]

const FAQ_ITEMS = [
  {
    q: 'Is NEXORA a bank or financial institution?',
    a: 'No. NEXORA is an independent promotional advertising and performance marketing company. We do not accept deposits, provide investment advice, or issue financial products.',
  },
  {
    q: 'What does registration include?',
    a: 'After signup, participants receive campaign tracking links and onboarding guidance. Participation does not guarantee approvals, earnings, or fixed returns.',
  },
  {
    q: 'Who provides the products behind the links?',
    a: 'Certain links and onboarding flows may come from third-party partners. Those products remain subject to each provider’s own terms, eligibility, and KYC processes.',
  },
  {
    q: 'Where can I read the full Terms & Conditions?',
    a: 'terms',
  },
]

export default function Landing() {
  const { isAuthenticated, loading } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [authMode, setAuthMode] = useState(null)

  useEffect(() => {
    const auth = searchParams.get('auth')
    if (auth === 'login' || auth === 'signup') {
      setAuthMode(auth)
    }
  }, [searchParams])

  function openAuth(mode) {
    setAuthMode(mode)
    setSearchParams(mode ? { auth: mode } : {}, { replace: true })
  }

  function closeAuth() {
    setAuthMode(null)
    setSearchParams({}, { replace: true })
  }

  if (!loading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_80%_50%_at_100%_0%,rgba(26,122,109,0.12),transparent_55%),radial-gradient(ellipse_60%_40%_at_0%_100%,rgba(255,59,31,0.08),transparent_50%),var(--color-paper)]">
      <SiteHeader onOpenAuth={openAuth} />

      <main>
        <section className="hero-shell relative flex items-end overflow-hidden text-white" id="top" aria-label="Hero">
          <div className="absolute inset-0" aria-hidden="true">
            <img
              src="https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=2400&q=80"
              alt=""
              className="h-full w-full object-cover animate-hero-zoom"
            />
            <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(11,19,32,0.82)_0%,rgba(11,19,32,0.45)_55%,rgba(11,19,32,0.25)_100%),linear-gradient(to_top,rgba(11,19,32,0.7)_0%,transparent_50%)]" />
          </div>

          <div className="relative z-1 w-full max-w-xl animate-rise">
            <BrandLogo
              to={null}
              size="lg"
              className="mb-3.5 max-h-16 rounded-[0.35rem] shadow-[0_12px_40px_rgba(0,0,0,0.35)] sm:max-h-none"
            />
            <h1 className="m-0 mb-4 font-display text-[clamp(1.65rem,6vw,3.35rem)] font-extrabold leading-[1.1] tracking-[-0.035em]">
              Empowering businesses through promotional advertising &amp; performance marketing.
            </h1>
            <p className="mb-6 max-w-none text-[clamp(0.98rem,2.5vw,1.12rem)] leading-relaxed text-white/82 sm:max-w-[34ch]">
              Ethical, transparent campaigns that help brands expand customer reach with measurable
              results.
            </p>
            <div className="btn-stack">
              <button type="button" className={`${btnSolid} h-12 px-6 text-base`} onClick={() => openAuth('signup')}>
                Get started
              </button>
              <Link to="/about" className={`${btnOutline} h-12 px-6 text-base`}>
                Learn more
              </Link>
            </div>
          </div>
        </section>

        {/* Mission */}
        <section
          className="page-x section-y-lg mx-auto grid max-w-[1160px] grid-cols-1 items-center gap-8 md:grid-cols-[1.05fr_0.95fr] md:gap-[clamp(2rem,5vw,4rem)]"
          id="about"
          aria-labelledby="about-heading"
        >
          <div>
            <p className={eyebrow}>Our mission</p>
            <h2
              id="about-heading"
              className="m-0 mb-5 font-display text-[clamp(1.55rem,5vw,2.65rem)] font-extrabold leading-[1.1] tracking-[-0.035em]"
            >
              Empowering Businesses.
            </h2>
            <p className="m-0 mb-4 max-w-none text-[1rem] leading-relaxed text-muted sm:max-w-[44ch] sm:text-[1.05rem]">
              We specialize in promotional advertising, customer acquisition, campaign management,
              and onboarding support by collaborating with trusted third-party organizations across
              financial and digital service sectors.
            </p>
            <p className="m-0 mb-6 max-w-none text-[1rem] leading-relaxed text-muted sm:max-w-[44ch] sm:text-[1.05rem]">
              Our mission is to create meaningful opportunities for businesses and participants while
              maintaining the highest standards of professionalism, transparency, compliance, and
              customer satisfaction.
            </p>
            <Link
              to="/about"
              className="inline-flex h-10 items-center font-bold text-teal hover:underline"
            >
              Read our full story →
            </Link>
          </div>
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1400&q=80"
              alt="Team collaborating on campaigns"
              className="aspect-16/10 w-full object-cover saturate-[0.92] contrast-[1.04] md:aspect-4/5"
            />
            <p className="absolute inset-x-0 bottom-0 m-0 bg-[linear-gradient(to_top,rgba(11,19,32,0.85),transparent)] px-5 py-4.5 text-[0.78rem] font-bold uppercase tracking-[0.1em] text-white/90">
              Nexora Bizworks · Established 2026
            </p>
          </div>
        </section>

        {/* What guides us */}
        <section
          className="page-x py-[clamp(2rem,6vh,3.5rem)] text-[#e8edf4] bg-[#101820]"
          aria-label="What guides us"
        >
          <p className={`${eyebrow} mx-auto mb-5 max-w-[1160px] text-[#8fd4c8]`}>What guides us</p>
          <ul className="mx-auto grid max-w-[1160px] list-none grid-cols-1 gap-5 p-0 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-7">
            {GUIDES.map((item, index) => (
              <li
                key={item}
                className="flex flex-col gap-2 border-t-2 border-signal/85 pt-4 font-display text-[clamp(1rem,1.6vw,1.15rem)] font-bold leading-snug tracking-[-0.02em]"
              >
                <span className="font-sans text-[0.78rem] font-semibold tracking-[0.08em] text-[#7f91a6]">
                  {String(index + 1).padStart(2, '0')}
                </span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* Operating boundary */}
        <section className="page-x section-y mx-auto max-w-[1160px]">
          <div className="grid grid-cols-1 items-start gap-5 border-t-[3px] border-signal bg-white p-5 shadow-[0_8px_30px_rgba(11,19,32,0.06)] sm:gap-8 sm:p-[clamp(1.5rem,4vw,2.25rem)] md:grid-cols-[0.35fr_1fr]">
            <h3 className="m-0 font-display text-[0.82rem] font-bold uppercase tracking-[0.1em] text-ink">
              Operating boundary
            </h3>
            <p className="m-0 text-[0.98rem] leading-relaxed text-muted">
              NEXORA is not a bank, brokerage firm, NBFC, financial institution, investment advisory
              company, or regulatory authority. We do not provide investment advice, trading
              services, portfolio management, or financial consulting. Our services are limited to
              promotional advertising, performance marketing, customer acquisition, onboarding
              assistance, and professional training.
            </p>
          </div>
        </section>

        {/* Services */}
        <section
          className="page-x section-y bg-[radial-gradient(ellipse_70%_50%_at_0%_0%,rgba(26,122,109,0.08),transparent_55%),color-mix(in_srgb,var(--color-mist)_35%,var(--color-paper))]"
          id="services"
          aria-labelledby="services-heading"
        >
          <div className="mx-auto max-w-[1160px]">
            <div className="mb-[clamp(2rem,5vh,3rem)] max-w-xl">
              <p className={eyebrow}>Services</p>
              <h2
                id="services-heading"
                className="m-0 mb-3.5 font-display text-[clamp(1.55rem,5vw,2.65rem)] font-extrabold leading-[1.1] tracking-[-0.035em]"
              >
                What we deliver.
              </h2>
              <p className="m-0 text-[1.05rem] leading-relaxed text-muted">
                Campaign support and onboarding assistance in collaboration with trusted third-party
                partners across financial and digital service sectors.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
              {SERVICE_ITEMS.map((group, index) => (
                <div
                  key={group.title}
                  className={`border-t-[3px] bg-white p-6 shadow-[0_6px_24px_rgba(11,19,32,0.05)] ${group.accent}`}
                >
                  <p className="m-0 mb-2 text-[0.75rem] font-bold uppercase tracking-[0.12em] text-[#7a8b9f]">
                    Group {String.fromCharCode(65 + index)}
                  </p>
                  <h3 className="m-0 mb-4 font-display text-[1.2rem] font-extrabold tracking-[-0.02em]">
                    {group.title}
                  </h3>
                  <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
                    {group.items.map((item) => (
                      <li
                        key={item}
                        className="border-l-2 border-mist/80 pl-3 text-[0.95rem] font-semibold leading-snug text-ink-soft"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <Link
              to="/services"
              className="mt-8 inline-flex h-11 w-full items-center justify-center rounded-[0.35rem] bg-signal px-5 text-[0.94rem] font-semibold text-white hover:bg-signal-deep sm:w-auto"
            >
              Explore all services
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section className="page-x section-y mx-auto max-w-[1160px]" id="faq" aria-labelledby="faq-heading">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-[0.9fr_1.1fr] md:items-start md:gap-[clamp(2rem,5vw,4rem)]">
            <div className="md:sticky md:top-[calc(var(--spacing-header)+1.5rem)]">
              <p className={eyebrow}>FAQ</p>
              <h2
                id="faq-heading"
                className="m-0 mb-4 font-display text-[clamp(1.55rem,5vw,2.65rem)] font-extrabold leading-[1.1] tracking-[-0.035em]"
              >
                Common questions.
              </h2>
              <p className="m-0 max-w-none text-[1rem] leading-relaxed text-muted sm:max-w-[36ch] sm:text-[1.05rem]">
                Quick answers about how NEXORA works, what registration includes, and our compliance
                boundaries.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {FAQ_ITEMS.map((item, index) => (
                <details
                  key={item.q}
                  open={index === 0}
                  className="group rounded-[0.35rem] border border-mist bg-white px-4 py-3.5 shadow-[0_4px_16px_rgba(11,19,32,0.04)] open:pb-4 sm:px-5 sm:py-4 sm:open:pb-5 [&_summary]:cursor-pointer [&_summary]:list-none [&_summary]:font-display [&_summary]:text-[0.95rem] [&_summary]:font-bold [&_summary]:tracking-[-0.02em] sm:[&_summary]:text-[1.02rem] [&_summary::-webkit-details-marker]:hidden"
                >
                  <summary className="flex items-start justify-between gap-3 text-left sm:items-center sm:gap-4">
                    {item.q}
                    <span className="shrink-0 text-teal transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  {item.a === 'terms' ? (
                    <p className="mt-3 mb-0 text-[0.98rem] leading-relaxed text-muted">
                      You can review our full Terms &amp; Conditions anytime on the{' '}
                      <Link to="/terms" className="font-bold text-teal hover:underline">
                        Terms page
                      </Link>
                      . Acceptance is required during signup.
                    </p>
                  ) : (
                    <p className="mt-3 mb-0 text-[0.98rem] leading-relaxed text-muted">{item.a}</p>
                  )}
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="page-x pb-[clamp(2.5rem,8vh,5rem)]" id="contact" aria-labelledby="contact-heading">
          <div className="relative mx-auto max-w-[1160px] overflow-hidden bg-[#0f161f] text-white">
            <div
              className="absolute inset-0 opacity-40"
              aria-hidden="true"
              style={{
                backgroundImage:
                  'url(https://images.unsplash.com/photo-1423666639043-f560172c27a7?auto=format&fit=crop&w=1600&q=80)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
            <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(11,19,32,0.92)_0%,rgba(11,19,32,0.75)_100%)]" />
            <div className="relative grid grid-cols-1 gap-6 p-5 sm:gap-8 sm:p-[clamp(2rem,5vw,3.5rem)] md:grid-cols-[1fr_auto] md:items-end">
              <div>
                <p className={`${eyebrow} text-[#8fd4c8]`}>Contact Us</p>
                <h2
                  id="contact-heading"
                  className="m-0 mb-4 font-display text-[clamp(1.55rem,5vw,2.65rem)] font-extrabold leading-[1.1] tracking-[-0.035em]"
                >
                  Start a conversation.
                </h2>
                <p className="m-0 mb-5 max-w-none text-[1rem] leading-relaxed text-white/75 sm:max-w-[42ch] sm:text-[1.05rem]">
                  For partnership, campaign, or compliance-related queries, reach us through our
                  official support channel.
                </p>
                <a
                  className="break-all font-display text-[clamp(0.95rem,4vw,1.35rem)] font-extrabold tracking-[-0.03em] text-white hover:underline"
                  href="mailto:support@nexora-marketing.com"
                >
                  support@nexora-marketing.com
                </a>
              </div>
              <div className="btn-stack md:flex-col">
                <button
                  type="button"
                  className={`${btnSolid} h-11 px-6`}
                  onClick={() => openAuth('signup')}
                >
                  Create account
                </button>
                <a
                  href="mailto:support@nexora-marketing.com"
                  className="inline-flex h-11 items-center justify-center rounded-[0.4rem] border-[1.5px] border-white/50 px-6 text-[0.94rem] font-semibold text-white hover:border-white hover:bg-white/10"
                >
                  Email support
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter onOpenAuth={openAuth} />

      <AuthModal
        open={authMode === 'login'}
        title="Welcome back"
        subtitle="Log in to continue to your Nexora account."
        onClose={closeAuth}
      >
        <LoginForm onSwitchToSignup={() => openAuth('signup')} />
      </AuthModal>

      <AuthModal
        open={authMode === 'signup'}
        title="Create your account"
        subtitle="Start running performance campaigns in minutes."
        onClose={closeAuth}
      >
        <SignupForm onSwitchToLogin={() => openAuth('login')} />
      </AuthModal>
    </div>
  )
}
