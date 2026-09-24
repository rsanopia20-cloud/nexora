import { useState } from 'react'
import { apiRequest } from '../api/client'
import './AuthForms.css'

export default function ForgotPasswordForm({ onSwitchToLogin }) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [fieldError, setFieldError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setFieldError('')
    setSuccess('')

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFieldError('Enter a valid email address')
      return
    }

    setSubmitting(true)
    try {
      const data = await apiRequest('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() }),
      })
      setSuccess(data.message || 'If an account exists for this email, we sent a reset link.')
    } catch (err) {
      const emailError = (err.errors || []).find((item) => item.field === 'email')
      if (emailError) setFieldError(emailError.message)
      setError(err.message || 'Unable to send the reset email')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {error ? <p className="form-banner">{error}</p> : null}
        {success ? <p className="form-banner form-banner-success">{success}</p> : null}

        <label className="field">
          <span>Email</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
              setFieldError('')
              setError('')
            }}
            placeholder="you@example.com"
            disabled={submitting}
          />
          {fieldError ? <em>{fieldError}</em> : null}
        </label>

        <button className="btn btn-solid btn-block" type="submit" disabled={submitting || Boolean(success)}>
          {submitting ? 'Sending link...' : 'Send reset link'}
        </button>
      </form>

      <p className="auth-switch">
        Remember your password?{' '}
        <button type="button" className="auth-switch-btn" onClick={onSwitchToLogin}>
          Log in
        </button>
      </p>
    </>
  )
}
