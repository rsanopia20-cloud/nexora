import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest, setToken } from '../api/client'
import { useAuth } from '../context/AuthContext'
import PasswordField from './PasswordField'
import './AuthForms.css'

export default function ResetPasswordForm({ token, onRequestNewLink }) {
  const { setUser } = useAuth()
  const navigate = useNavigate()
  const tokenValid = /^[a-f0-9]{64}$/.test(token || '')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function updatePassword(event) {
    setPassword(event.target.value)
    setErrors((prev) => ({ ...prev, password: '' }))
    setFormError('')
  }

  function updateConfirm(event) {
    setConfirmPassword(event.target.value)
    setErrors((prev) => ({ ...prev, confirmPassword: '' }))
    setFormError('')
  }

  function clientValidate() {
    const next = {}
    if (password.length < 8) {
      next.password = 'Password must be at least 8 characters'
    } else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      next.password = 'Password must include a letter and a number'
    }
    if (confirmPassword !== password) {
      next.confirmPassword = 'Passwords do not match'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!clientValidate()) return

    setSubmitting(true)
    setFormError('')
    try {
      const data = await apiRequest('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password, confirmPassword }),
      })
      setToken(data.token)
      setUser(data.user)
      navigate('/dashboard', { replace: true })
    } catch (error) {
      const fieldErrors = {}
      for (const item of error.errors || []) {
        if (item.field) fieldErrors[item.field] = item.message
      }
      setErrors(fieldErrors)
      setFormError(error.message || 'Unable to reset password')
    } finally {
      setSubmitting(false)
    }
  }

  if (!tokenValid) {
    return (
      <>
        <p className="form-banner">This reset link is invalid or has expired.</p>
        <p className="auth-switch">
          <button type="button" className="auth-switch-btn" onClick={onRequestNewLink}>
            Request a new link
          </button>
        </p>
      </>
    )
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      {formError ? <p className="form-banner">{formError}</p> : null}
      <PasswordField
        label="New password"
        name="password"
        value={password}
        onChange={updatePassword}
        placeholder="New password"
        autoComplete="new-password"
        disabled={submitting}
        error={errors.password}
      />
      <PasswordField
        label="Confirm password"
        name="confirmPassword"
        value={confirmPassword}
        onChange={updateConfirm}
        placeholder="Re-enter password"
        autoComplete="new-password"
        disabled={submitting}
        error={errors.confirmPassword}
      />
      <button className="btn btn-solid btn-block" type="submit" disabled={submitting}>
        {submitting ? 'Signing in...' : 'Update password'}
      </button>
    </form>
  )
}
