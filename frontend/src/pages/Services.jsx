import { Link } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo'
import SiteFooter from '../components/SiteFooter'
import SiteHeader from '../components/SiteHeader'

const SERVICE_GROUPS = [
  {
    title: 'Marketing & Campaigns',
    accent: 'border-signal',
    items: [
      'Promotional Advertising',
      'Performance Marketing',
      'Affiliate Marketing',
      'Campaign Management',
    ],
  },
  {
    title: 'Acquisition & Support',
    accent: 'border-teal',
    items: [
      'Customer Acquisition',
      'Customer Onboarding Support',
      'Digital Marketing Assistance',
      'Lead Verification Support',
    ],
  },
  {
    title: 'Programs & Operations',
    accent: 'border-[#c45a3a]',
    items: ['Internship & Training Programs', 'Work From Home Opportunities'],
  },
]

const CAMPAIGN_SUPPORT = [
  'Demat account opening assistance',
  'Savings / bank account onboarding support',
  'Credit card and eligible product onboarding',
  'Digital promotional campaigns',
  'Customer acquisition & lead generation',
  'Other partner campaigns offered through third-party providers',
]

const kicker = 'mb-3 text-[0.78rem] font-bold uppercase tracking-[0.14em] text-teal'
const btnSolid =
  'inline-flex h-[2.65rem] items-center justify-center rounded-[0.35rem] bg-signal px-5 text-[0.94rem] font-semibold text-white hover:bg-signal-deep'
const btnGhost =
  'inline-flex h-[2.65rem] items-center justify-center rounded-[0.35rem] border-[1.5px] border-white/55 bg-ink/20 px-5 text-[0.94rem] font-semibold text-white hover:border-white hover:bg-white/12'

