import { useState } from 'react'
import BrandLogo from '../components/BrandLogo'
import { useAdminAuth } from '../context/AdminAuthContext'
import '../components/AuthForms.css'
import './Auth.css'

export default function AdminLogin() {
  const { login } = useAdminAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      await login({ email: email.trim(), password })
    } catch (err) {
      setError(err.message || 'Unable to log in')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <BrandLogo to="/" size="sm" className="auth-brand-logo" />
        <h1>Admin login</h1>
        <p className="auth-subtitle">Sign in to manage campaigns, links, and users.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error ? <p className="form-banner">{error}</p> : null}

          <label className="field">
            <span>Email</span>
            <input
              type="email"
              name="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@nexora.com"
              required
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              required
            />
          </label>

          <button className="btn btn-solid btn-block" type="submit" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Log in'}
          </button>
        </form>
      </div>
    </div>
  )
}
