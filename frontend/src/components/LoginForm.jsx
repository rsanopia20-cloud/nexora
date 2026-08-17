import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import PasswordField from './PasswordField'
import './AuthForms.css'

export default function LoginForm({ onSwitchToSignup }) {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function updateField(event) {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: '' }))
    setFormError('')
  }

  function clientValidate() {
    const next = {}
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = 'Enter a valid email address'
    }
    if (!form.password) {
      next.password = 'Password is required'
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
      await login({
        email: form.email.trim(),
        password: form.password,
      })
      navigate('/dashboard', { replace: true })
    } catch (error) {
      const fieldErrors = {}
      for (const item of error.errors || []) {
        if (item.field) fieldErrors[item.field] = item.message
      }
      setErrors(fieldErrors)
      setFormError(error.message || 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {formError ? <p className="form-banner">{formError}</p> : null}

        <label className="field">
          <span>Email</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={updateField}
            placeholder="you@example.com"
          />
          {errors.email ? <em>{errors.email}</em> : null}
        </label>

        <PasswordField
          label="Password"
          name="password"
          value={form.password}
          onChange={updateField}
          placeholder="Your password"
          autoComplete="current-password"
          error={errors.password}
        />

        <button className="btn btn-solid btn-block" type="submit" disabled={submitting}>
          {submitting ? 'Signing in...' : 'Log in'}
        </button>
      </form>

      <p className="auth-switch">
        New to Nexora?{' '}
        <button type="button" className="auth-switch-btn" onClick={onSwitchToSignup}>
          Sign up
        </button>
      </p>
    </>
  )
}
