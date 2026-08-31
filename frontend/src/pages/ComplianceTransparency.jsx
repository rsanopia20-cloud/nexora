import { Link } from 'react-router-dom'
import SiteFooter from '../components/SiteFooter'
import SiteHeader from '../components/SiteHeader'
import './Legal.css'

const POLICY_SECTIONS = [
  {
    title: '1. About NEXORA',
    paragraphs: [
      `NEXORA is a promotional marketing, customer acquisition, and customer onboarding support platform. We assist users in accessing and proceeding with services offered by independent third-party organizations through designated digital channels and onboarding processes.`,
      `NEXORA operates as an independent support and promotional entity and does not represent itself as a bank, stockbroker, investment adviser, financial institution, or government authority.`,
    ],
  },
  {
    title: '2. Our Role',
    paragraphs: [
      `Our primary role is to create awareness, facilitate customer acquisition, and assist eligible users in proceeding with account-opening and onboarding processes offered by third-party service providers.`,
      `Our general process may include:`,
    ],
    bullets: [
      'Introducing users to relevant third-party services.',
      'Creating or registering users through designated onboarding channels.',
      'Providing procedural guidance for completing the account-opening process.',
      'Assisting users with the steps required to proceed with the relevant third-party application.',
      'Providing general onboarding support until the applicable process is completed.',
    ],
    closing: `All applications, registrations, verification, approvals, activations, and final decisions remain subject to the policies, eligibility criteria, verification procedures, and independent decisions of the respective third-party service provider.`,
  },
  {
    title: '3. Third-Party Services',
    paragraphs: [
      `NEXORA may receive promotional campaigns, referral opportunities, or designated digital links from independent third-party organizations.`,
      `Where applicable, users may be redirected to or provided with third-party platforms or links for completing the relevant process.`,
      `NEXORA does not own, operate, control, or independently determine the terms, eligibility criteria, approval process, products, or services of such third-party organizations.`,
      `Users are advised to review the applicable terms, privacy policies, and disclosures of the respective third-party service provider before proceeding.`,
    ],
  },
  {
    title: '4. NEXORA Is Not a Broker or Investment Adviser',
    paragraphs: ['NEXORA is not a stockbroker, investment adviser, portfolio manager, financial adviser, bank, or financial institution.', 'NEXORA does not:'],
    bullets: [
      'Provide investment recommendations or stock tips.',
      'Recommend the purchase or sale of securities.',
      'Manage or operate users’ investment portfolios.',
      'Make investment decisions on behalf of users.',
      'Guarantee profits, returns, approvals, or financial outcomes.',
      'Promise fixed or assured income from investments.',
      'Collect or manage investment funds from users.',
    ],
    closing: `Any financial or investment-related decision is solely the responsibility of the user and the relevant authorized service provider.`,
  },
  {
    title: '5. Account Opening & Onboarding',
    paragraphs: [
      `NEXORA may assist users in initiating and completing account-opening procedures through designated third-party channels.`,
      `The role of NEXORA is limited to customer acquisition, promotional communication, procedural guidance, and onboarding assistance.`,
      `The final decision regarding account approval, KYC verification, activation, rejection, or continuation is made solely by the respective third-party service provider.`,
      `NEXORA does not guarantee that any account or application will be approved.`,
    ],
  },
  {
    title: '6. Customer Security',
    paragraphs: ['For the protection of customers, NEXORA does not request or collect sensitive authentication credentials such as:'],
    bullets: [
      'OTPs',
      'UPI PINs',
      'ATM PINs',
      'Debit/Credit Card PINs',
      'CVVs',
      'Internet Banking Passwords',
      'Login Passwords',
    ],
    closing: `Customers should never share such confidential credentials with NEXORA representatives or any other person. Any OTP or authentication step required during an account-opening process should be completed directly by the customer through the relevant authorized platform.`,
  },
  {
    title: '7. Transparency & Ethical Communication',
    paragraphs: ['NEXORA is committed to transparent, responsible, and ethical business practices. Our representatives are expected to:'],
    bullets: [
      'Clearly identify themselves and their association with NEXORA.',
      'Provide accurate information regarding the nature of the onboarding process.',
      'Avoid misleading, false, or exaggerated claims.',
      'Never impersonate a bank, broker, government authority, or third-party organization.',
      'Never guarantee account approval, income, profits, or financial returns.',
      'Never misrepresent the relationship between NEXORA and any third-party service provider.',
    ],
  },
  {
    title: '8. Customer Data & Privacy',
    paragraphs: [
      `Information provided by users may be processed for legitimate customer acquisition, registration, onboarding, communication, support, and related business purposes, subject to applicable laws and NEXORA’s Privacy Policy.`,
      `NEXORA is committed to responsible handling of customer information and expects its representatives and associated personnel to maintain appropriate confidentiality and data-security practices.`,
    ],
  },
  {
    title: '9. Customer Responsibility',
    paragraphs: ['Customers are responsible for:'],
    bullets: [
      'Providing accurate information during the onboarding process.',
      'Reviewing the terms and conditions of the relevant third-party service provider.',
      'Completing required verification and KYC procedures themselves where applicable.',
      'Protecting their login credentials and authentication information.',
      'Verifying that they are using legitimate and designated communication channels.',
      'Making their own independent decisions regarding any financial product or service.',
    ],
  },
  {
    title: '10. No Guarantee of Approval or Service',
    paragraphs: [
      `Submission of an application or completion of an onboarding process does not guarantee approval, activation, eligibility, or continuation of any account or service.`,
      `All such decisions are independently made by the relevant third-party service provider according to its applicable policies and procedures.`,
    ],
  },
  {
    title: '11. Prohibited Activities',
    paragraphs: ['NEXORA does not permit its representatives, employees, associates, or participants to engage in:'],
    bullets: [
      'Fraudulent or deceptive activities.',
      'False representation or impersonation.',
      'Misleading advertisements or communications.',
      'Unauthorized collection of sensitive credentials.',
      'Unauthorized use of customer information.',
      'False promises regarding income, profits, returns, or approvals.',
      'Any activity intended to mislead or financially deceive customers.',
    ],
    closing: `Any violation of these requirements may result in termination of association and, where appropriate, reporting to the relevant authorities or initiation of legal action.`,
  },
  {
    title: '12. Complaint & Grievance Redressal',
    paragraphs: [
      `NEXORA is committed to addressing genuine customer concerns in a fair and timely manner.`,
      `Customers may contact NEXORA through the official communication channels published on this website regarding onboarding assistance, complaints, feedback, or suspected misuse of the NEXORA name.`,
      `Complaints will be reviewed according to NEXORA’s internal grievance-handling process and, where applicable, may be referred to the relevant third-party service provider.`,
    ],
  },
  {
    title: '13. Zero-Tolerance Policy',
    paragraphs: [
      `NEXORA maintains a zero-tolerance approach toward fraud, impersonation, misrepresentation, unauthorized data collection, financial deception, misuse of customer information, and other unethical practices.`,
      `NEXORA reserves the right to suspend or terminate any association where there is a reasonable basis to believe that these standards have been violated.`,
    ],
  },
  {
    title: '14. Independent Third-Party Decisions',
    paragraphs: [
      `Where NEXORA facilitates access to a third-party service, the relevant third party remains solely responsible for its own products, services, eligibility requirements, KYC procedures, approvals, terms, and customer-service decisions.`,
      `NEXORA’s involvement is limited to promotional activities, customer acquisition, and onboarding support.`,
    ],
  },
  {
    title: '15. Policy Acknowledgement',
    paragraphs: [
      `By using NEXORA’s website or participating in an onboarding process facilitated by NEXORA, users acknowledge that they understand the nature and limitations of NEXORA’s role and agree to provide accurate information and follow the applicable terms and procedures of the relevant third-party service provider.`,
      `NEXORA is committed to maintaining a transparent, ethical, customer-focused, and responsible business environment.`,
    ],
  },
]

