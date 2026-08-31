import { Link } from 'react-router-dom'
import SiteFooter from '../components/SiteFooter'
import SiteHeader from '../components/SiteHeader'
import './Legal.css'

export default function Terms() {
  return (
    <div className="legal-page min-h-screen bg-paper text-ink">
      <SiteHeader />

      <main className="pt-header">
        <section
          className="page-x border-b border-mist bg-[linear-gradient(135deg,#0f161f_0%,#162033_55%,#1a3a4a_100%)] py-[clamp(2rem,6vh,3.25rem)] text-white"
          aria-label="Terms and Conditions"
        >
          <div className="mx-auto max-w-[48rem]">
            <p className="mb-2 text-[0.78rem] font-bold uppercase tracking-[0.14em] text-[#8fd4c8]">
              Legal
            </p>
            <h1 className="m-0 mb-3 text-[clamp(1.65rem,5vw,2.5rem)] font-bold leading-[1.12] tracking-[-0.03em]">
              Terms &amp; Conditions
            </h1>
            <p className="m-0 mb-5 text-[0.92rem] leading-relaxed text-white/72">
              Effective Date: 16 August 2026
              <br />
              Last Updated: 16 August 2026
            </p>
            <Link
              to="/?auth=signup"
              className="inline-flex h-10 items-center justify-center rounded-[0.35rem] bg-signal px-5 text-[0.92rem] font-semibold text-white hover:bg-signal-deep"
            >
              Back to sign up
            </Link>
          </div>
        </section>

        <div className="legal-main">

        <section>
          <h2>1. Introduction</h2>
          <p>
            These Terms &amp; Conditions (“Terms”) govern the registration, participation and use
            of services provided through NEXORA / Nexora Bizworks (“NEXORA”, “we”, “us” or “our”)
            in connection with promotional advertising, digital marketing, customer acquisition,
            lead generation and customer onboarding support activities.
          </p>
          <p>
            Any individual who registers with NEXORA, accesses our website, submits information,
            participates in a campaign, or uses any link, form, portal or onboarding process
            provided through NEXORA shall be referred to as a “Participant”, “User”, “you” or
            “your”.
          </p>
          <p>
            By registering with or participating through NEXORA, you acknowledge that you have
            read, understood and voluntarily agreed to these Terms.
          </p>
        </section>

        <section>
          <h2>2. Nature of NEXORA’s Business</h2>
          <p>
            NEXORA operates primarily in the field of promotional advertising, digital outreach,
            customer acquisition, lead generation and customer onboarding assistance.
          </p>
          <p>
            Our activities may include promotional or onboarding assistance relating to
            third-party products and services, including but not limited to:
          </p>
          <ul>
            <li>Demat account opening;</li>
            <li>Savings/bank account opening;</li>
            <li>Credit card and other eligible financial-product onboarding;</li>
            <li>Digital promotional campaigns;</li>
            <li>Customer acquisition and lead-generation activities;</li>
            <li>Digital marketing and promotional activities; and</li>
            <li>Other services or campaigns offered through third-party service providers.</li>
          </ul>
          <p>
            NEXORA does not represent itself as a bank, stock broker, investment adviser, lending
            institution, insurance company, NBFC, financial institution, or issuer/provider of any
            third-party financial product unless expressly authorized and stated otherwise.
          </p>
        </section>

        <section>
          <h2>3. Third-Party Products, Links and Distribution Channels</h2>
          <p>
            Certain links, URLs, forms, portals, campaigns, applications or onboarding processes
            made available through NEXORA may originate from third-party business partners,
            vendors, agencies, aggregators, platforms, distributors or other business/distribution
            channels.
          </p>
          <p>
            A link or onboarding process may be provided to NEXORA through a multi-level business
            or distribution arrangement involving one or more third parties.
          </p>
          <p>
            NEXORA may not necessarily have a direct contractual relationship with the ultimate
            provider or issuer of every individual product, service, campaign or link.
          </p>
          <p>
            Where applicable, NEXORA acts as a promotional, marketing, customer-acquisition and
            onboarding-support channel and does not represent itself as the owner, issuer, bank,
            broker, lender, insurer or financial institution responsible for the underlying product
            or service.
          </p>
        </section>

        <section>
          <h2>4. Third-Party Applications</h2>
          <p>
            Any application, account opening, KYC process, registration, verification or onboarding
            completed through a third-party platform shall remain subject to the terms, eligibility
            criteria, policies and verification procedures of the respective third-party provider.
          </p>
          <p>NEXORA does not control and cannot guarantee:</p>
          <ul>
            <li>Approval or rejection of an application;</li>
            <li>KYC verification;</li>
            <li>Account activation;</li>
            <li>Product eligibility;</li>
            <li>Credit limits or benefits;</li>
            <li>Pricing or charges;</li>
            <li>Continuation or closure of an account; or</li>
            <li>Any decision made by the respective third-party provider.</li>
          </ul>
          <p>
            All such decisions are made by the relevant third-party provider according to its own
            policies and applicable requirements.
          </p>
        </section>

        <section>
          <h2>5. No Guarantee of Approval or Earnings</h2>
          <p>Participation through NEXORA does not guarantee:</p>
          <ul>
            <li>Approval of a Demat account;</li>
            <li>Approval of a savings/bank account;</li>
            <li>Approval or issuance of any financial product;</li>
            <li>Any fixed income;</li>
            <li>Any guaranteed earning;</li>
            <li>Any minimum number of successful applications; or</li>
            <li>Any specific financial return.</li>
          </ul>
          <p>
            Where commissions, incentives, performance-based payments or other earnings are
            applicable, they shall be subject to the applicable campaign terms, eligibility
            criteria, successful completion and validation of the relevant activity, and NEXORA’s
            applicable payment policies.
          </p>
        </section>

        <section>
          <h2>6. No Mandatory Product or Course Purchase</h2>
          <p>
            NEXORA does not require Participants to purchase inventory, products, courses, packages
            or memberships merely for registration or participation, unless expressly communicated
            for a specific legitimate service or campaign.
          </p>
          <p>
            Participants should independently review all applicable terms, charges, eligibility
            requirements and policies of the relevant third-party provider before proceeding.
          </p>
        </section>

        <section>
          <h2>7. KYC and Personal Information</h2>
          <p>
            Where KYC or other personal information is required, such information may be submitted
            directly to the relevant third-party provider through its designated platform,
            application, portal or process.
          </p>
          <p>
            Participants are responsible for ensuring that all information submitted by them is
            accurate, complete, genuine and up to date.
          </p>
          <p>
            NEXORA shall not be responsible for rejection, delay, suspension or termination
            resulting from inaccurate, incomplete, inconsistent, fraudulent or unverifiable
            information provided by a Participant.
          </p>
        </section>

        <section>
          <h2>8. No Investment or Financial Advice</h2>
          <p>
            NEXORA does not provide personalized investment advice, stock recommendations,
            portfolio management, investment recommendations or financial planning services merely
            by facilitating promotional or onboarding activities.
          </p>
          <p>
            Participants are responsible for independently reviewing the relevant product
            documentation and making their own decisions regarding any financial product or
            service.
          </p>
        </section>

        <section>
          <h2>9. Promotional and Advertising Activities</h2>
          <p>
            NEXORA may conduct promotional advertising, digital marketing, lead-generation and
            customer-acquisition activities relating to third-party products or services.
          </p>
          <p>
            Unless expressly stated otherwise, NEXORA does not claim ownership of or act as the
            issuer/provider of the underlying third-party product or service.
          </p>
          <p>
            All third-party trademarks, logos, brand names, portals, intellectual property and
            proprietary materials remain the property of their respective owners.
          </p>
        </section>

        <section>
          <h2>10. Participant Responsibilities</h2>
          <p>Participants agree that they shall:</p>
          <ol>
            <li>Provide genuine, accurate and complete information;</li>
            <li>Follow applicable laws and regulations;</li>
            <li>Use links, portals and promotional materials only for legitimate purposes;</li>
            <li>Not impersonate NEXORA or any third-party organization;</li>
            <li>Not make false, misleading or unauthorized representations;</li>
            <li>Not promise guaranteed approval, guaranteed income or guaranteed benefits;</li>
            <li>
              Not collect unauthorized money from customers in the name of NEXORA or any third
              party;
            </li>
            <li>Not misuse, sell, disclose or unlawfully share customer information;</li>
            <li>Follow applicable campaign instructions and compliance requirements; and</li>
            <li>Cooperate with reasonable verification or compliance requirements.</li>
          </ol>
        </section>

        <section>
          <h2>11. Prohibited Activities</h2>
          <p>
            Participants shall not use NEXORA’s name, branding, links, portals or promotional
            materials for:
          </p>
          <ul>
            <li>Fraudulent activities;</li>
            <li>Deceptive or misleading representations;</li>
            <li>Unauthorized financial promises;</li>
            <li>Identity misuse or impersonation;</li>
            <li>Misuse of customer information;</li>
            <li>Manipulation or falsification of applications;</li>
            <li>Unauthorized collection of money; or</li>
            <li>Any unlawful or prohibited activity.</li>
          </ul>
          <p>
            NEXORA reserves the right to suspend or terminate participation where a violation is
            identified and may cooperate with competent authorities where required by applicable
            law.
          </p>
        </section>

        <section>
          <h2>12. Third-Party Terms and Policies</h2>
          <p>
            Third-party websites, applications, portals and services may be governed by their own
            terms of use, privacy policies, KYC requirements, eligibility criteria and other
            applicable policies.
          </p>
          <p>
            Participants are responsible for reviewing and understanding such third-party terms
            before proceeding with an application or service.
          </p>
        </section>

        <section>
          <h2>13. Limitation of Responsibility</h2>
          <p>
            NEXORA shall not be responsible for matters that are solely within the control of a
            third-party provider, including:
          </p>
          <ul>
            <li>Application approval or rejection;</li>
            <li>KYC verification;</li>
            <li>Account activation or closure;</li>
            <li>Technical problems on third-party platforms;</li>
            <li>Changes to eligibility criteria;</li>
            <li>Changes to product features, benefits or charges;</li>
            <li>Third-party policy changes; or</li>
            <li>Delays caused by third-party systems or processes.</li>
          </ul>
        </section>

        <section>
          <h2>14. Compliance and Lawful Operations</h2>
          <p>
            NEXORA intends to conduct its promotional advertising, digital marketing, customer
            acquisition and onboarding-support activities in accordance with applicable laws and
            regulations.
          </p>
          <p>
            Nothing contained in these Terms shall be interpreted as granting NEXORA any banking,
            brokerage, investment-advisory, lending, insurance or other regulated license or
            authorization that NEXORA does not legally hold.
          </p>
          <p>
            Where any particular activity requires a specific regulatory authorization,
            registration, licence or approval, such activity shall be undertaken only through the
            appropriate authorized entity, platform or channel, as applicable.
          </p>
        </section>

        <section>
          <h2>15. Electronic Acceptance</h2>
          <p>
            By selecting “I Agree / I Accept”, registering through the NEXORA website, submitting a
            registration form, or otherwise participating in NEXORA activities, the Participant
            acknowledges that such action constitutes electronic acceptance of these Terms.
          </p>
          <p>
            The electronic acceptance, date/time of acceptance, registered contact details and
            relevant registration information may be retained by NEXORA as evidence of the
            Participant’s acknowledgement and acceptance, subject to applicable law and NEXORA’s
            privacy practices.
          </p>
        </section>

        <section>
          <h2>16. Modification of Terms</h2>
          <p>
            NEXORA reserves the right to update, modify or amend these Terms from time to time.
          </p>
          <p>
            Any updated version may be published on the NEXORA website and shall become effective
            from the date specified in the updated version.
          </p>
        </section>

        <section>
          <h2>17. Governing Law</h2>
          <p>These Terms shall be interpreted in accordance with the applicable laws of India.</p>
          <p>
            Any dispute arising in connection with these Terms shall be subject to the applicable
            jurisdiction of the competent courts and authorities, subject to applicable law.
          </p>
        </section>

        <section>
          <h2>18. Final Acknowledgement</h2>
          <p>By registering with NEXORA or selecting the acceptance checkbox, you confirm that:</p>
          <ul>
            <li>You have read and understood these Terms;</li>
            <li>You voluntarily agree to comply with these Terms;</li>
            <li>You understand that certain products and services may be provided by third parties;</li>
            <li>
              You understand that third-party links may be received through vendors, agencies,
              aggregators or other distribution channels;
            </li>
            <li>
              You understand that NEXORA does not guarantee approval of any third-party
              application;
            </li>
            <li>
              You understand that NEXORA is not the bank, broker, issuer or provider of the
              underlying third-party financial product unless expressly stated;
            </li>
            <li>You agree to comply with applicable laws and third-party terms; and</li>
            <li>
              You understand that false, misleading, fraudulent or unauthorized activities are
              strictly prohibited.
            </li>
          </ul>
          <p>
            For questions or compliance-related matters, please contact NEXORA through the official
            contact details published on the NEXORA website.
          </p>
        </section>

        <section>
          <h2>Important Customer Security Notice</h2>
          <p>
            NEXORA does not request or collect OTPs, UPI PINs, ATM PINs, debit or credit card PINs,
            CVVs, internet banking passwords, or login passwords. Customers should never share
            these confidential credentials with NEXORA representatives or any other person.
          </p>
          <p>
            Complete any OTP or authentication step directly through the relevant authorized
            third-party platform. For the complete business, compliance, transparency, privacy, and
            security information, read our{' '}
            <Link to="/compliance-transparency">Compliance &amp; Transparency Policy</Link> and{' '}
            <Link to="/privacy">Privacy &amp; Security Notice</Link>.
          </p>
        </section>

        <p className="legal-footer">© NEXORA / Nexora Bizworks. All Rights Reserved.</p>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