export default function Services() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <SiteHeader />

      <main>
        <section className="hero-shell relative flex items-end overflow-hidden text-white" aria-label="Services">
          <div className="absolute inset-0" aria-hidden="true">
            <img
              src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=2400&q=80"
              alt=""
              className="h-full w-full object-cover animate-hero-zoom"
            />
            <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(11,19,32,0.9)_0%,rgba(11,19,32,0.58)_50%,rgba(26,122,109,0.35)_100%),linear-gradient(to_top,rgba(11,19,32,0.78)_0%,transparent_48%)]" />
          </div>
          <div className="relative z-1 w-full max-w-xl animate-rise">
            <BrandLogo to={null} size="md" className="mb-4.5 rounded-[0.3rem] shadow-[0_10px_36px_rgba(0,0,0,0.35)]" />
            <h1 className="m-0 mb-4 font-display text-[clamp(1.65rem,6vw,3.4rem)] font-extrabold leading-[1.08] tracking-[-0.04em]">
              Professional marketing &amp; promotional solutions.
            </h1>
            <p className="mb-6 max-w-none text-[clamp(0.98rem,2.5vw,1.15rem)] leading-relaxed text-white/80 sm:max-w-[38ch]">
              NEXORA provides professional marketing and promotional solutions designed to support
              customer acquisition and business growth — with clear boundaries and compliance-first
              delivery.
            </p>
            <div className="btn-stack">
              <a href="#core" className={btnSolid}>
                View services
              </a>
              <Link to="/?auth=signup" className={btnGhost}>
                Get started
              </Link>
            </div>
          </div>
        </section>

        <section
          className="page-x section-y mx-auto max-w-[1160px]"
          id="core"
          aria-labelledby="core-heading"
        >
          <div className="mb-[clamp(2rem,5vh,3rem)] max-w-xl">
            <p className={kicker}>Overview</p>
            <h2
              id="core-heading"
              className="m-0 mb-3.5 font-display text-[clamp(1.55rem,5vw,2.65rem)] font-extrabold leading-[1.1] tracking-[-0.035em]"
            >
              Our core services.
            </h2>
            <p className="m-0 text-[1rem] leading-relaxed text-muted sm:text-[1.05rem]">
              Three focused service groups covering campaigns, acquisition support, and training
              programs for participants and partners.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-x-10 md:gap-y-8">
            {SERVICE_GROUPS.map((group, index) => (
              <div key={group.title} className={`border-t-[3px] pt-4.5 ${group.accent}`}>
                <p className="m-0 mb-2 text-[0.75rem] font-bold uppercase tracking-[0.12em] text-[#7a8b9f]">
                  Group {String.fromCharCode(65 + index)}
                </p>
                <h3 className="m-0 mb-4.5 font-display text-[1.2rem] font-extrabold tracking-[-0.02em] sm:text-[1.35rem]">
                  {group.title}
                </h3>
                <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
                  {group.items.map((item) => (
                    <li
                      key={item}
                      className="border-l-2 border-mist/80 pl-3 text-[0.95rem] font-semibold leading-snug text-ink-soft sm:pl-3.5 sm:text-[0.98rem]"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section
          className="page-x section-y mx-auto grid max-w-[1160px] grid-cols-1 items-start gap-8 md:grid-cols-2 md:gap-[clamp(2rem,5vw,4rem)]"
          aria-labelledby="campaigns-heading"
        >
          <div>
            <p className={kicker}>Campaign support</p>
            <h2
              id="campaigns-heading"
              className="m-0 mb-4.5 font-display text-[clamp(1.45rem,4.5vw,2.35rem)] font-extrabold leading-[1.12] tracking-[-0.035em]"
            >
              Where promotional activity may apply.
            </h2>
            <p className="m-0 mb-4 max-w-none text-[1rem] leading-relaxed text-muted sm:max-w-[42ch] sm:text-[1.02rem]">
              NEXORA operates in promotional advertising, digital outreach, customer acquisition,
              lead generation, and customer onboarding assistance. Activities may include promotional
              or onboarding support relating to third-party products and services.
            </p>
            <p className="m-0 max-w-none text-[1rem] leading-relaxed text-muted sm:max-w-[42ch] sm:text-[1.02rem]">
              Unless expressly stated otherwise, NEXORA does not claim ownership of — or act as the
              issuer/provider of — the underlying third-party product or service.
            </p>
            <p className="mt-4 max-w-none text-[1rem] leading-relaxed text-muted sm:max-w-[42ch] sm:text-[1.02rem]">
              Our support may include introducing relevant services, registering users through
              designated channels, providing procedural guidance, and assisting with the steps
              required to proceed with an application.
            </p>
          </div>
          <ul className="m-0 list-none p-0">
            {CAMPAIGN_SUPPORT.map((item, index) => (
              <li
                key={item}
                className="grid grid-cols-[2.25rem_1fr] items-baseline gap-2.5 border-b border-mist py-4 text-[0.98rem] font-semibold leading-snug text-ink first:border-t sm:grid-cols-[2.75rem_1fr] sm:gap-3.5 sm:py-4 sm:text-[1.02rem]"
              >
                <span className="font-display text-[0.85rem] font-bold text-signal sm:text-[0.9rem]">
                  {String(index + 1).padStart(2, '0')}
                </span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section
          className="grid min-h-112 grid-cols-1 bg-[#0f161f] text-[#e8edf4] md:grid-cols-[0.95fr_1.05fr]"
          aria-labelledby="boundaries-heading"
        >
          <div className="max-h-80 min-h-64 overflow-hidden md:max-h-none" aria-hidden="true">
            <img
              src="/nexora-indian-onboarding-team.png"
              alt=""
              className="h-full w-full object-cover saturate-[0.88] contrast-[1.04]"
            />
          </div>
          <div className="flex flex-col justify-center px-5 py-8 sm:px-[clamp(1.5rem,4vw,3.25rem)] sm:py-[clamp(2.5rem,6vh,4rem)]">
            <p className={`${kicker} text-[#8fd4c8]`}>Guidelines</p>
            <h2
              id="boundaries-heading"
              className="m-0 mb-5 font-display text-[clamp(1.45rem,4.5vw,2.35rem)] font-extrabold leading-[1.12] tracking-[-0.035em] text-white"
            >
              Onboarding &amp; partner boundaries.
            </h2>
            <p className="m-0 mb-4 max-w-none text-[0.95rem] leading-relaxed text-[#9aabbd] sm:max-w-[44ch] sm:text-base">
              Depending on the requirements of a specific campaign, participants may receive
              onboarding assistance relating to eligible financial products or digital services
              offered directly by partner organizations.
            </p>
            <p className="m-0 mb-4 max-w-none text-[0.95rem] leading-relaxed text-[#9aabbd] sm:max-w-[44ch] sm:text-base">
              NEXORA only facilitates promotional activities and onboarding support. Applications,
              account opening, verification, approvals, activation, customer servicing, and product
              management remain solely under the responsibility of the respective organization or
              service provider.
            </p>
            <p className="mt-3 max-w-none border-t-2 border-signal pt-4.5 text-[0.95rem] leading-relaxed text-[#c5d0de] sm:max-w-[44ch]">
              <strong className="font-bold text-white">Notice:</strong> Verification, approval,
              activation, and customer servicing remain under the absolute authority of the
              third-party providers.
            </p>
            <p className="mt-4 max-w-none text-[0.95rem] leading-relaxed text-[#c5d0de] sm:max-w-[44ch]">
              NEXORA never requests OTPs, UPI PINs, ATM PINs, card PINs, CVVs, or passwords. Complete
              authentication steps yourself through the authorized provider’s platform.
            </p>
          </div>
        </section>

        <section
          className="page-x section-y mx-auto max-w-[1160px]"
          aria-labelledby="limits-heading"
        >
          <p className={kicker}>Important limits</p>
          <h2
            id="limits-heading"
            className="m-0 mb-7 font-display text-[clamp(1.45rem,4.5vw,2.35rem)] font-extrabold leading-[1.12] tracking-[-0.035em]"
          >
            What participation does not guarantee.
          </h2>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-x-7 md:gap-y-6">
            <p className="m-0 border-t-2 border-teal pt-4 text-[0.95rem] leading-relaxed text-muted">
              Participation through NEXORA does not guarantee approval of a Demat account, savings
              account, or any financial product — nor any fixed income, guaranteed earning, or
              specific financial return.
            </p>
            <p className="m-0 border-t-2 border-signal pt-4 text-[0.95rem] leading-relaxed text-muted">
              Where commissions or performance-based payments apply, they remain subject to campaign
              terms, eligibility, successful validation of the activity, and NEXORA’s applicable
              payment policies.
            </p>
            <p className="m-0 border-t-2 border-[#c45a3a] pt-4 text-[0.95rem] leading-relaxed text-muted">
              NEXORA does not provide personalized investment advice, stock recommendations,
              portfolio management, or financial planning services merely by facilitating
              promotional or onboarding activities.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-base font-bold text-teal">
            <Link to="/terms" className="hover:underline">
              Read full Terms &amp; Conditions →
            </Link>
            <Link to="/compliance-transparency" className="hover:underline">
              Read Compliance Policy →
            </Link>
            <Link to="/privacy" className="hover:underline">
              Privacy &amp; Security →
            </Link>
          </div>
        </section>

        <section
          className="page-x pb-[clamp(1.5rem,4vh,2rem)]"
          aria-labelledby="launch-heading"
        >
          <div className="mx-auto max-w-[1160px] border-t-[3px] border-teal bg-[radial-gradient(ellipse_80%_120%_at_100%_0%,rgba(26,122,109,0.14),transparent_55%),color-mix(in_srgb,var(--color-mist)_40%,white)] p-5 sm:p-[clamp(2.5rem,6vh,3.5rem)]">
            <p className={kicker}>Ready to launch?</p>
            <h2
              id="launch-heading"
              className="m-0 mb-3.5 font-display text-[clamp(1.45rem,4.5vw,2.35rem)] font-extrabold leading-[1.12] tracking-[-0.035em]"
            >
              Get started with NEXORA.
            </h2>
            <p className="mb-5.5 max-w-none text-[1rem] leading-relaxed text-muted sm:max-w-[42ch] sm:text-[1.05rem]">
              Create an account to access campaign tracking and onboarding guidance, or contact our
              operations team for partnership queries.
            </p>
            <div className="btn-stack">
              <Link to="/?auth=signup" className={btnSolid}>
                Create account
              </Link>
              <a
                href="mailto:support@nexora-marketing.com"
                className="inline-flex h-[2.65rem] items-center justify-center rounded-[0.35rem] border-[1.5px] border-mist bg-transparent px-5 text-[0.94rem] font-semibold text-ink hover:bg-mist/45"
              >
                Contact operations
              </a>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
