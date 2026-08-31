import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { stashPendingWhatsApp } from '../utils/whatsappHandoff'
import PasswordField from './PasswordField'
import './AuthForms.css'

const initialForm = {
  fullName: '',
  mobile: '',
  email: '',
  password: '',
  confirmPassword: '',
}

export default function SignupForm({ onSwitchToLogin }) {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)

  function updateField(event) {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: '' }))
    setFormError('')
  }

  function clientValidate() {
    const next = {}

    if (!form.fullName.trim() || form.fullName.trim().length < 2) {
      next.fullName = 'Enter your full name'
    }
    if (!/^[6-9]\d{9}$/.test(form.mobile.trim())) {
      next.mobile = 'Enter a valid 10-digit mobile number'
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = 'Enter a valid email address'
    }
    if (form.password.length < 8) {
      next.password = 'Password must be at least 8 characters'
    } else if (!/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) {
      next.password = 'Password must include a letter and a number'
    }
    if (form.confirmPassword !== form.password) {
      next.confirmPassword = 'Passwords do not match'
    }
    if (!acceptedTerms) {
      next.acceptedTerms = 'You must accept the Terms and Conditions'
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!acceptedTerms) {
      setErrors((prev) => ({
        ...prev,
        acceptedTerms: 'You must accept the Terms and Conditions',
      }))
      return
    }
    if (!clientValidate()) return

    setSubmitting(true)
    setFormError('')
    setStatusMessage('')

    try {
      const data = await signup({
        fullName: form.fullName.trim(),
        mobile: form.mobile.trim(),
        email: form.email.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
      })

      stashPendingWhatsApp(data.waLink)
      navigate('/dashboard', { replace: true })
    } catch (error) {
      const fieldErrors = {}
      for (const item of error.errors || []) {
        if (item.field) fieldErrors[item.field] = item.message
      }
      setErrors(fieldErrors)
      setFormError(error.message || 'Signup failed')
      setSubmitting(false)
    }
  }

  return (
    <>
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {formError ? <p className="form-banner">{formError}</p> : null}
        {statusMessage ? (
          <p className="form-banner form-banner-success">{statusMessage}</p>
        ) : null}

        <label className="field">
          <span>Full name</span>
          <input
            name="fullName"
            type="text"
            autoComplete="name"
            value={form.fullName}
            onChange={updateField}
            placeholder="Your full name"
            disabled={submitting}
          />
          {errors.fullName ? <em>{errors.fullName}</em> : null}
        </label>

        <label className="field">
          <span>Mobile number</span>
          <input
            name="mobile"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            value={form.mobile}
            onChange={updateField}
            placeholder="10-digit mobile"
            maxLength={10}
            disabled={submitting}
          />
          {errors.mobile ? <em>{errors.mobile}</em> : null}
        </label>

        <label className="field">
          <span>Email</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={updateField}
            placeholder="you@example.com"
            disabled={submitting}
          />
          {errors.email ? <em>{errors.email}</em> : null}
        </label>

        <PasswordField
          label="Password"
          name="password"
          value={form.password}
          onChange={updateField}
          placeholder="Min. 8 characters"
          autoComplete="new-password"
          disabled={submitting}
          error={errors.password}
        />

        <PasswordField
          label="Confirm password"
          name="confirmPassword"
          value={form.confirmPassword}
          onChange={updateField}
          placeholder="Re-enter password"
          autoComplete="new-password"
          disabled={submitting}
          error={errors.confirmPassword}
        />

        <label className="terms-check">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(event) => {
              setAcceptedTerms(event.target.checked)
              setErrors((prev) => ({ ...prev, acceptedTerms: '' }))
            }}
            disabled={submitting}
          />
          <span>
            I accept the{' '}
            <a href="/terms" target="_blank" rel="noreferrer">
              Terms and Conditions
            </a>
          </span>
        </label>
        {errors.acceptedTerms ? <em className="terms-error">{errors.acceptedTerms}</em> : null}
        <p className="m-0 text-[0.82rem] leading-relaxed text-muted">
          NEXORA never asks for OTPs, PINs, CVVs, or passwords. Read our{' '}
          <a href="/privacy" target="_blank" rel="noreferrer">
            Privacy &amp; Security Notice
          </a>{' '}
          before continuing.
        </p>

        <button
          className="btn btn-solid btn-block"
          type="submit"
          disabled={!acceptedTerms || submitting}
        >
          {submitting ? 'Creating your account...' : 'Sign up'}
        </button>
      </form>

      <p className="auth-switch">
        Already have an account?{' '}
        <button type="button" className="auth-switch-btn" onClick={onSwitchToLogin}>
          Log in
        </button>
      </p>
    </>
  )
}