export default function ComplianceTransparency() {
  return (
    <div className="legal-page min-h-screen bg-paper text-ink">
      <SiteHeader />

      <main className="pt-header">
        <section
          className="page-x border-b border-mist bg-[linear-gradient(135deg,#0f161f_0%,#162033_55%,#1a3a4a_100%)] py-[clamp(2rem,6vh,3.25rem)] text-white"
          aria-label="Business, Compliance and Transparency Policy"
        >
          <div className="mx-auto max-w-[48rem]">
            <p className="mb-2 text-[0.78rem] font-bold uppercase tracking-[0.14em] text-[#8fd4c8]">
              Policy
            </p>
            <h1 className="m-0 mb-3 text-[clamp(1.65rem,5vw,2.5rem)] font-bold leading-[1.12] tracking-[-0.03em]">
              NEXORA — Business, Compliance &amp; Transparency Policy
            </h1>
            <p className="m-0 text-[0.98rem] leading-relaxed text-white/75">
              Our role, customer safeguards, third-party boundaries, and ethical operating
              commitments.
            </p>
          </div>
        </section>

        <div className="legal-main">
          {POLICY_SECTIONS.map((section) => (
            <section key={section.title}>
              <h2>{section.title}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {section.bullets ? (
                <ul>
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              ) : null}
              {section.closing ? <p>{section.closing}</p> : null}
            </section>
          ))}

          <section>
            <h2>Related information</h2>
            <p>
              Review the <Link to="/privacy">Privacy &amp; Security Notice</Link> for customer data
              and credential-safety guidance, or read the <Link to="/terms">Terms &amp; Conditions</Link>{' '}
              accepted during signup.
            </p>
            <p>
              For complaints, feedback, or suspected misuse of the NEXORA name, contact{' '}
              <a href="mailto:support@nexora-marketing.com">support@nexora-marketing.com</a>.
            </p>
          </section>

          <p className="legal-footer">© NEXORA / Nexora Bizworks. All Rights Reserved.</p>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
