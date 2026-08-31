import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiRequest } from '../api/client'
import ConfirmDialog from '../components/ConfirmDialog'
import DashboardFooter from '../components/DashboardFooter'
import DashboardHeader from '../components/DashboardHeader'
import { useAuth } from '../context/AuthContext'
import { consumePendingWhatsApp, peekPendingWhatsApp } from '../utils/whatsappHandoff'

const eyebrow = 'mb-2 text-[0.78rem] font-bold uppercase tracking-[0.14em] text-teal'

function formatDate(value) {
  if (!value) return '—'
  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(value))
  } catch {
    return '—'
  }
}

function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`
}

function formatHost(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

const STEPS = [
  {
    title: 'Review your offers',
    body: 'Each active campaign appears in My offers with its destination partner and current status.',
  },
  {
    title: 'Open once per account',
    body: 'Click Open offer to launch the real destination. Each offer can only be redeemed once on your account.',
  },
  {
    title: 'Complete onboarding with the partner',
    body: 'Verification, approval, and product servicing remain under the third-party provider — not Nexora.',
  },
]

const GUIDELINES = [
  'NEXORA is a promotional advertising platform — not a bank, broker, or investment advisor.',
  'Participation does not guarantee approvals, fixed income, or specific returns.',
  'Submit accurate information when partners request KYC or onboarding details.',
  'Contact support for campaign or compliance questions before sharing sensitive data elsewhere.',
]

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [clickingId, setClickingId] = useState(null)
  const [linkMessages, setLinkMessages] = useState({})
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [logoutBusy, setLogoutBusy] = useState(false)
  const [whatsappHandoff, setWhatsappHandoff] = useState(false)
  const [whatsappUrl, setWhatsappUrl] = useState('')
  const [earnings, setEarnings] = useState(null)
  const [earningsLoading, setEarningsLoading] = useState(true)
  const [earningsError, setEarningsError] = useState('')

  useEffect(() => {
    // Peek only — React Strict Mode remounts this effect and would otherwise
    // delete the URL on the first run, then cancel the redirect timer.
    const waLink = peekPendingWhatsApp()
    if (!waLink) return undefined

    setWhatsappHandoff(true)
    setWhatsappUrl(waLink)
    const timer = window.setTimeout(() => {
      consumePendingWhatsApp()
      window.location.assign(waLink)
    }, 600)

    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadEarnings() {
      setEarningsLoading(true)
      setEarningsError('')
      try {
        const data = await apiRequest('/api/conversions/me')
        if (!cancelled) setEarnings(data)
      } catch (err) {
        if (!cancelled) setEarningsError(err.message || 'Failed to load earnings')
      } finally {
        if (!cancelled) setEarningsLoading(false)
      }
    }

    loadEarnings()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        const data = await apiRequest('/api/user/links')
        if (!cancelled) setLinks(data.links || [])
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load your offers')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const stats = useMemo(() => {
    const total = links.length
    const used = links.filter((link) => link.wasUsed).length
    return {
      total,
      used,
      available: total - used,
    }
  }, [links])

  function requestLogout() {
    setLogoutOpen(true)
  }

  async function confirmLogout() {
    setLogoutBusy(true)
    try {
      await logout()
      navigate('/', { replace: true })
    } finally {
      setLogoutBusy(false)
      setLogoutOpen(false)
    }
  }

  async function handleLinkClick(link) {
    const linkId = link.linkId
    setClickingId(linkId)
    setLinkMessages((prev) => {
      const next = { ...prev }
      delete next[linkId]
      return next
    })

    try {
      const data = await apiRequest('/api/links/click', {
        method: 'POST',
        body: JSON.stringify({ linkId }),
      })

      if (data.alreadyUsed) {
        setLinkMessages((prev) => ({
          ...prev,
          [linkId]: "You've already used this offer on your account.",
        }))
        setLinks((prev) =>
          prev.map((item) =>
            item.linkId === linkId ? { ...item, wasUsed: true } : item
          )
        )
        return
      }

      if (data.destination) {
        setLinks((prev) =>
          prev.map((item) =>
            item.linkId === linkId
              ? { ...item, wasUsed: true, usedAt: new Date().toISOString() }
              : item
          )
        )
        window.open(data.destination, '_blank', 'noopener,noreferrer')
      }
    } catch (err) {
      setLinkMessages((prev) => ({
        ...prev,
        [linkId]: err.message || 'Unable to open offer',
      }))
    } finally {
      setClickingId(null)
    }
  }

  const firstName = user?.fullName?.split(/\s+/)[0] || 'there'

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_80%_50%_at_100%_0%,rgba(26,122,109,0.1),transparent_55%),radial-gradient(ellipse_60%_40%_at_0%_100%,rgba(255,59,31,0.06),transparent_50%),var(--color-paper)] text-ink">
      <DashboardHeader user={user} onLogout={requestLogout} />

      <main className="pt-[4.25rem] sm:pt-header">
        {whatsappHandoff ? (
          <div className="page-x pt-4">
            <p className="mx-auto mb-0 max-w-[1160px] rounded-[0.4rem] bg-teal/12 px-4 py-3 text-[0.92rem] font-semibold text-teal">
              Account created. Opening WhatsApp with your offer links...{' '}
              {whatsappUrl ? (
                <a
                  href={whatsappUrl}
                  className="underline underline-offset-2"
                  onClick={() => consumePendingWhatsApp()}
                >
                  Open WhatsApp
                </a>
              ) : null}
            </p>
          </div>
        ) : null}
        {/* Overview */}
        <section
          id="overview"
          className="scroll-anchor page-x pb-[clamp(1.75rem,5vh,3rem)] pt-[clamp(1rem,3vh,2.5rem)]"
          aria-labelledby="dash-welcome"
        >
          <div className="mx-auto max-w-[1160px]">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:gap-10">
              <div>
                <p className={eyebrow}>Participant dashboard</p>
                <h1
                  id="dash-welcome"
                  className="m-0 mb-3 text-[clamp(1.45rem,5vw,2.75rem)] font-bold leading-[1.12] tracking-[-0.03em] sm:font-extrabold sm:leading-[1.08] sm:tracking-[-0.04em]"
                >
                  Welcome back, {firstName}.
                </h1>
                <p className="m-0 max-w-none text-[0.95rem] leading-relaxed text-muted sm:max-w-[48ch] sm:text-[1.05rem]">
                  Your campaign offers are listed below. Each link opens the real partner destination
                  once — clicks are tracked securely to your account.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5 min-[420px]:grid-cols-3 sm:gap-3">
                {[
                  { label: 'Total offers', shortLabel: 'Total', value: stats.total, accent: 'border-teal' },
                  { label: 'Available', shortLabel: 'Available', value: stats.available, accent: 'border-signal' },
                  { label: 'Completed', shortLabel: 'Done', value: stats.used, accent: 'border-[#7a8b9f]' },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className={`flex min-[420px]:block items-center justify-between gap-3 rounded-[0.4rem] border-t-[3px] bg-white px-4 py-3 shadow-[0_6px_20px_rgba(11,19,32,0.05)] min-[420px]:px-3 min-[420px]:py-3.5 sm:px-4 sm:py-4 ${stat.accent}`}
                  >
                    <p className="m-0 text-[0.72rem] font-bold uppercase tracking-[0.08em] text-muted sm:text-[0.75rem]">
                      <span className="min-[420px]:hidden">{stat.shortLabel}</span>
                      <span className="hidden min-[420px]:inline">{stat.label}</span>
                    </p>
                    <p className="m-0 text-[1.35rem] font-bold tracking-[-0.03em] min-[420px]:mt-1 sm:text-[1.75rem]">
                      {loading ? '—' : stat.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-2.5 sm:mt-6 sm:grid-cols-3 sm:gap-4">
              <a
                href="#offers"
                className="flex items-center gap-3 rounded-[0.4rem] border border-mist bg-white p-3.5 shadow-[0_4px_16px_rgba(11,19,32,0.04)] transition-colors hover:border-teal/40 sm:p-4"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.35rem] bg-teal/12 text-sm font-bold text-teal sm:h-10 sm:w-10">
                  01
                </span>
                <div className="min-w-0">
                  <p className="m-0 text-[0.92rem] font-bold tracking-[-0.02em] sm:text-[0.95rem]">View offers</p>
                  <p className="m-0 text-[0.82rem] text-muted sm:text-[0.85rem]">Open active campaigns</p>
                </div>
              </a>
              <a
                href="#account"
                className="flex items-center gap-3 rounded-[0.4rem] border border-mist bg-white p-3.5 shadow-[0_4px_16px_rgba(11,19,32,0.04)] transition-colors hover:border-teal/40 sm:p-4"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.35rem] bg-signal/12 text-sm font-bold text-signal sm:h-10 sm:w-10">
                  02
                </span>
                <div className="min-w-0">
                  <p className="m-0 text-[0.92rem] font-bold tracking-[-0.02em] sm:text-[0.95rem]">Your account</p>
                  <p className="m-0 text-[0.82rem] text-muted sm:text-[0.85rem]">Profile &amp; registration details</p>
                </div>
              </a>
              <a
                href="#earnings"
                className="flex items-center gap-3 rounded-[0.4rem] border border-mist bg-white p-3.5 shadow-[0_4px_16px_rgba(11,19,32,0.04)] transition-colors hover:border-teal/40 sm:p-4"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.35rem] bg-teal/12 text-sm font-bold text-teal sm:h-10 sm:w-10">
                  ₹
                </span>
                <div className="min-w-0">
                  <p className="m-0 text-[0.92rem] font-bold tracking-[-0.02em] sm:text-[0.95rem]">
                    My earnings
                  </p>
                  <p className="m-0 text-[0.82rem] text-muted sm:text-[0.85rem]">
                    Track earned, paid, pending
                  </p>
                </div>
              </a>
              <a
                href="mailto:support@nexorabizworks.com,info@nexorabizworks.com"
                className="flex items-center gap-3 rounded-[0.4rem] border border-mist bg-white p-3.5 shadow-[0_4px_16px_rgba(11,19,32,0.04)] transition-colors hover:border-teal/40 sm:p-4"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.35rem] bg-[#0f161f]/8 text-sm font-bold text-ink sm:h-10 sm:w-10">
                  03
                </span>
                <div className="min-w-0">
                  <p className="m-0 text-[0.92rem] font-bold tracking-[-0.02em] sm:text-[0.95rem]">Get support</p>
                  <p className="m-0 text-[0.82rem] text-muted sm:text-[0.85rem]">Email our operations team</p>
                </div>
              </a>
            </div>
          </div>
        </section>

        {/* Offers */}
        <section
          id="offers"
          className="scroll-anchor page-x py-[clamp(2rem,6vh,5rem)] mx-auto max-w-[1160px]"
          aria-labelledby="offers-heading"
        >
          <div className="mb-5 flex flex-col gap-1.5 sm:mb-8 sm:flex-row sm:items-end sm:justify-between sm:gap-2">
            <div>
              <p className={eyebrow}>Campaign links</p>
              <h2
                id="offers-heading"
                className="m-0 text-[clamp(1.35rem,4.5vw,2.2rem)] font-bold leading-[1.12] tracking-[-0.03em] sm:font-extrabold sm:leading-[1.1] sm:tracking-[-0.035em]"
              >
                My offers
              </h2>
            </div>
            {!loading ? (
              <span className="text-[0.85rem] font-semibold text-muted sm:text-[0.9rem]">
                {stats.available} available · {stats.used} completed
              </span>
            ) : null}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {[1, 2].map((n) => (
                <div
                  key={n}
                  className="h-44 animate-pulse rounded-[0.45rem] border border-mist bg-white/80"
                  aria-hidden="true"
                />
              ))}
            </div>
          ) : null}

          {error ? (
            <div className="rounded-[0.4rem] border border-signal/30 bg-signal/8 px-4 py-3.5 text-[0.95rem] font-semibold text-signal-deep">
              {error}
            </div>
          ) : null}

          {!loading && !error && !links.length ? (
            <div className="rounded-[0.45rem] border border-mist bg-white p-6 text-center shadow-[0_6px_24px_rgba(11,19,32,0.05)] sm:p-8">
              <p className="m-0 mb-2 font-display text-[1.15rem] font-bold tracking-[-0.02em]">
                No offers available right now
              </p>
              <p className="m-0 mb-5 text-[0.95rem] leading-relaxed text-muted">
                New campaigns are added by the Nexora operations team. Check back soon or contact
                support if you expected an offer.
              </p>
              <a
                href="mailto:support@nexorabizworks.com,info@nexorabizworks.com"
                className="inline-flex h-11 w-full items-center justify-center rounded-[0.35rem] bg-signal px-5 text-[0.94rem] font-semibold text-white hover:bg-signal-deep sm:w-auto"
              >
                Contact support
              </a>
            </div>
          ) : null}

          {!loading && links.length ? (
            <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 md:grid-cols-2 md:gap-5">
              {links.map((link) => {
                const isUsed = link.wasUsed
                const message = linkMessages[link.linkId]

                return (
                  <li
                    key={link.linkId}
                    className="flex flex-col rounded-[0.45rem] border border-mist bg-white p-4 shadow-[0_6px_24px_rgba(11,19,32,0.05)] sm:p-6"
                  >
                    <div className="mb-3 flex flex-col items-start gap-2 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
                      <h3 className="m-0 min-w-0 text-[1.02rem] font-bold tracking-[-0.02em] sm:text-[1.15rem]">
                        {link.name}
                      </h3>
                      <span
                        className={`inline-flex shrink-0 items-center rounded-[0.25rem] px-2 py-0.5 text-[0.68rem] font-bold uppercase tracking-[0.06em] sm:text-[0.7rem] ${
                          isUsed
                            ? 'bg-[#eef1f5] text-muted'
                            : 'bg-teal/12 text-teal'
                        }`}
                      >
                        {isUsed ? 'Completed' : 'Available'}
                      </span>
                    </div>

                    <p className="m-0 mb-1 text-[0.72rem] font-bold uppercase tracking-[0.08em] text-muted sm:text-[0.78rem]">
                      Destination
                    </p>
                    <p className="m-0 mb-4 min-w-0">
                      <span className="block text-[0.92rem] font-semibold text-ink sm:text-[0.95rem]">
                        {formatHost(link.destination)}
                      </span>
                      <span className="mt-1 hidden break-all font-mono text-[0.82rem] leading-relaxed text-muted sm:block">
                        {link.destination}
                      </span>
                    </p>

                    {isUsed && link.usedAt ? (
                      <p className="m-0 mb-4 text-[0.85rem] text-muted">
                        Opened on {formatDate(link.usedAt)}
                      </p>
                    ) : null}

                    {message ? (
                      <p className="m-0 mb-4 text-[0.88rem] font-semibold text-signal-deep">{message}</p>
                    ) : null}

                    <div className="mt-auto pt-1">
                      <button
                        type="button"
                        className={`inline-flex h-11 w-full items-center justify-center rounded-[0.35rem] text-[0.94rem] font-semibold ${
                          isUsed
                            ? 'cursor-not-allowed border border-mist bg-[#eef1f5] text-muted'
                            : 'bg-signal text-white hover:bg-signal-deep disabled:opacity-70'
                        }`}
                        disabled={isUsed || clickingId === link.linkId}
                        onClick={() => handleLinkClick(link)}
                      >
                        {clickingId === link.linkId
                          ? 'Opening…'
                          : isUsed
                            ? 'Already opened'
                            : 'Open offer'}
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : null}
        </section>

        {/* Earnings */}
        <section
          id="earnings"
          className="scroll-anchor page-x py-[clamp(2rem,6vh,5rem)] mx-auto max-w-[1160px]"
          aria-labelledby="earnings-heading"
        >
          <div className="mb-5 flex flex-col gap-1.5 sm:mb-8 sm:flex-row sm:items-end sm:justify-between sm:gap-2">
            <div>
              <p className={eyebrow}>Payments</p>
              <h2
                id="earnings-heading"
                className="m-0 text-[clamp(1.35rem,4.5vw,2.2rem)] font-bold leading-[1.12] tracking-[-0.03em] sm:font-extrabold sm:leading-[1.1] sm:tracking-[-0.035em]"
              >
                My earnings
              </h2>
            </div>
          </div>

          {earningsLoading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-24 animate-pulse rounded-[0.45rem] border border-mist bg-white/80"
                  aria-hidden="true"
                />
              ))}
            </div>
          ) : null}

          {earningsError ? (
            <div className="rounded-[0.4rem] border border-signal/30 bg-signal/8 px-4 py-3.5 text-[0.95rem] font-semibold text-signal-deep">
              {earningsError}
            </div>
          ) : null}

          {!earningsLoading && !earningsError ? (
            <>
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3 sm:gap-4">
                <div className="rounded-[0.4rem] border-t-[3px] border-teal bg-white px-4 py-3 shadow-[0_6px_20px_rgba(11,19,32,0.05)]">
                  <p className="m-0 text-[0.74rem] font-bold uppercase tracking-[0.08em] text-muted">
                    Total earned
                  </p>
                  <p className="m-0 mt-1 text-[1.35rem] font-bold tracking-[-0.03em] sm:text-[1.65rem]">
                    {formatCurrency(earnings?.totalEarned)}
                  </p>
                </div>
                <div className="rounded-[0.4rem] border-t-[3px] border-[#7a8b9f] bg-white px-4 py-3 shadow-[0_6px_20px_rgba(11,19,32,0.05)]">
                  <p className="m-0 text-[0.74rem] font-bold uppercase tracking-[0.08em] text-muted">
                    Total paid
                  </p>
                  <p className="m-0 mt-1 text-[1.35rem] font-bold tracking-[-0.03em] sm:text-[1.65rem]">
                    {formatCurrency(earnings?.totalPaid)}
                  </p>
                </div>
                <div className="rounded-[0.4rem] border-t-[3px] border-signal bg-white px-4 py-3 shadow-[0_6px_20px_rgba(11,19,32,0.05)]">
                  <p className="m-0 text-[0.74rem] font-bold uppercase tracking-[0.08em] text-muted">
                    Total pending
                  </p>
                  <p className="m-0 mt-1 text-[1.35rem] font-bold tracking-[-0.03em] sm:text-[1.65rem]">
                    {formatCurrency(earnings?.totalPending)}
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-[0.45rem] border border-mist bg-white p-4 shadow-[0_6px_24px_rgba(11,19,32,0.05)] sm:p-6">
                <h3 className="m-0 mb-3 text-[1rem] font-bold tracking-[-0.02em] sm:text-[1.05rem]">
                  By campaign link
                </h3>
                {!earnings?.byLink?.length ? (
                  <p className="m-0 text-[0.92rem] text-muted">No payable accounts yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-[560px] w-full border-collapse text-left text-[0.9rem]">
                      <thead>
                        <tr className="border-b border-mist text-[0.72rem] uppercase tracking-[0.06em] text-muted">
                          <th className="py-2.5 pr-3">Link</th>
                          <th className="py-2.5 pr-3">Accounts</th>
                          <th className="py-2.5 pr-3">Earned</th>
                        </tr>
                      </thead>
                      <tbody>
                        {earnings.byLink.map((row) => (
                          <tr key={String(row.linkId)} className="border-b border-mist/70">
                            <td className="py-2.5 pr-3 font-semibold">{row.linkName || 'Unknown link'}</td>
                            <td className="py-2.5 pr-3">{row.accountCount || 0}</td>
                            <td className="py-2.5 pr-3">{formatCurrency(row.totalEarned)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="mt-5 rounded-[0.45rem] border border-mist bg-white p-4 shadow-[0_6px_24px_rgba(11,19,32,0.05)] sm:p-6">
                <h3 className="m-0 mb-3 text-[1rem] font-bold tracking-[-0.02em] sm:text-[1.05rem]">
                  Earnings records
                </h3>
                {!earnings?.records?.length ? (
                  <p className="m-0 text-[0.92rem] text-muted">No payable records yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-[760px] w-full border-collapse text-left text-[0.9rem]">
                      <thead>
                        <tr className="border-b border-mist text-[0.72rem] uppercase tracking-[0.06em] text-muted">
                          <th className="py-2.5 pr-3">Account</th>
                          <th className="py-2.5 pr-3">App status</th>
                          <th className="py-2.5 pr-3">Amount</th>
                          <th className="py-2.5 pr-3">Payment</th>
                          <th className="py-2.5 pr-3">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {earnings.records.map((record) => (
                          <tr key={String(record.id)} className="border-b border-mist/70">
                            <td className="py-2.5 pr-3 font-semibold">
                              {record.clientName || 'Referred account'}
                            </td>
                            <td className="py-2.5 pr-3">{record.appStatus || '—'}</td>
                            <td className="py-2.5 pr-3">{formatCurrency(record.commissionAmount)}</td>
                            <td className="py-2.5 pr-3">
                              <span
                                className={`inline-flex rounded-[999px] px-2 py-0.5 text-[0.72rem] font-bold uppercase tracking-[0.05em] ${
                                  record.paidStatus
                                    ? 'bg-teal/12 text-teal'
                                    : 'bg-signal/12 text-signal-deep'
                                }`}
                              >
                                {record.paidStatus ? 'Paid' : 'Pending'}
                              </span>
                            </td>
                            <td className="py-2.5 pr-3">{formatDate(record.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </section>

        {/* Account */}
        <section
          id="account"
          className="scroll-anchor page-x py-[clamp(2rem,6vh,5rem)] mx-auto max-w-[1160px]"
          aria-labelledby="account-heading"
        >
          <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-[1fr_0.9fr] lg:gap-10">
            <div className="rounded-[0.45rem] border border-mist bg-white p-4 shadow-[0_6px_24px_rgba(11,19,32,0.05)] sm:p-6">
              <p className={eyebrow}>Your profile</p>
              <h2
                id="account-heading"
                className="m-0 mb-5 text-[clamp(1.25rem,4vw,1.85rem)] font-bold tracking-[-0.03em] sm:font-extrabold"
              >
                Account details
              </h2>
              <dl className="m-0 grid grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-4">
                {[
                  { label: 'Full name', value: user?.fullName },
                  { label: 'Email', value: user?.email },
                  { label: 'Mobile', value: user?.mobile },
                  { label: 'Member since', value: formatDate(user?.createdAt) },
                ].map((field) => (
                  <div key={field.label} className="border-t border-mist pt-3.5">
                    <dt className="text-[0.72rem] font-bold uppercase tracking-[0.08em] text-muted">
                      {field.label}
                    </dt>
                    <dd className="m-0 mt-1 break-all text-[0.98rem] font-semibold text-ink">
                      {field.value || '—'}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="flex flex-col gap-4 sm:gap-5">
              <div className="rounded-[0.45rem] border-t-[3px] border-teal bg-[#0f161f] p-4 text-[#e8edf4] sm:p-6">
                <p className={`${eyebrow} text-[#8fd4c8]`}>Account status</p>
                <p className="m-0 mb-2 text-[1.02rem] font-bold tracking-[-0.02em] sm:text-[1.1rem]">
                  Active participant
                </p>
                <p className="m-0 text-[0.9rem] leading-relaxed text-[#9aabbd] sm:text-[0.92rem]">
                  Your registration is complete. Campaign activity is logged against this account for
                  compliance and one-time offer redemption.
                </p>
              </div>
              <div className="rounded-[0.45rem] border border-mist bg-white p-4 sm:p-6">
                <p className="m-0 mb-2 text-[0.92rem] font-bold tracking-[-0.02em] sm:text-[0.95rem]">
                  Legal &amp; compliance
                </p>
                <p className="m-0 mb-4 text-[0.9rem] leading-relaxed text-muted sm:text-[0.92rem]">
                  Review the Terms &amp; Conditions you accepted at signup for campaign rules,
                  eligibility, and payment policies.
                </p>
                <Link
                  to="/terms"
                  className="inline-flex min-h-10 w-full items-center font-bold text-teal hover:underline sm:w-auto"
                >
                  Read Terms &amp; Conditions →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Help */}
        <section
          id="help"
          className="scroll-anchor page-x pb-[clamp(2rem,6vh,4rem)] sm:pb-[clamp(2.5rem,8vh,5rem)]"
          aria-labelledby="help-heading"
        >
          <div className="mx-auto max-w-[1160px]">
            <p className={eyebrow}>Help &amp; guidelines</p>
            <h2
              id="help-heading"
              className="m-0 mb-5 text-[clamp(1.35rem,4.5vw,2.2rem)] font-bold leading-[1.12] tracking-[-0.03em] sm:mb-6 sm:font-extrabold sm:leading-[1.1] sm:tracking-[-0.035em]"
            >
              How your dashboard works
            </h2>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 md:gap-5">
              {STEPS.map((step, index) => (
                <div
                  key={step.title}
                  className="rounded-[0.4rem] border border-mist bg-white p-4 shadow-[0_4px_16px_rgba(11,19,32,0.04)] sm:p-5"
                >
                  <span className="text-[0.82rem] font-bold text-signal sm:text-[0.85rem]">
                    Step {String(index + 1).padStart(2, '0')}
                  </span>
                  <h3 className="m-0 mb-2 mt-2 text-[0.98rem] font-bold tracking-[-0.02em] sm:text-[1.02rem]">
                    {step.title}
                  </h3>
                  <p className="m-0 text-[0.9rem] leading-relaxed text-muted sm:text-[0.92rem]">{step.body}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-[0.45rem] border border-mist bg-white p-4 sm:mt-6 sm:p-6">
              <h3 className="m-0 mb-3.5 text-[0.98rem] font-bold tracking-[-0.02em] sm:mb-4 sm:text-[1rem]">
                Important reminders
              </h3>
              <ul className="m-0 flex list-none flex-col gap-3 p-0">
                {GUIDELINES.map((item) => (
                  <li
                    key={item}
                    className="grid grid-cols-[1.25rem_1fr] gap-2.5 text-[0.92rem] leading-relaxed text-muted"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative mt-5 overflow-hidden rounded-[0.45rem] bg-[#0f161f] text-white sm:mt-6">
              <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(11,19,32,0.94)_0%,rgba(11,19,32,0.78)_100%)]" />
              <div className="relative grid grid-cols-1 gap-4 p-4 sm:gap-6 sm:p-[clamp(1.75rem,4vw,2.5rem)] md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <p className={`${eyebrow} text-[#8fd4c8]`}>Need assistance?</p>
                  <p className="m-0 mb-2 text-[clamp(1.1rem,3.5vw,1.5rem)] font-bold tracking-[-0.03em] sm:font-extrabold">
                    Our operations team can help.
                  </p>
                  <p className="m-0 max-w-none text-[0.92rem] leading-relaxed text-white/75 sm:max-w-[42ch] sm:text-[0.95rem]">
                    For campaign questions, onboarding issues, or compliance concerns, email us
                    directly.
                  </p>
                </div>
                <div className="btn-stack md:!flex-col md:items-stretch">
                  <a
                    href="mailto:support@nexorabizworks.com,info@nexorabizworks.com"
                    className="inline-flex h-11 w-full items-center justify-center rounded-[0.35rem] bg-signal px-6 text-[0.94rem] font-semibold text-white hover:bg-signal-deep md:min-w-[11rem]"
                  >
                    Email support
                  </a>
                  <Link
                    to="/#faq"
                    className="inline-flex h-11 w-full items-center justify-center rounded-[0.35rem] border-[1.5px] border-white/50 px-6 text-[0.94rem] font-semibold text-white hover:border-white hover:bg-white/10 md:min-w-[11rem]"
                  >
                    View public FAQ
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <DashboardFooter onLogout={requestLogout} />
      <ConfirmDialog
        open={logoutOpen}
        title="Log out?"
        message="Are you sure you want to log out of your account?"
        confirmLabel="Log out"
        cancelLabel="Cancel"
        busy={logoutBusy}
        onConfirm={confirmLogout}
        onCancel={() => {
          if (!logoutBusy) setLogoutOpen(false)
        }}
      />
    </div>
  )
}
