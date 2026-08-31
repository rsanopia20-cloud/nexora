import { Link } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo'
import SiteFooter from '../components/SiteFooter'
import SiteHeader from '../components/SiteHeader'

const FOCUS_AREAS = [
  'Promotional advertising & digital outreach',
  'Customer acquisition & lead generation',
  'Campaign management & onboarding support',
  'Eligible third-party product onboarding assistance',
  'Internship & professional training programs',
]

const GUIDES = [
  'Ethical promotional advertising',
  'Transparent campaign communication',
  'Compliance-first operations',
  'Responsible customer engagement',
]

const kicker = 'mb-3 text-[0.78rem] font-bold uppercase tracking-[0.14em] text-teal'
const sectionH2 =
  'm-0 mb-5 font-display text-[clamp(1.45rem,4.5vw,2.4rem)] font-extrabold leading-[1.12] tracking-[-0.035em] text-ink'
const bodyP = 'm-0 mb-4 max-w-none text-[1rem] leading-relaxed text-muted sm:max-w-[44ch] sm:text-[1.02rem]'

export default function About() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <SiteHeader />

      <main>
        <section className="hero-shell relative flex items-end overflow-hidden text-white" aria-label="About Nexora">
          <div className="absolute inset-0 z-0" aria-hidden="true">
            <img
              src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=2400&q=80"
              alt=""
              className="h-full w-full object-cover animate-hero-zoom"
            />
            <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(11,19,32,0.88)_0%,rgba(11,19,32,0.55)_48%,rgba(11,19,32,0.35)_100%),linear-gradient(to_top,rgba(11,19,32,0.75)_0%,transparent_45%)]" />
          </div>
          <div className="relative z-1 w-full max-w-xl animate-rise">
            <BrandLogo to={null} size="md" className="mb-4.5 rounded-[0.3rem] shadow-[0_10px_36px_rgba(0,0,0,0.35)]" />
            <h1 className="m-0 mb-4 font-display text-[clamp(1.65rem,6vw,3.5rem)] font-extrabold leading-[1.08] tracking-[-0.04em]">
              Creating a professional platform for growth.
            </h1>
            <p className="mb-6 max-w-none text-[clamp(0.98rem,2.5vw,1.15rem)] leading-relaxed text-white/80 sm:max-w-[36ch]">
              NEXORA connects businesses and individuals through ethical promotional advertising and
              performance marketing — built for clarity, compliance, and measurable outcomes.
            </p>
            <div className="btn-stack">
              <Link
                to="/?auth=signup"
                className="inline-flex h-[2.65rem] items-center justify-center rounded-[0.35rem] bg-signal px-5 text-[0.94rem] font-semibold text-white hover:bg-signal-deep"
              >
                Get started
              </Link>
              <a
                href="#vision"
                className="inline-flex h-[2.65rem] items-center justify-center rounded-[0.35rem] border-[1.5px] border-white/55 bg-ink/20 px-5 text-[0.94rem] font-semibold text-white hover:border-white hover:bg-white/12"
              >
                Our vision
              </a>
            </div>
          </div>
        </section>

        <section
          className="page-x section-y-lg mx-auto grid max-w-[1160px] grid-cols-1 items-center gap-8 md:grid-cols-[1.05fr_0.95fr] md:gap-[clamp(2rem,5vw,4rem)]"
          id="vision"
          aria-labelledby="vision-heading"
        >
          <div>
            <p className={kicker}>Vision &amp; model</p>
            <h2
              id="vision-heading"
              className="m-0 mb-5 font-display text-[clamp(1.55rem,5vw,2.65rem)] font-extrabold leading-[1.1] tracking-[-0.035em]"
            >
              Trust &amp; transparency.
            </h2>
            <p className={bodyP}>
              We believe successful marketing is built on trust, transparency, compliance, and
              responsible customer engagement.
            </p>
            <p className={bodyP}>
              Our support team helps participants understand campaign execution, promotional
              strategies, and customer onboarding — while keeping every activity aligned with
              professional and ethical standards.
            </p>
            <p className={bodyP}>
              Our representatives identify their association with NEXORA, provide accurate
              information, and never guarantee approval, income, profits, or financial returns.
            </p>
            <p className={`${bodyP} mb-0`}>
              The objective is long-term value for businesses, participants, and customers through
              responsible marketing solutions.
            </p>
          </div>
          <div className="relative animate-rise">
            <img
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1400&q=80"
              alt="Team collaborating on campaign planning"
              className="aspect-16/10 w-full object-cover saturate-[0.92] contrast-[1.04] md:aspect-4/5"
            />
            <p className="absolute inset-x-0 bottom-0 m-0 bg-[linear-gradient(to_top,rgba(11,19,32,0.85),transparent)] px-5 py-4.5 text-[0.78rem] font-bold uppercase tracking-[0.1em] text-white/90">
              Nexora Bizworks · Established 2026
            </p>
          </div>
        </section>

        <section className="page-x py-[clamp(2rem,6vh,3.5rem)] text-[#e8edf4] bg-[#101820]" aria-label="What guides us">
          <p className={`${kicker} mx-auto mb-5 max-w-[1160px] text-[#8fd4c8]`}>What guides us</p>
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

        <section
          className="page-x section-y mx-auto grid max-w-[1160px] grid-cols-1 items-start gap-8 md:grid-cols-2 md:gap-[clamp(2rem,5vw,4rem)]"
          aria-labelledby="nature-heading"
        >
          <div>
            <p className={kicker}>What we do</p>
            <h2 id="nature-heading" className={sectionH2}>
              Promotional advertising &amp; performance marketing.
            </h2>
            <p className={bodyP}>
              NEXORA operates in promotional advertising, digital outreach, customer acquisition,
              lead generation, and onboarding assistance — including support relating to third-party
              products and services where applicable.
            </p>
            <p className={`${bodyP} mb-0`}>
              We act as a promotional and onboarding-support channel. We are not the owner, issuer,
              bank, broker, lender, insurer, or financial institution behind those products.
            </p>
            <p className={`${bodyP} mb-0 mt-4`}>
              Applications, registrations, verification, approvals, activations, and final decisions
              remain subject to the policies and independent decisions of the relevant third-party
              provider.
            </p>
          </div>
          <ol className="m-0 list-none p-0">
            {FOCUS_AREAS.map((item, index) => (
              <li
                key={item}
                className="grid grid-cols-[2.25rem_1fr] items-baseline gap-2.5 border-b border-mist py-4 first:border-t sm:grid-cols-[3rem_1fr] sm:gap-4 sm:py-4.5"
              >
                <span className="font-display text-[0.9rem] font-bold text-signal sm:text-[0.95rem]">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="text-[0.98rem] font-semibold leading-snug text-ink sm:text-[1.05rem]">{item}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="grid min-h-112 grid-cols-1 bg-[#0f161f] text-[#e8edf4] md:grid-cols-[0.95fr_1.05fr]" aria-labelledby="boundary-heading">
          <div className="max-h-80 min-h-64 overflow-hidden md:max-h-none md:min-h-112" aria-hidden="true">
            <img
              src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1600&q=80"
              alt=""
              className="h-full w-full object-cover saturate-[0.85] contrast-[1.05]"
            />
          </div>
          <div className="flex flex-col justify-center px-5 py-8 sm:px-[clamp(1.5rem,4vw,3.25rem)] sm:py-[clamp(2.5rem,6vh,4rem)]">
            <p className={`${kicker} text-[#8fd4c8]`}>Operating boundary</p>
            <h2 id="boundary-heading" className={`${sectionH2} text-white`}>
              Clear limits. No financial advice.
            </h2>
            <p className="m-0 mb-4 max-w-none text-[0.95rem] leading-relaxed text-[#9aabbd] sm:max-w-[44ch] sm:text-base">
              NEXORA is not a bank, stock broker, investment adviser, lending institution, insurance
              company, NBFC, or financial institution — and not the issuer of third-party financial
              products unless expressly authorized and stated.
            </p>
            <p className="m-0 mb-4 max-w-none text-[0.95rem] leading-relaxed text-[#9aabbd] sm:max-w-[44ch] sm:text-base">
              We do not provide personalized investment advice, stock recommendations, portfolio
              management, or financial planning. Participants review product documentation and decide
              independently.
            </p>
            <p className="m-0 max-w-none text-[0.95rem] leading-relaxed text-[#9aabbd] sm:max-w-[44ch] sm:text-base">
              Participation does not guarantee approvals, fixed income, earnings, or returns.
              Incentives, when offered, follow campaign terms, eligibility, validation, and payment
              policies.
            </p>
          </div>
        </section>

        <section
          className="page-x section-y mx-auto grid max-w-[1160px] grid-cols-1 items-center gap-8 md:grid-cols-[1.1fr_0.9fr] md:gap-[clamp(2rem,5vw,3.5rem)]"
          aria-labelledby="privacy-heading"
        >
          <div>
            <p className={kicker}>Privacy commitment</p>
            <h2 id="privacy-heading" className={sectionH2}>
              Data &amp; privacy ethics.
            </h2>
            <p className={bodyP}>
              NEXORA respects the privacy and confidentiality of every participant and customer.
              Personal information is processed only for legitimate business purposes — onboarding
              assistance, customer support, operations, legal compliance, and service improvement —
              in line with applicable laws.
            </p>
            <p className={bodyP}>
              Where KYC is required for a third-party product, details may go directly to that
              provider’s platform. Participants must submit accurate, complete, and up-to-date
              information.
            </p>
            <p className={`${bodyP} mb-0`}>
              NEXORA never requests OTPs, UPI PINs, ATM PINs, card PINs, CVVs, internet banking
              passwords, or login passwords. Complete authentication steps directly through the
              authorized third-party platform.
            </p>
            <div className="mt-6 max-w-[40ch] border-t-[3px] border-signal pt-5">
              <p className="m-0 mb-2 font-display text-[0.8rem] font-bold uppercase tracking-[0.1em] text-ink">
                Security protocol
              </p>
              <p className="m-0 text-[0.95rem] leading-relaxed text-muted">
                User details are processed securely and strictly on a need-to-know basis for
                legitimate operational and compliance purposes.
              </p>
            </div>
          </div>
          <div>
            <img
              src="https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80"
              alt="Secure digital workspace"
              className="aspect-5/4 w-full object-cover saturate-90 contrast-[1.03]"
            />
          </div>
        </section>

        <section
          className="page-x mx-auto max-w-xl pt-4 pb-[clamp(2.5rem,8vh,5rem)]"
          aria-labelledby="compliance-heading"
        >
          <h2
            id="compliance-heading"
            className="m-0 mb-4 font-display text-[clamp(1.35rem,4vw,1.85rem)] font-extrabold leading-[1.12] tracking-[-0.03em]"
          >
            Compliance &amp; lawful operations
          </h2>
          <p className="m-0 mb-4.5 text-base leading-relaxed text-muted">
            NEXORA conducts promotional advertising, digital marketing, customer acquisition, and
            onboarding support in accordance with applicable laws. Nothing on this site grants
            NEXORA any banking, brokerage, investment-advisory, lending, or insurance license it
            does not legally hold.
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-base font-bold text-teal">
            <Link to="/terms" className="hover:underline">
              Read Terms &amp; Conditions →
            </Link>
            <Link to="/compliance-transparency" className="hover:underline">
              Read Compliance Policy →
            </Link>
            <Link to="/privacy" className="hover:underline">
              Privacy &amp; Security →
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
