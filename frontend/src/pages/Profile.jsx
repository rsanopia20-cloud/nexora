import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiRequest } from '../api/client'
import BankDetailsForm from '../components/BankDetailsForm'
import ConfirmDialog from '../components/ConfirmDialog'
import DashboardFooter from '../components/DashboardFooter'
import DashboardHeader from '../components/DashboardHeader'
import { useAuth } from '../context/AuthContext'
import '../components/AuthForms.css'

const eyebrow = 'mb-2 text-[0.78rem] font-bold uppercase tracking-[0.14em] text-teal'

const editButtonClass =
  'inline-flex h-10 shrink-0 items-center justify-center rounded-[0.35rem] border border-mist bg-white px-4 text-[0.9rem] font-semibold text-ink hover:border-teal'

function formatDate(value) {
  if (!value) return '�'
  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(value))
  } catch {
    return '�'
  }
}

function validateProfile(form) {
  const errors = {}
  const fullName = form.fullName.trim()
  const email = form.email.trim()
  const mobile = form.mobile.trim()

  if (fullName.length < 2 || fullName.length > 80) {
    errors.fullName = 'Full name must be between 2 and 80 characters'
  } else if (!/^[a-zA-Z\s.'-]+$/.test(fullName)) {
    errors.fullName = 'Full name can only contain letters and basic punctuation'
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Enter a valid email address'
  }

  if (!/^[6-9]\d{9}$/.test(mobile)) {
    errors.mobile = 'Enter a valid 10-digit Indian mobile number'
  }

  return errors
}

function savedProfile(user) {
  return {
    fullName: user?.fullName || '',
    email: user?.email || '',
    mobile: user?.mobile || '',
  }
}

function hasBankDetails(bank) {
  return Boolean(bank?.bankName && bank?.accountHolderName && bank?.accountNumber && bank?.ifscCode)
}

function DetailList({ items }) {
  return (
    <dl className="m-0 grid grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-4">
      {items.map((field) => (
        <div key={field.label} className="border-t border-mist pt-3.5">
          <dt className="text-[0.72rem] font-bold uppercase tracking-[0.08em] text-muted">
            {field.label}
          </dt>
          <dd className="m-0 mt-1 break-all text-[0.98rem] font-semibold text-ink">
            {field.value || '�'}
          </dd>
        </div>
      ))}
    </dl>
  )
}

export default function Profile() {
  const { user, logout, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', email: '', mobile: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingProfile, setEditingProfile] = useState(false)
  const [editingBank, setEditingBank] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [logoutBusy, setLogoutBusy] = useState(false)

  useEffect(() => {
    if (!editingProfile) setForm(savedProfile(user))
  }, [editingProfile, user?.fullName, user?.email, user?.mobile])

  function updateField(event) {
    const { name, value } = event.target
    const next = name === 'mobile' ? value.replace(/[^\d]/g, '').slice(0, 10) : value
    setForm((prev) => ({ ...prev, [name]: next }))
    setErrors((prev) => ({ ...prev, [name]: '' }))
    setFormError('')
    setSuccess('')
  }

  function startProfileEdit() {
    setForm(savedProfile(user))
    setErrors({})
    setFormError('')
    setSuccess('')
    setEditingProfile(true)
  }

  function cancelProfileEdit() {
    setForm(savedProfile(user))
    setErrors({})
    setFormError('')
    setEditingProfile(false)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validateProfile(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    setSaving(true)
    setFormError('')
    setSuccess('')
    try {
      await apiRequest('/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          mobile: form.mobile.trim(),
        }),
      })
      await refreshUser()
      setEditingProfile(false)
      setSuccess('Profile updated.')
    } catch (err) {
      const fieldErrors = {}
      for (const item of err.errors || []) {
        if (item.field) fieldErrors[item.field] = item.message
      }
      if (Object.keys(fieldErrors).length) setErrors(fieldErrors)
      setFormError(err.message || 'Unable to update profile')
    } finally {
      setSaving(false)
    }
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

  const bank = user?.bankDetails
  const bankSaved = hasBankDetails(bank)

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_80%_50%_at_100%_0%,rgba(26,122,109,0.1),transparent_55%),radial-gradient(ellipse_60%_40%_at_0%_100%,rgba(255,59,31,0.06),transparent_50%),var(--color-paper)] text-ink">
      <DashboardHeader user={user} onLogout={() => setLogoutOpen(true)} />

      <main className="pt-[4.25rem] sm:pt-header">
        <section className="page-x py-[clamp(1.5rem,5vh,3rem)]">
          <div className="mx-auto grid max-w-[1160px] grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-[1fr_0.9fr] lg:gap-10">
            <div className="min-w-0 rounded-[0.45rem] border border-mist bg-white p-4 shadow-[0_6px_24px_rgba(11,19,32,0.05)] sm:p-6">
              <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className={eyebrow}>Your profile</p>
                  <h1 className="m-0 mb-2 text-[clamp(1.35rem,4vw,1.85rem)] font-bold tracking-[-0.03em] sm:font-extrabold">
                    Account details
                  </h1>
                  <p className="m-0 text-[0.9rem] leading-relaxed text-muted">
                    These details are the ones shown to the Nexora admin team. Member since{' '}
                    {formatDate(user?.createdAt)}.
                  </p>
                </div>
                {editingProfile ? null : (
                  <button type="button" className={editButtonClass} onClick={startProfileEdit}>
                    Edit
                  </button>
                )}
              </div>

              {formError ? <p className="form-banner mb-4">{formError}</p> : null}
              {success ? <p className="form-banner form-banner-success mb-4">{success}</p> : null}

              {editingProfile ? (
                <form className="auth-form" onSubmit={handleSubmit} noValidate>
                  <label className="field">
                    <span>Full name</span>
                    <input
                      name="fullName"
                      value={form.fullName}
                      onChange={updateField}
                      autoComplete="name"
                      disabled={saving}
                    />
                    {errors.fullName ? <em>{errors.fullName}</em> : null}
                  </label>

                  <label className="field">
                    <span>Email</span>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={updateField}
                      autoComplete="email"
                      disabled={saving}
                    />
                    {errors.email ? <em>{errors.email}</em> : null}
                  </label>

                  <label className="field">
                    <span>Mobile</span>
                    <input
                      name="mobile"
                      value={form.mobile}
                      onChange={updateField}
                      inputMode="numeric"
                      autoComplete="tel"
                      disabled={saving}
                    />
                    {errors.mobile ? <em>{errors.mobile}</em> : null}
                  </label>

                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    <button type="submit" className="btn btn-solid btn-block" disabled={saving}>
                      {saving ? 'Saving�' : 'Save profile'}
                    </button>
                    <button
                      type="button"
                      className={editButtonClass}
                      onClick={cancelProfileEdit}
                      disabled={saving}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <DetailList
                  items={[
                    { label: 'Full name', value: user?.fullName },
                    { label: 'Email', value: user?.email },
                    { label: 'Mobile', value: user?.mobile },
                    { label: 'Member since', value: formatDate(user?.createdAt) },
                  ]}
                />
              )}

              <div className="mt-6 border-t border-mist pt-5">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="m-0 mb-1 text-[1rem] font-bold tracking-[-0.02em]">
                      Bank details for payout
                    </h2>
                    <p className="m-0 text-[0.88rem] leading-relaxed text-muted">
                      Saved payout account. Edit only when you need to change it.
                    </p>
                  </div>
                  {editingBank ? null : (
                    <button
                      type="button"
                      className={editButtonClass}
                      onClick={() => setEditingBank(true)}
                    >
                      {bankSaved ? 'Edit' : 'Add bank details'}
                    </button>
                  )}
                </div>

                {editingBank ? (
                  <>
                    <BankDetailsForm
                      initialValues={bank}
                      onSave={async (payload) => {
                        await apiRequest('/api/user/bank-details', {
                          method: 'PUT',
                          body: JSON.stringify(payload),
                        })
                        await refreshUser()
                        setEditingBank(false)
                      }}
                    />
                    <button
                      type="button"
                      className={`${editButtonClass} mt-3 w-full sm:w-auto`}
                      onClick={() => setEditingBank(false)}
                    >
                      Cancel
                    </button>
                  </>
                ) : bankSaved ? (
                  <DetailList
                    items={[
                      { label: 'Bank name', value: bank.bankName },
                      { label: 'Account holder', value: bank.accountHolderName },
                      { label: 'Account number', value: bank.accountNumber },
                      { label: 'IFSC', value: bank.ifscCode },
                    ]}
                  />
                ) : (
                  <p className="m-0 text-[0.92rem] text-muted">Bank details not added yet.</p>
                )}
              </div>
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
                  Read Terms &amp; Conditions ?
                </Link>
              </div>
              <Link
                to="/dashboard"
                className="inline-flex min-h-10 items-center font-bold text-teal hover:underline"
              >
                ? Back to dashboard
              </Link>
            </div>
          </div>
        </section>
      </main>

      <DashboardFooter onLogout={() => setLogoutOpen(true)} />
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
