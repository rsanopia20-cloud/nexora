import { useEffect, useState } from 'react'
import './AuthForms.css'

const EMPTY = {
  bankName: '',
  accountHolderName: '',
  accountNumber: '',
  ifscCode: '',
}

function validateClient(form) {
  const errors = {}
  const bankName = form.bankName.trim()
  const accountHolderName = form.accountHolderName.trim()
  const accountNumber = form.accountNumber.replace(/\s+/g, '')
  const ifscCode = form.ifscCode.trim().toUpperCase()

  if (bankName.length < 2) errors.bankName = 'Enter the bank name'
  else if (!/^[A-Za-z0-9 .,&'()-]+$/.test(bankName)) {
    errors.bankName = 'Bank name contains invalid characters'
  }

  if (accountHolderName.length < 2) {
    errors.accountHolderName = 'Enter the account holder name'
  } else if (!/^[A-Za-z .']+$/.test(accountHolderName)) {
    errors.accountHolderName = 'Use letters, spaces, dots, or apostrophes only'
  }

  if (!/^\d{9,18}$/.test(accountNumber)) {
    errors.accountNumber = 'Account number must be 9 to 18 digits'
  }

  if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode)) {
    errors.ifscCode = 'Enter a valid IFSC (e.g. SBIN0001234)'
  }

  return errors
}

/**
 * Shared bank-details form for user dashboard and manager panel.
 * `variant`: "user" | "admin" — admin uses admin.css field classes.
 */
export default function BankDetailsForm({
  initialValues,
  onSave,
  variant = 'user',
}) {
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setForm({
      bankName: initialValues?.bankName || '',
      accountHolderName: initialValues?.accountHolderName || '',
      accountNumber: initialValues?.accountNumber || '',
      ifscCode: initialValues?.ifscCode || '',
    })
  }, [
    initialValues?.bankName,
    initialValues?.accountHolderName,
    initialValues?.accountNumber,
    initialValues?.ifscCode,
  ])

  function updateField(event) {
    const { name, value } = event.target
    let next = value
    if (name === 'ifscCode') next = value.toUpperCase()
    if (name === 'accountNumber') next = value.replace(/[^\d]/g, '')
    setForm((prev) => ({ ...prev, [name]: next }))
    setErrors((prev) => ({ ...prev, [name]: '' }))
    setFormError('')
    setSuccess('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validateClient(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    setSaving(true)
    setFormError('')
    setSuccess('')
    try {
      await onSave({
        bankName: form.bankName.trim(),
        accountHolderName: form.accountHolderName.trim(),
        accountNumber: form.accountNumber.replace(/\s+/g, ''),
        ifscCode: form.ifscCode.trim().toUpperCase(),
      })
      setSuccess('Bank details saved.')
    } catch (err) {
      const fieldErrors = {}
      for (const item of err.errors || []) {
        if (item.field) fieldErrors[item.field] = item.message
      }
      if (Object.keys(fieldErrors).length) setErrors(fieldErrors)
      setFormError(err.message || 'Unable to save bank details')
    } finally {
      setSaving(false)
    }
  }

  const isAdmin = variant === 'admin'
  const inputClass = isAdmin ? 'admin-search' : undefined

  return (
    <form className={isAdmin ? 'admin-form' : 'auth-form'} onSubmit={handleSubmit} noValidate>
      {formError ? <p className={isAdmin ? 'admin-error' : 'form-banner'}>{formError}</p> : null}
      {success ? (
        <p className={isAdmin ? 'admin-success' : 'form-banner form-banner-success'}>{success}</p>
      ) : null}

      <label className={isAdmin ? undefined : 'field'}>
        <span>Bank name</span>
        <input
          className={inputClass}
          name="bankName"
          value={form.bankName}
          onChange={updateField}
          placeholder="e.g. State Bank of India"
          autoComplete="organization"
          disabled={saving}
        />
        {errors.bankName ? <em>{errors.bankName}</em> : null}
      </label>

      <label className={isAdmin ? undefined : 'field'}>
        <span>Account holder name</span>
        <input
          className={inputClass}
          name="accountHolderName"
          value={form.accountHolderName}
          onChange={updateField}
          placeholder="Name as on bank account"
          autoComplete="name"
          disabled={saving}
        />
        {errors.accountHolderName ? <em>{errors.accountHolderName}</em> : null}
      </label>

      <label className={isAdmin ? undefined : 'field'}>
        <span>Account number</span>
        <input
          className={inputClass}
          name="accountNumber"
          value={form.accountNumber}
          onChange={updateField}
          placeholder="9–18 digit account number"
          inputMode="numeric"
          autoComplete="off"
          disabled={saving}
        />
        {errors.accountNumber ? <em>{errors.accountNumber}</em> : null}
      </label>

      <label className={isAdmin ? undefined : 'field'}>
        <span>IFSC code</span>
        <input
          className={inputClass}
          name="ifscCode"
          value={form.ifscCode}
          onChange={updateField}
          placeholder="e.g. SBIN0001234"
          maxLength={11}
          autoComplete="off"
          disabled={saving}
        />
        {errors.ifscCode ? <em>{errors.ifscCode}</em> : null}
      </label>

      <button
        type="submit"
        className={isAdmin ? 'admin-btn' : 'btn btn-solid btn-block'}
        disabled={saving}
      >
        {saving ? 'Saving…' : 'Save bank details'}
      </button>
    </form>
  )
}

export function BankDetailsReadOnly({ bankDetails, className = '' }) {
  const data = bankDetails || EMPTY
  const complete = Boolean(
    data.bankName && data.accountHolderName && data.accountNumber && data.ifscCode
  )

  if (!complete) {
    return (
      <p className={`admin-section-note ${className}`.trim()}>
        Bank details not added yet.
      </p>
    )
  }

  return (
    <div className={`admin-meta ${className}`.trim()}>
      <div className="admin-meta-card">
        <span>Bank name</span>
        <strong>{data.bankName}</strong>
      </div>
      <div className="admin-meta-card">
        <span>Account holder</span>
        <strong>{data.accountHolderName}</strong>
      </div>
      <div className="admin-meta-card">
        <span>Account number</span>
        <strong>{data.accountNumber}</strong>
      </div>
      <div className="admin-meta-card">
        <span>IFSC</span>
        <strong>{data.ifscCode}</strong>
      </div>
    </div>
  )
}
