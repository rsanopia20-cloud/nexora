import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useManagerAuth } from '../context/ManagerAuthContext'
import PasswordField from './PasswordField'
import './AuthForms.css'

export default function ManagerLoginForm({ onSwitchToUserLogin }) {
  const { login } = useManagerAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ managerId: '', password: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function updateField(event) {
    const { name, value } = event.target
    const nextValue = name === 'managerId' ? value.toUpperCase() : value
    setForm((prev) => ({ ...prev, [name]: nextValue }))
    setErrors((prev) => ({ ...prev, [name]: '' }))
    setFormError('')
  }

  function clientValidate() {
    const next = {}
    if (!form.managerId.trim()) {
      next.managerId = 'Manager ID is required'
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
        managerId: form.managerId.trim().toUpperCase(),
        password: form.password,
      })
      navigate('/manager', { replace: true })
    } catch (error) {
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
          <span>Manager ID</span>
          <input
            name="managerId"
            type="text"
            autoComplete="username"
            value={form.managerId}
            onChange={updateField}
            placeholder="e.g. MGR1A2B3C"
          />
          {errors.managerId ? <em>{errors.managerId}</em> : null}
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
          {submitting ? 'Signing in...' : 'Log in as manager'}
        </button>
      </form>

      <p className="auth-switch">
        Not a manager?{' '}
        <button type="button" className="auth-switch-btn" onClick={onSwitchToUserLogin}>
          User login
        </button>
      </p>
    </>
  )
}
