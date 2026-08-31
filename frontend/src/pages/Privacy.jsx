import { Link } from 'react-router-dom'
import SiteFooter from '../components/SiteFooter'
import SiteHeader from '../components/SiteHeader'
import './Legal.css'

const SECURITY_CREDENTIALS = [
  'OTPs',
  'UPI PINs',
  'ATM PINs',
  'Debit/Credit Card PINs',
  'CVVs',
  'Internet Banking Passwords',
  'Login Passwords',
]

const CUSTOMER_RESPONSIBILITIES = [
  'Providing accurate information during the onboarding process.',
  'Reviewing the terms and conditions of the relevant third-party service provider.',
  'Completing required verification and KYC procedures themselves where applicable.',
  'Protecting their login credentials and authentication information.',
  'Verifying that they are using legitimate and designated communication channels.',
  'Making their own independent decisions regarding any financial product or service.',
]

export default function Privacy() {
  return (
    <div className="legal-page min-h-screen bg-paper text-ink">
      <SiteHeader />

      <main className="pt-header">
        <section
          className="page-x border-b border-mist bg-[linear-gradient(135deg,#0f161f_0%,#162033_55%,#1a3a4a_100%)] py-[clamp(2rem,6vh,3.25rem)] text-white"
          aria-label="Privacy and Security Notice"
        >
          <div className="mx-auto max-w-[48rem]">
            <p className="mb-2 text-[0.78rem] font-bold uppercase tracking-[0.14em] text-[#8fd4c8]">
              Customer protection
            </p>
            <h1 className="m-0 mb-3 text-[clamp(1.65rem,5vw,2.5rem)] font-bold leading-[1.12] tracking-[-0.03em]">
              Privacy &amp; Security Notice
            </h1>
            <p className="m-0 text-[0.98rem] leading-relaxed text-white/75">
              How NEXORA handles customer information and protects authentication credentials.
            </p>
          </div>
        </section>

        <div className="legal-main">
          <section>
            <h2>Customer Security</h2>
            <p>
              For the protection of customers, NEXORA does not request or collect sensitive
              authentication credentials such as:
            </p>
            <ul>
              {SECURITY_CREDENTIALS.map((credential) => (
                <li key={credential}>{credential}</li>
              ))}
            </ul>
            <p>
              Customers should never share such confidential credentials with NEXORA
              representatives or any other person. Any OTP or authentication step required during
              an account-opening process should be completed directly by the customer through the
              relevant authorized platform.
            </p>
          </section>

          <section>
            <h2>Customer Data &amp; Privacy</h2>
            <p>
              Information provided by users may be processed for legitimate customer acquisition,
              registration, onboarding, communication, support, and related business purposes,
              subject to applicable laws and NEXORA’s Privacy Policy.
            </p>
            <p>
              NEXORA is committed to responsible handling of customer information and expects its
              representatives and associated personnel to maintain appropriate confidentiality and
              data-security practices.
            </p>
            <p>
              Where KYC is required for a third-party product, information may be submitted
              directly to that provider’s platform. Customers should submit accurate, complete,
              and up-to-date information.
            </p>
          </section>

          <section>
            <h2>Customer Responsibility</h2>
            <p>Customers are responsible for:</p>
            <ul>
              {CUSTOMER_RESPONSIBILITIES.map((responsibility) => (
                <li key={responsibility}>{responsibility}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2>Third-Party Platforms</h2>
            <p>
              Account opening, KYC, authentication, verification, approval, activation, and
              servicing may take place through the relevant third-party provider. Those providers
              maintain their own terms, privacy policies, security practices, and eligibility
              requirements.
            </p>
            <p>
              Users should review the applicable information before proceeding. NEXORA’s role is
              limited to promotional communication, customer acquisition, procedural guidance, and
              onboarding support.
            </p>
          </section>

          <section>
            <h2>Report a Concern</h2>
            <p>
              If someone claiming to represent NEXORA asks for an OTP, PIN, CVV, password, or
              other confidential credential, do not share it. Contact us immediately at{' '}
              <a href="mailto:support@nexorabizworks.com">support@nexorabizworks.com</a> or{' '}
              <a href="mailto:info@nexorabizworks.com">info@nexorabizworks.com</a>.
            </p>
            <p>
              See the <Link to="/compliance-transparency">Business, Compliance &amp; Transparency Policy</Link>{' '}
              for the complete description of NEXORA’s role and operating standards.
            </p>
          </section>

          <p className="legal-footer">© NEXORA / Nexora Bizworks. All Rights Reserved.</p>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
